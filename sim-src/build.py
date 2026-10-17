# BANKHUM CAMPUS SIM: สร้างหน้าเว็บจากต้นฉบับ (ฝังโมเดล GLB เป็น base64)
#   python3 sim-src/build.py   → เขียน index.html และ simulator/index.html ที่ราก repo
import base64, os
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
h = open(os.path.join(here, 'index.html'), encoding='utf-8').read()
b = base64.b64encode(open(os.path.join(here, 'ban_khum_school.glb'), 'rb').read()).decode()
h = h.replace('<canvas id="c"></canvas>', '<script id="glb" type="text/plain">' + b + '</script>\n<canvas id="c"></canvas>')
for out in ('index.html', 'simulator/index.html'):
    open(os.path.join(root, out), 'w', encoding='utf-8').write(h)
