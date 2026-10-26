@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Installer.ps1" -Action Restore %*
set "garage_ru_result=%ERRORLEVEL%"
if not defined GARAGE_RU_NO_PAUSE pause
exit /b %garage_ru_result%
