$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "Sensual_Edu.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = (Convert-Path ".\index.html")
$Shortcut.Description = "Sensual Wellness Edu Web App"
$Shortcut.Save()
Write-Output "바탕화면 아이콘 생성 완료"
