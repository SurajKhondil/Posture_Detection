# Configuration Module - Procedural approach with module-level variables
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL")          # Team 1's own Neon DB
TEAM3_DATABASE_URL = os.getenv("TEAM3_DATABASE_URL")  # Team 3's Neon DB (mirror)

# Posture Analysis Thresholds
CONFIDENCE_THRESHOLD = 0.8