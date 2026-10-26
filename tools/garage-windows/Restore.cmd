@echo off
setlocal
set "garage_ru_package=%~dp0"
rem Use a safe startup directory: PowerShell 5.1 mishandles brackets in CWD.
pushd "%SystemRoot%"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%garage_ru_package%Installer.ps1" -Action Restore %*
set "garage_ru_result=%ERRORLEVEL%"
popd
if not defined GARAGE_RU_NO_PAUSE pause
exit /b %garage_ru_result%
