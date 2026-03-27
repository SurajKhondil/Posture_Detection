# Configuration Module - Procedural approach with module-level variables
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
 
# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")  # Required: Set in .env file   # Posture Analysis Thresholds
CONFIDENCE_THRESHOLD = 0.8