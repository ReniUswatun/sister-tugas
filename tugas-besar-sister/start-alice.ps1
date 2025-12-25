# Start Alice peer on port 5003
cd "$PSScriptRoot/backend"
$env:PEER_PORT=5003
$pythonPath = "$PSScriptRoot\.venv\Scripts\python.exe"
& $pythonPath app.py
