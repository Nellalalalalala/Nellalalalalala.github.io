@echo off
setlocal DisableDelayedExpansion
set "garage_ru_package=%~dp0"
set "garage_ru_game_path="
set "garage_ru_no_gui="
:parse
if "%~1"=="" goto run
if /I "%~1"=="-GamePath" (
  if "%~2"=="" goto usage
  set "garage_ru_game_path=%~2"
  shift
  shift
  goto parse
)
if /I "%~1"=="-NoGui" (
  set "garage_ru_no_gui=1"
  shift
  goto parse
)
:usage
echo Usage: Install.cmd [-GamePath "C:\SteamLibrary\steamapps\common\Garage Bad Dream Adventure"]
set "garage_ru_result=1"
goto finish
:run
rem Avoid the PowerShell 5.1 wildcard bug in script paths and startup CWD.
pushd "%SystemRoot%"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$p=@{Action='Install';PackageRoot=$env:garage_ru_package}; if($env:garage_ru_game_path){$p.GamePath=$env:garage_ru_game_path}; if($env:garage_ru_no_gui -eq '1'){$p.NoGui=$true}; & ([scriptblock]::Create([IO.File]::ReadAllText([IO.Path]::Combine($env:garage_ru_package,'Installer.ps1'),[Text.Encoding]::UTF8))) @p"
set "garage_ru_result=%ERRORLEVEL%"
popd
:finish
if not defined GARAGE_RU_NO_PAUSE pause
exit /b %garage_ru_result%
