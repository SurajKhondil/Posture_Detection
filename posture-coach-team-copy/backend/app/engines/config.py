# Team 2 Analysis Constants & Thresholds

# Simulation Configuration
SIMULATION_FPS = 15
SIMULATION_FPS_MIN = 10
SIMULATION_FPS_MAX = 20

# Posture Analysis Thresholds
CONFIDENCE_THRESHOLD = 0.8
MIN_CONFIDENCE_PER_ANGLE = 0.8  # Minimum confidence for individual angle validity

# Streaming Frame Processing Configuration
SESSION_DURATION_SECONDS = 7200  # 2 hours total (1 hour front + 1 hour side)
PHASE_DURATION_SECONDS = 3600  # 1 hour per phase
ANGLE_ROUNDING_PRECISION = 0  # Round to integers (15, 16, 17 degrees)
PHASE_TYPES = ["front", "side"]  # Valid phase values

# Session Configuration - Posture Metrics by View
SESSION_CONFIG = {
    "FRONT": {
        "duration_min": 60,
        "metrics": {
            "neck_bend": {
                "ranges": {
                    "good": (0, 10),        # <10°
                    "warning": (10, 20),    # 10-20°
                    "bad": (20, 180)        # >=20°
                }
            },
            "shoulder_slope": {
                "ranges": {
                    "good": (0, 5),         # <5°
                    "warning": (5, 10),     # 5-10°
                    "bad": (10, 180)        # >=10°
                }
            },
            "torso_tilt": {
                "ranges": {
                    "good": (0, 10),        # <10%
                    "warning": (10, 20),    # 10-20%
                    "bad": (20, 100)        # >=20%
                }
            }
        }
    },
    "SIDE": {
        "duration_min": 60,
        "metrics": {
            "neck_bend": {
                "ranges": {
                    "good": (0, 10),
                    "warning": (10, 20),
                    "bad": (20, 180)
                }
            },
            "head_forward_index": {
                "ranges": {
                    "good": (0.0, 0.15),     # <0.15
                    "warning": (0.15, 0.25), # 0.15-0.25
                    "bad": (0.25, 1.0)       # >=0.25
                }
            }
        }
    }
}

# Score Bands (Approach 1 from PDF)
SCORE_BANDS = {
    "good": (0, 30),
    "warning": (30, 70),
    "bad": (70, 100)
}

# Risk Thresholds for Recommendations
RISK_THRESHOLDS = {
    "LOW": 20,
    "MODERATE": 40,
    "HIGH": 70
}

# Trend Detection Threshold
TREND_THRESHOLD = 10  # % change for trend detection

# Metric Rules for Recommendations
METRIC_RULES = {
    "FRONT_neck_bend": {
        "label": "Forward Neck Bend",
        "base_actions": [
            "Monitor top third of screen at eye level",
            "Chin should remain parallel to floor",
            "Avoid looking down at screen for prolonged periods"
        ]
    },
    "FRONT_shoulder_slope": {
        "label": "Shoulder Alignment",
        "base_actions": [
            "Keep shoulders relaxed and level",
            "Avoid hunching forward",
            "Perform shoulder rolls every 30 minutes"
        ]
    },
    "FRONT_torso_tilt": {
        "label": "Torso Alignment",
        "base_actions": [
            "Sit upright with back against chair",
            "Engage core muscles gently",
            "Avoid leaning to one side"
        ]
    },
    "SIDE_neck_bend": {
        "label": "Side Neck Alignment",
        "base_actions": [
            "Keep head centered over shoulders",
            "Avoid tilting head to side",
            "Ensure workspace allows symmetrical positioning"
        ]
    },
    "SIDE_head_forward_index": {
        "label": "Head Forward Posture",
        "base_actions": [
            "Move screen closer to reduce forward lean",
            "Perform chin tucks: pull chin back gently",
            "Strengthen neck muscles with targeted exercises"
        ]
  }
}
