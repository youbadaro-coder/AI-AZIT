@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Gemma_Start.ps1"
if %errorlevel% neq 0 pause
