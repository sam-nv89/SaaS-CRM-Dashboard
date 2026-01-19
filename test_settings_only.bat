@echo off
echo ==========================================
echo VS CODE - SETTINGS ONLY TEST (NO EXTENSIONS)
echo ==========================================
echo.
echo This will start VS Code with:
echo - YOUR settings (from normal profile)
echo - NO extensions
echo.
echo This tests if the problem is in settings.json
echo.
pause

echo Starting VS Code with settings but no extensions...
start "" "C:\Users\akasc\AppData\Local\Programs\Microsoft VS Code\Code.exe" --disable-extensions "d:\App Development\v0\saa-s-crm-dashboard"

echo.
echo TEST INSTRUCTIONS:
echo 1. In the NEW window, press Ctrl+` to open terminal
echo 2. Type: echo "hello"
echo 3. If it works - the problem is in EXTENSIONS
echo 4. If it hangs - the problem is in SETTINGS.JSON
echo.
pause
