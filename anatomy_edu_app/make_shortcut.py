import os
import win32com.client

try:
    # Get OneDrive Desktop explicitly
    desktop = r"C:\Users\allap\OneDrive\바탕 화면"
    if not os.path.exists(desktop):
        # Fallback to standard desktop
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        
    path = os.path.join(desktop, "Sensual_Edu.lnk")
    target = r"d:\ai작업\anti\anatomy_edu_app\index.html"
    
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortCut(path)
    shortcut.Targetpath = target
    shortcut.Description = "Sensual Wellness Edu Web App"
    shortcut.save()
    print("Success: " + path)
except Exception as e:
    print("Error:", str(e))
