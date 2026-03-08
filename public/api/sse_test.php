<?php
set_time_limit(0);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

echo "data: Teste inicial\n\n";
flush();

$counter = 0;
while ($counter < 10) {
    echo "data: Mensagem $counter\n\n";
    flush();
    $counter++;
    sleep(1);
}
