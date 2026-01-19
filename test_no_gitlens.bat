@echo off
echo ==========================================
echo VS CODE - DISABLE GITLENS TEST
echo ==========================================
echo.
echo This will start VS Code with GitLens DISABLED
echo.
pause

echo Starting VS Code...
start "" "C:\Users\akasc\AppData\Local\Programs\Microsoft VS Code\Code.exe" --disable-extension eamodio.gitlens "d:\App Development\v0\saa-s-crm-dashboard"

echo.
echo TEST: Open terminal (Ctrl+`) and type: echo "hello"
echo.
echo If it works - GitLens was the problem!
echo If it hangs - try next suspect (Remote SSH)
echo.
pause
