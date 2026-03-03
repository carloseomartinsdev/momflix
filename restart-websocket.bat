@echo off
echo Parando processos na porta 8080...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Matando processo %%a
    taskkill /f /pid %%a
)

echo.
echo Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo Iniciando servidor WebSocket com SSL...
cd /d "e:\00-LocalServer\htdocs\momflix"
node websocket-server.js

pause