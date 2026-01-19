@echo off
echo ==========================================
echo VS CODE TERMINAL DIAGNOSTIC TOOL
echo ==========================================
echo.

set "VSCODE_DIR=%LOCALAPPDATA%\Programs\Microsoft VS Code"
set "WINPTY=%VSCODE_DIR%\resources\app\node_modules\node-pty\build\Release\winpty-agent.exe"

echo [1] Checking VS Code Installation Directory...
if exist "%VSCODE_DIR%" (
    echo OK: Found %VSCODE_DIR%
) else (
    echo ERROR: VS Code directory not found!
    pause
    exit /b
)
echo.

echo [2] Checking PTY Agent Binary...
if exist "%WINPTY%" (
    echo OK: Found winpty-agent.exe
) else (
    echo ERROR: winpty-agent.exe MISSING!
    echo Looked in: %WINPTY%
    echo This usually means Antivirus deleted it.
    pause
    exit /b
)
echo.

echo [3] Attempting to launch winpty-agent manually...
echo (It should run and wait or exit immediately, but NOT crash with a DLL error)
echo Starting...
"%WINPTY%" --version
if %errorlevel% neq 0 (
    echo WARNING: winpty-agent exited with error code %errorlevel%
) else (
    echo OK: winpty-agent execution seems possible.
)
echo.

echo [4] Checking Environment Variables...
echo PATH length:
echo %PATH% > path_dump.txt
for %%I in (path_dump.txt) do echo %%~zI bytes
del path_dump.txt
echo.

echo [5] checking for interfering software...
tasklist | findstr /i "kaspersky eset drweb avast bitdefender"
if %errorlevel% equ 0 (
    echo NOTICE: Antivirus processes detected above.
) else (
    echo No obvious antivirus processes found in process list.
)

echo.
echo ==========================================
echo DIAGNOSTIC COMPLETE.
echo If step [3] showed a System Error popup (DLL missing), that is the cause.
echo Take a screenshot or copy this text.
echo ==========================================
pause
