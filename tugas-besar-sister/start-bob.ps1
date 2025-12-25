# Start Bob peer on port 5004
cd "$PSScriptRoot/backend"
$env:PEER_PORT=5004
$pythonPath = "$PSScriptRoot\.venv\Scripts\python.exe"
& $pythonPath app.py
