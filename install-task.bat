@echo off
cd /d "%~dp0"
echo Instalando MomFlix WebSocket como tarefa agendada...
echo.
echo IMPORTANTE: Execute como Administrador!
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0install-task.ps1"

echo.
echo Pressione qualquer tecla para sair...
pause > nul