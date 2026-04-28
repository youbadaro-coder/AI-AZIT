import urllib.request
import json
import sys
import os
from datetime import datetime

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma4:e4b"
HISTORY_FILE = "gemma_history.json"

def chat_with_gemma(prompt):
    # Load history
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            try:
                messages = json.load(f)
            except:
                messages = []
    else:
        messages = []

    # Add user message
    messages.append({"role": "user", "content": prompt})

    try:
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        payload = {
            "model": MODEL,
            "messages": messages,
            "stream": False
        }
        data = json.dumps(payload).encode("utf-8")
        
        req = urllib.request.Request(OLLAMA_URL, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        
        with urllib.request.urlopen(req) as response:
            res_content = response.read().decode("utf-8")
            res_data = json.loads(res_content)
            ai_message = res_data["message"]["content"]

            # Save history
            messages.append({"role": "assistant", "content": ai_message})
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(messages[-20:], f, ensure_ascii=False, indent=2)

            # Format the output for Anti chat
            header = f"[Gemma 4 | Connected: {current_time}]\n"
            divider = "-" * 40 + "\n"
            return f"{header}{divider}{ai_message}"

    except Exception as e:
        return f"Error connecting to Gemma: {str(e)}"

if __name__ == "__main__":
    # Force UTF-8 for output to avoid codec errors on Windows
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print("Usage: gemma_bridge.py 'your prompt' OR gemma_bridge.py --file path/to/file")
    else:
        if sys.argv[1] == "--file" and len(sys.argv) > 2:
            file_path = sys.argv[2]
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    user_prompt = f.read()
            else:
                print(f"File not found: {file_path}")
                sys.exit(1)
        else:
            user_prompt = " ".join(sys.argv[1:])
            
        print(chat_with_gemma(user_prompt))
