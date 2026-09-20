@echo off
title AGRIOS - Automated Pytest Suite
echo ======================================================================
echo Running All 50 Automated Integration Tests...
echo ======================================================================
cd /d "%~dp0"
python -m pytest tests/ -v
if %ERRORLEVEL% NEQ 0 (
    "C:\Users\Aryan kumar\AppData\Local\Programs\Python\Python314\python.exe" -m pytest tests/ -v
)
echo.
pause
