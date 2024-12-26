import psutil
import logging
import time
from typing import Dict, Any, List
from datetime import datetime, timedelta
from prometheus_client import Counter, Gauge, Histogram
from ..core.config import settings

logger = logging.getLogger(__name__)

# Prometheus metrics
modem_status = Gauge(
    "modem_status",
    "Modem status (0=offline, 1=active, 2=busy, 3=error)",
    ["modem_id", "port"]
)

modem_signal_quality = Gauge(
    "modem_signal_quality",
    "Modem signal quality (0-100)",
    ["modem_id", "port"]
)

activation_total = Counter(
    "activation_total",
    "Total number of activations",
    ["status"]
)

sms_total = Counter(
    "sms_messages_total",
    "Total number of SMS messages",
    ["status"]
)

sms_delivery_time = Histogram(
    "sms_delivery_time_seconds",
    "Time taken to deliver SMS messages",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

class SystemMetrics:
    def __init__(self):
        self.start_time = datetime.utcnow()
        
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used": memory.used,
            "memory_total": memory.total,
            "disk_percent": disk.percent,
            "disk_used": disk.used,
            "disk_total": disk.total,
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds()
        }
        
    def get_process_metrics(self) -> Dict[str, Any]:
        """Get current process metrics."""
        process = psutil.Process()
        
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_percent": process.memory_percent(),
            "memory_rss": process.memory_info().rss,
            "threads": process.num_threads(),
            "open_files": len(process.open_files()),
            "connections": len(process.connections())
        }

class HealthCheck:
    def __init__(self):
        self.checks: List[Dict[str, Any]] = []
        self.last_check = datetime.min
        self.check_interval = timedelta(minutes=1)
        
    def add_check(self, name: str, check_func, critical: bool = True):
        """Add a health check function."""
        self.checks.append({
            "name": name,
            "func": check_func,
            "critical": critical,
            "status": "unknown",
            "last_success": None,
            "last_error": None,
            "error_count": 0
        })
        
    async def run_checks(self) -> Dict[str, Any]:
        """Run all health checks."""
        now = datetime.utcnow()
        
        # Only run checks if interval has passed
        if now - self.last_check < self.check_interval:
            return self._get_last_results()
            
        self.last_check = now
        results = {
            "status": "healthy",
            "timestamp": now.isoformat(),
            "checks": {}
        }
        
        for check in self.checks:
            try:
                await check["func"]()
                check["status"] = "healthy"
                check["last_success"] = now
                check["error_count"] = 0
                results["checks"][check["name"]] = {
                    "status": "healthy"
                }
                
            except Exception as e:
                check["status"] = "unhealthy"
                check["last_error"] = str(e)
                check["error_count"] += 1
                
                results["checks"][check["name"]] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                
                if check["critical"]:
                    results["status"] = "unhealthy"
                    
        return results
        
    def _get_last_results(self) -> Dict[str, Any]:
        """Get results from last check run."""
        results = {
            "status": "healthy",
            "timestamp": self.last_check.isoformat(),
            "checks": {}
        }
        
        for check in self.checks:
            results["checks"][check["name"]] = {
                "status": check["status"]
            }
            
            if check["status"] == "unhealthy" and check["critical"]:
                results["status"] = "unhealthy"
                
        return results

class ModemMetrics:
    @staticmethod
    def update_modem_status(modem_id: int, port: str, status: str):
        """Update modem status metric."""
        status_value = {
            "offline": 0,
            "active": 1,
            "busy": 2,
            "error": 3
        }.get(status, 0)
        
        modem_status.labels(
            modem_id=str(modem_id),
            port=port
        ).set(status_value)
        
    @staticmethod
    def update_signal_quality(modem_id: int, port: str, quality: int):
        """Update modem signal quality metric."""
        modem_signal_quality.labels(
            modem_id=str(modem_id),
            port=port
        ).set(quality)
        
    @staticmethod
    def record_activation(status: str):
        """Record activation status."""
        activation_total.labels(status=status).inc()
        
    @staticmethod
    def record_sms(status: str):
        """Record SMS status."""
        sms_total.labels(status=status).inc()
        
    @staticmethod
    def record_sms_delivery_time(seconds: float):
        """Record SMS delivery time."""
        sms_delivery_time.observe(seconds)

# Global instances
system_metrics = SystemMetrics()
health_check = HealthCheck()
modem_metrics = ModemMetrics() 