# How to Run the Pose Engine Project Manually in VS Code

This project consists of two parts that must run simultaneously:
1.  **Python Backend**: Runs the AI model (MediaPipe) to detect body pose.
2.  **Flutter Frontend**: The visual application you see on screen.

Follow these steps exactly.

## Prerequisites
*   Ensure VS Code is open at the folder: `pose_engine`

## Step 1: Stop Previous Instances
If the app is currently running, you must stop it first to free up the ports.
*   Click inside the **Terminal** where it's running.
*   Press `Ctrl + C` to stop the process. Do this for both Python and Flutter terminals if active.

## Step 2: Run the Python Backend
This server processes the camera feed.

1.  In VS Code, go to the top menu: **Terminal** -> **New Terminal**.
2.  Type the following command to move into the backend folder:
    ```powershell
    cd python_backend
    ```
3.  Start the server with this command:
    ```powershell
    python pose_server.py
    ```
4.  You should see output like: `✅ Server started on ws://localhost:8765`.
    *   **Keep this terminal open!** Do not close it.

## Step 3: Run the Flutter App
This is the user interface.

1.  Open a **second** terminal. (Click the `+` icon in the Terminal panel or go to **Terminal** -> **New Terminal** again).
2.  Make sure you are in the main `pose_engine` folder. If you are in `python_backend`, go back by typing `cd ..`.
    *   Your path should look like: `...\pose_engine>`
3.  Run the Windows app with this command:
    ```powershell
    flutter run -d windows
    ```
4.  Wait for it to build. The app window will launch automatically.

## Summary
*   **Terminal 1**: `python pose_server.py` (Must stay running)
*   **Terminal 2**: `flutter run -d windows`

## Troubleshooting
*   **"Address already in use"**: This means the Python server is already running in another window. Find it and close it, or just use the existing one.
*   **"Build failed"**: Try running `flutter clean` in the Flutter terminal, then try `flutter run -d windows` again.
