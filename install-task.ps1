# Criar tarefa agendada para iniciar automaticamente
$taskName = "MomFlix WebSocket Server"
$nodePath = "C:\Program Files\nodejs\node.exe"
$scriptPath = "E:\00-LocalServer\htdocs\momflix\websocket-server.js"

# Remover tarefa existente se houver
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Criar ação
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`""

# Criar trigger (iniciar com o Windows)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Criar configurações
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

# Criar principal (executar como SYSTEM)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Registrar tarefa
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal

# Iniciar tarefa
Start-ScheduledTask -TaskName $taskName

Write-Host "Tarefa agendada criada com sucesso!"
Write-Host "Para gerenciar: taskschd.msc"