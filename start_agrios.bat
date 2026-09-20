@echo off
title AGRIOS - Agricultural Operating System Server
echo ======================================================================
echo Starting AGRIOS Server on http://127.0.0.1:8000 ...
echo ======================================================================
cd /d "%~dp0"
python run.py
if %ERRORLEVEL% NEQ 0 (
    "C:\Users\Aryan kumar\AppData\Local\Programs\Python\Python314\python.exe" run.py
)
pause
