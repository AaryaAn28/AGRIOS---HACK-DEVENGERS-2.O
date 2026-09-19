@echo off
title AGRIOS - Automated Pytest Suite
echo ======================================================================
echo Running All 21 Automated Integration Tests...
echo ======================================================================
cd /d "C:\Users\Aryan kumar\Downloads\agrios - hackdevengers 2.o hackathon\AGRIOS - HACK DEVENGERS 2.O"
"C:\Users\Aryan kumar\AppData\Local\Programs\Python\Python314\python.exe" -m pytest tests/ -v
echo.
pause
