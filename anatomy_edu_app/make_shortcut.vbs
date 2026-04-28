Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetAbsolutePathName(".")
Set Shell = CreateObject("WScript.Shell")
DesktopPath = Shell.SpecialFolders("Desktop")
Set link = Shell.CreateShortcut(DesktopPath & "\Sensual_Edu.lnk")
link.TargetPath = currentDir & "\index.html"
link.Description = "Sensual Wellness Edu Web App"
link.Save
