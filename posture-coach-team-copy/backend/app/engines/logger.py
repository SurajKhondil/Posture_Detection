# Structured Logging Module for Analysis Engines
import sys
import os
from datetime import datetime
from typing import Any, Dict, Optional

# ANSI Color Codes for Terminal
class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# Step Prefixes with Emojis
STEP_PREFIXES = {
    "AUTH": "🔐",
    "TEAM1": "📊",
    "ENGINE": "⚙️",
    "AI": "🤖",
    "DB": "💾",
    "API": "🌐",
    "SYSTEM": "🔧",
    "ERROR": "❌",
    "SUCCESS": "✅",
    "WARNING": "⚠️"
}

def get_timestamp() -> str:
    """Get formatted timestamp"""
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]

def log_step(step: str, action: str, data: Optional[Dict[str, Any]] = None, color: str = Colors.CYAN):
    """Log a step with structured format"""
    prefix = STEP_PREFIXES.get(step, "🔹")
    timestamp = get_timestamp()
    
    print(f"{color}{Colors.BOLD}[{timestamp}] {prefix} [{step}]{Colors.RESET} {action}")
    
    if data:
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 100:
                value = value[:97] + "..."
            print(f"   {Colors.WHITE}├─ {key}: {value}{Colors.RESET}")
    print()

def log_engine(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("ENGINE", action, data, Colors.CYAN)

def log_ai(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("AI", action, data, Colors.GREEN)

def log_db(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("DB", action, data, Colors.WHITE)

def log_api(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("API", action, data, Colors.CYAN)

def log_error(action: str, error: Exception, data: Optional[Dict[str, Any]] = None):
    error_data = data or {}
    error_data["Error"] = str(error)
    error_data["Type"] = type(error).__name__
    log_step("ERROR", action, error_data, Colors.RED)

def log_success(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("SUCCESS", action, data, Colors.GREEN)

def log_warning(action: str, data: Optional[Dict[str, Any]] = None):
    log_step("WARNING", action, data, Colors.YELLOW)

def log_lifecycle(phase: str, details: str = ""):
    separator = "=" * 80
    print(f"\n{Colors.BOLD}{Colors.CYAN}{separator}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}>>> {phase} {details}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{separator}{Colors.RESET}\n")
