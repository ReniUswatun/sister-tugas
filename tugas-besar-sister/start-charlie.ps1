# Start Charlie peer on port 5005
cd "$PSScriptRoot/backend"
$env:PEER_PORT=5005
$pythonPath = "$PSScriptRoot\.venv\Scripts\python.exe"
& $pythonPath app.py
