import random
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

dice_roll = random.randint(1, 20)
print(f"🎲 주사위 결과: {dice_roll}")

if dice_roll == 20:
    print("STATUS: CRITICAL SUCCESS (대성공! 기적이 일어납니다)")
    print("![신남](file:///C:/Users/allap/.gemini/antigravity/brain/88d90835-8371-4be6-aa52-d61a37757d60/kodari_yoga_look_1776151677723.png)")
elif dice_roll >= 12:
    print("STATUS: SUCCESS (성공! 위기를 넘깁니다)")
    print("![성공](file:///C:/Users/allap/.gemini/antigravity/brain/88d90835-8371-4be6-aa52-d61a37757d60/kodari_yoga_look_1776151677723.png)")
elif dice_roll > 1:
    print("STATUS: FAILURE (실패... 곤란해집니다)")
    print("![당황](file:///C:/Users/allap/.gemini/antigravity/brain/88d90835-8371-4be6-aa52-d61a37757d60/kodari_yoga_look_1776151677723.png)")
else:
    print("STATUS: CRITICAL FAILURE (대실패! 끔찍한 일이 벌어집니다)")
    print("![울음](file:///C:/Users/allap/.gemini/antigravity/brain/88d90835-8371-4be6-aa52-d61a37757d60/kodari_yoga_look_1776151677723.png)")
