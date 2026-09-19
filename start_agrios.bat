@echo off
title AGRIOS - Agricultural Operating System Server
echo ======================================================================
echo Starting AGRIOS Server on http://127.0.0.1:8000 ...
echo ======================================================================
cd /d "C:\Users\Aryan kumar\Downloads\agrios - hackdevengers 2.o hackathon\AGRIOS - HACK DEVENGERS 2.O"
"C:\Users\Aryan kumar\AppData\Local\Programs\Python\Python314\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
