# Packaging Guide for Posture Coach Project

Follow these steps to clean and compress your source code before sharing or archiving.

---

## 1. Clean the Project (Highly Recommended)
To minimize package size, delete auto-generated dependencies and cache files. They will be re-installed by the recipient during setup.

### Remove Node Modules & Expo Caches:
Delete the following folders in your workspace:
- `react-native-app/node_modules/`
- `react-native-app/.expo/`
- `posture-coach-team-copy/frontend/node_modules/`
- `posture-coach-team-copy/frontend/.expo/`

### Remove Python Caches & Virtual Envs:
Delete the following folders:
- `posture-coach-team-copy/backend/venv/`
- `**/__pycache__/` (all nested pycache directories)
- `python_backend/pose_data.db` (optional: local SQLite test database)

---

## 2. What to Include in the Archive
Select the following files and folders from the root directory:

* **Folders**:
  - `react-native-app/` (excluding `node_modules` and `.expo`)
  - `python_backend/` (excluding `__pycache__` and local `.db` files)
  - `posture-coach-team-copy/` (excluding frontend `node_modules` and backend `venv`)
  - `docs/` (contains screenshots for README)

* **Files**:
  - `.gitignore`
  - `README.md` (Main repository profile)
  - `README_RUN.md` (Manual running guide)
  - `INSTRUCTIONS.txt` (Quick running instructions)
  - `PACKAGING_GUIDE.md` (This document)
  - `setup_rn.bat`
  - `run_rn.bat`
  - `start.bat`
  - `start.py`

---

## 3. Final Step
1. Right-click the selected files and folders.
2. Select **Compress to ZIP file** (or **Send to** -> **Compressed (zipped) folder**).
3. Name the resulting archive: `posture_coach_source.zip`.

This ensures a clean, lightweight archive (typically under 10MB) that can be unpacked and set up instantly using the automated setup scripts.
