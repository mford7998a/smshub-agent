import serial
import logging
import re
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime
from ..core.config import settings
from ..models.models import ModemStatus
from ..schemas.modem import ModemUpdate

logger = logging.getLogger(__name__)

class ModemError(Exception):
    pass

class ModemManager:
    def __init__(self, port: str, baudrate: int = 115200, timeout: int = 1):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial: Optional[serial.Serial] = None
        self.lock = asyncio.Lock()
        self.last_signal_check = datetime.min
        self._status = ModemStatus.OFFLINE
        self.signal_quality = 0
        self.imei = None
        self.iccid = None
        self.operator = None
        self.phone_number = None

    async def connect(self) -> bool:
        """Connect to the modem and initialize it."""
        try:
            self.serial = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                timeout=self.timeout
            )
            
            if not self.serial.is_open:
                self.serial.open()
            
            # Initialize modem
            await self.send_command("AT")  # Test command
            await self.send_command("ATE0")  # Disable echo
            await self.send_command("AT+CMGF=1")  # Set SMS text mode
            
            # Get modem info
            self.imei = await self._get_imei()
            self.iccid = await self._get_iccid()
            self.operator = await self._get_operator()
            self.phone_number = await self._get_phone_number()
            
            self._status = ModemStatus.ACTIVE
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to modem {self.port}: {str(e)}")
            self._status = ModemStatus.ERROR
            return False

    async def disconnect(self):
        """Safely disconnect from the modem."""
        if self.serial and self.serial.is_open:
            self.serial.close()
        self._status = ModemStatus.OFFLINE

    async def send_command(self, command: str, timeout: int = 5) -> str:
        """Send AT command to modem and get response."""
        async with self.lock:
            if not self.serial or not self.serial.is_open:
                raise ModemError("Modem not connected")
            
            try:
                # Clear input buffer
                self.serial.reset_input_buffer()
                
                # Send command
                command = command.strip() + "\r\n"
                self.serial.write(command.encode())
                
                # Read response
                response = ""
                start_time = datetime.now()
                
                while True:
                    if (datetime.now() - start_time).seconds > timeout:
                        raise ModemError("Command timeout")
                    
                    if self.serial.in_waiting:
                        line = self.serial.readline().decode().strip()
                        response += line + "\n"
                        
                        if "OK" in line or "ERROR" in line:
                            break
                
                if "ERROR" in response:
                    raise ModemError(f"Command failed: {response}")
                
                return response.strip()
                
            except Exception as e:
                logger.error(f"Failed to send command {command}: {str(e)}")
                raise ModemError(f"Command failed: {str(e)}")

    async def check_signal_quality(self) -> int:
        """Check modem signal quality (0-100%)."""
        try:
            response = await self.send_command("AT+CSQ")
            match = re.search(r"\+CSQ: (\d+),", response)
            if match:
                # Convert CSQ (0-31) to percentage (0-100)
                csq = int(match.group(1))
                self.signal_quality = min(100, int((csq / 31) * 100))
                return self.signal_quality
            raise ModemError("Invalid signal quality response")
        except Exception as e:
            logger.error(f"Failed to check signal quality: {str(e)}")
            return 0

    async def _get_imei(self) -> str:
        """Get modem IMEI number."""
        response = await self.send_command("AT+GSN")
        imei = re.search(r"\d{15}", response)
        if imei:
            return imei.group(0)
        raise ModemError("Failed to get IMEI")

    async def _get_iccid(self) -> str:
        """Get SIM card ICCID."""
        response = await self.send_command("AT+CCID")
        iccid = re.search(r"\d{18,22}", response)
        if iccid:
            return iccid.group(0)
        raise ModemError("Failed to get ICCID")

    async def _get_operator(self) -> str:
        """Get current network operator."""
        response = await self.send_command('AT+COPS?')
        operator = re.search(r'\+COPS: \d,\d,"(.+)"', response)
        if operator:
            return operator.group(1)
        raise ModemError("Failed to get operator")

    async def _get_phone_number(self) -> Optional[str]:
        """Try to get phone number from SIM card."""
        try:
            response = await self.send_command('AT+CNUM')
            number = re.search(r'\+CNUM: ".*?","([+\d]+)"', response)
            if number:
                return number.group(1)
        except:
            logger.warning(f"Could not get phone number for modem {self.port}")
        return None

    async def wait_for_sms(self, callback) -> None:
        """
        Wait for incoming SMS messages and process them using the callback.
        The callback should be an async function that takes (sender, text) as parameters.
        """
        try:
            while True:
                response = await self.send_command('AT+CMGL="ALL"')
                
                # Parse SMS messages
                messages = re.finditer(r'\+CMGL: (\d+),".*?","([^"]+)",[^,]*,[^,]*\r\n(.*?)(?=\+CMGL|\Z)', 
                                     response, re.DOTALL)
                
                for match in messages:
                    index, sender, text = match.groups()
                    # Delete processed message
                    await self.send_command(f'AT+CMGD={index}')
                    # Call callback with message
                    await callback(sender, text)
                
                # Wait before checking again
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Error in SMS monitoring loop: {str(e)}")
            self._status = ModemStatus.ERROR
            raise

    @property
    def status(self) -> ModemStatus:
        return self._status

    @property
    def info(self) -> Dict[str, Any]:
        """Get current modem information."""
        return {
            "port": self.port,
            "status": self._status,
            "signal_quality": self.signal_quality,
            "imei": self.imei,
            "iccid": self.iccid,
            "operator": self.operator,
            "phone_number": self.phone_number
        } 