@echo off
title AGRIOS - End-to-End Judge Walkthrough Verification
echo ======================================================================
echo Running AGRIOS 6-Step Judge Walkthrough Verification...
echo ======================================================================
cd /d "%~dp0"
python scripts\verify_complete_e2e_walkthrough.py
if %ERRORLEVEL% NEQ 0 (
    "C:\Users\Aryan kumar\AppData\Local\Programs\Python\Python314\python.exe" scripts\verify_complete_e2e_walkthrough.py
)
echo.
pause
