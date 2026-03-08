@echo off
echo Verificando certificados SSL...
echo.

if exist "C:\xampp\apache\conf\ssl.crt\momflix.momsys.com.br-key.pem" (
    echo ✓ Chave privada encontrada
) else (
    echo ✗ Chave privada NAO encontrada em: C:\xampp\apache\conf\ssl.crt\momflix.momsys.com.br-key.pem
)

if exist "C:\xampp\apache\conf\ssl.crt\momflix.momsys.com.br-crt.pem" (
    echo ✓ Certificado encontrado
) else (
    echo ✗ Certificado NAO encontrado em: C:\xampp\apache\conf\ssl.crt\momflix.momsys.com.br-crt.pem
)

echo.
echo Iniciando servidor WebSocket com debug...
cd /d "e:\00-LocalServer\htdocs\momflix"
node websocket-server.js

pause