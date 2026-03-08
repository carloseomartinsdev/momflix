@echo off
echo Verificando se o servidor WebSocket esta rodando...
echo.

netstat -an | findstr :8080
if %errorlevel% == 0 (
    echo ✓ Porta 8080 esta em uso
) else (
    echo ✗ Porta 8080 nao esta em uso
    echo.
    echo Iniciando servidor WebSocket...
    cd /d "e:\00-LocalServer\htdocs\momflix"
    node websocket-server.js
)

pause