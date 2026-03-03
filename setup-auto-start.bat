@echo off
echo Criando tarefa para inicializar WebSocket automaticamente...

schtasks /create /tn "MomFlix WebSocket" /tr "e:\00-LocalServer\htdocs\momflix\auto-start-websocket.bat" /sc onstart /ru SYSTEM /f

echo.
echo Tarefa criada! O WebSocket iniciará automaticamente com o Windows.
echo Para remover: schtasks /delete /tn "MomFlix WebSocket" /f
pause