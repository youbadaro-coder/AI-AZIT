# Gemma 4 Startup Script (UTF-8 Safe Version)
Clear-Host

Write-Host "=============================================="
Write-Host "         Gemma 4 is Starting..."
Write-Host "=============================================="
Write-Host ""
Write-Host " * Model size: 9.6GB (Loading: 1-2 mins)"
Write-Host " * Please wait for the '>>>' prompt."
Write-Host " * Type /bye to exit."
Write-Host ""
Write-Host "----------------------------------------------"
Write-Host ""

# Call Ollama
ollama run gemma4:e4b

Write-Host ""
Write-Host "Session Ended."
pause
