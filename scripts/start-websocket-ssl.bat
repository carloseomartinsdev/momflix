@echo off
echo ========================================
echo    MomFlix WebSocket SSL Setup
echo ========================================
echo.

echo 1. Copiando certificados do seu servidor...
echo.

REM Exemplo para XAMPP
if exist "C:\xampp\apache\conf\ssl.key\server.key" (
    echo Encontrados certificados XAMPP
    if not exist "ssl" mkdir ssl
    copy "C:\xampp\apache\conf\ssl.key\server.key" "ssl\private.key"
    copy "C:\xampp\apache\conf\ssl.crt\server.crt" "ssl\certificate.crt"
    echo Certificados copiados com sucesso!
    goto :start_server
)

REM Exemplo para WAMP
if exist "C:\wamp64\bin\apache\apache2.4.54\conf\ssl\server.key" (
    echo Encontrados certificados WAMP
    if not exist "ssl" mkdir ssl
    copy "C:\wamp64\bin\apache\apache2.4.54\conf\ssl\server.key" "ssl\private.key"
    copy "C:\wamp64\bin\apache\apache2.4.54\conf\ssl\server.crt" "ssl\certificate.crt"
    echo Certificados copiados com sucesso!
    goto :start_server
)

echo.
echo CERTIFICADOS NAO ENCONTRADOS AUTOMATICAMENTE
echo.
echo Por favor, copie manualmente seus certificados para:
echo   ssl\private.key  (sua chave privada)
echo   ssl\certificate.crt  (seu certificado)
echo.
echo Ou edite o arquivo websocket-ssl-config.js com os caminhos corretos
echo.
pause
goto :end

:start_server
echo.
echo 2. Iniciando servidor WebSocket com SSL...
echo.
node websocket-server.js

:end
pause