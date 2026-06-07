# Start the Portfolio Risk Analyzer backend
# This script excludes venv from the file watcher to prevent unnecessary reloads

& ".\venv\Scripts\python.exe" -m uvicorn app.main:app `
    --reload `
    --reload-exclude "venv" `
    --reload-exclude "tests" `
    --host 0.0.0.0 `
    --port 8000
