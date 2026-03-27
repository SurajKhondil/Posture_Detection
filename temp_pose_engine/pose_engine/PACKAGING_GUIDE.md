# Packaging Guide for Pose Engine

Follow these steps to zip your source code for sharing.

## 1. Clean the Project (Recommended)
Before zipping, it's best to remove large build files.
Open a terminal in `pose_engine` and run:
```powershell
flutter clean
```
*(Note: This deletes the `build/` folder, saving a lot of space. The recipient will rebuild it when they run `setup.bat` or `run.bat`.)*

## 2. What to Zip
Select the following files and folders in your `pose_engine` directory:

*   **Folders**:
    *   `lib/`
    *   `python_backend/`
    *   `windows/`
    *   `test/` (optional)
*   **Files**:
    *   `pubspec.yaml`
    *   `analysis_options.yaml`
    *   `README.md`
    *   `setup.bat` (The new script)
    *   `run.bat` (The new script)
    *   `INSTRUCTIONS.txt` (The new instructions)
    *   `PACKAGING_GUIDE.md` (This file)

## 3. What NOT to Zip
**Do NOT** include these folders (they are large and auto-generated):
*   `build/`
*   `.dart_tool/`
*   `.git/` (if present)
*   `.idea/`
*   `build_log.txt` or other log files.

## 4. Final Step
Right-click your selection -> **Send to** -> **Compressed (zipped) folder**.
Name it `pose_engine_dist.zip`.
