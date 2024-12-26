import aiohttp
import logging
import json
from typing import Optional, Dict, Any, List
from ..core.config import settings
from ..schemas.activation import (
    GetServicesResponse,
    GetNumberResponse,
    FinishActivationResponse
)
from ..schemas.sms import PushSMSRequest, PushSMSResponse

logger = logging.getLogger(__name__)

class SMSHubError(Exception):
    pass

class SMSHubIntegration:
    def __init__(self, api_key: str, api_url: str = settings.SMSHUB_API_URL):
        self.api_key = api_key
        self.api_url = api_url
        self.session: Optional[aiohttp.ClientSession] = None
        self._countries_cache: Dict[str, Dict[str, List[str]]] = {}
        
    async def __aenter__(self):
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": f"SMSHubAgent/{settings.VERSION}"
                }
            )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            self.session = None

    async def _make_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to SMS Hub API."""
        if not self.session:
            raise SMSHubError("Session not initialized")
            
        try:
            # Add API key to request
            data["key"] = self.api_key
            
            async with self.session.post(self.api_url, json=data) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get("status") == "ERROR":
                    raise SMSHubError(result.get("error", "Unknown error"))
                    
                return result
                
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during SMS Hub API request: {str(e)}")
            raise SMSHubError(f"HTTP error: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from SMS Hub API: {str(e)}")
            raise SMSHubError("Invalid API response")
        except Exception as e:
            logger.error(f"Error during SMS Hub API request: {str(e)}")
            raise SMSHubError(str(e))

    async def get_services(self) -> GetServicesResponse:
        """Get available services and numbers."""
        data = {
            "action": "GET_SERVICES"
        }
        
        result = await self._make_request(data)
        return GetServicesResponse(**result)

    async def get_number(
        self,
        country: str,
        service: str,
        operator: str,
        exception_phones: Optional[List[str]] = None
    ) -> GetNumberResponse:
        """Request a phone number for activation."""
        data = {
            "action": "GET_NUMBER",
            "country": country,
            "service": service,
            "operator": operator
        }
        
        if exception_phones:
            data["exceptionPhoneSet"] = exception_phones
            
        result = await self._make_request(data)
        return GetNumberResponse(**result)

    async def finish_activation(
        self,
        activation_id: str,
        status: int
    ) -> FinishActivationResponse:
        """Update activation status."""
        data = {
            "action": "FINISH_ACTIVATION",
            "activationId": activation_id,
            "status": status
        }
        
        result = await self._make_request(data)
        return FinishActivationResponse(**result)

    async def push_sms(
        self,
        sms_id: str,
        phone: str,
        phone_from: str,
        text: str
    ) -> PushSMSResponse:
        """Send SMS to SMS Hub."""
        request = PushSMSRequest(
            key=self.api_key,
            smsId=sms_id,
            phone=phone,
            phoneFrom=phone_from,
            text=text
        )
        
        result = await self._make_request(request.model_dump())
        return PushSMSResponse(**result)

    def get_supported_services(self, country: str, operator: str) -> List[str]:
        """Get list of supported services for country/operator combination."""
        if not self._countries_cache:
            return []
            
        country_data = self._countries_cache.get(country, {})
        return country_data.get(operator, [])

    async def update_services_cache(self):
        """Update the cache of available services."""
        try:
            response = await self.get_services()
            
            # Clear existing cache
            self._countries_cache.clear()
            
            # Parse response into more usable format
            for country_info in response.countryList:
                country = country_info["country"]
                self._countries_cache[country] = {}
                
                for operator, services in country_info["operatorMap"].items():
                    self._countries_cache[country][operator] = [
                        service for service, count in services.items()
                        if count > 0
                    ]
                    
        except Exception as e:
            logger.error(f"Failed to update services cache: {str(e)}")
            # Keep existing cache on error 