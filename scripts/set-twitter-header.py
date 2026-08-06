#!/usr/bin/env python3
import json, os, subprocess, sys, time, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path.home() / "Apps" / "ranukita-bridge" / "scripts"))
import rk_x_cuenta as cuenta

HEADER_IMAGE = "/Users/emilioranucoli/Desktop/Oficina_Ranuk/LigaStatsGame/public/social/gambeta_twitter_header.jpg"
if not os.path.exists(HEADER_IMAGE):
    HEADER_IMAGE = os.path.expanduser("~/.ranukita/gambeta_twitter_header.jpg")

print(f"🖼️ Imagen de portada a subir: {HEADER_IMAGE}")

# Asegurar cuenta GambetafutbolAR
app, win, tab, xuser = cuenta.asegurar("GambetafutbolAR")
print(f"Cuenta asegurada: {app}, win={win}, tab={tab}, xuser={xuser}")

def ext(cmd, t=30):
    cmd = {**cmd, "xuser": xuser, "host": "x.com", "tabId": tab}
    req = urllib.request.Request("http://127.0.0.1:9224/command", data=json.dumps(cmd).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=t).read())

# Navegar a la página de edición de perfil
cuenta.al_frente(app, win)
ext({"action": "navigate", "url": "https://x.com/settings/profile"}, t=15)
time.sleep(6)

# Buscar botón de foto de portada
coords = cuenta.coords_de(app, win, 'div[aria-label="Add header photo"], div[aria-label="Agregar foto de encabezado"], [aria-label="Add header photo"]')
if not coords:
    print("Buscando botón alternativo de portada...")
    coords = cuenta.coords_de(app, win, 'div[data-testid="fileInput"]')

if not coords:
    print("Abriendo modal Edit Profile directamente...")
    ext({"action": "navigate", "url": "https://x.com/GambetafutbolAR"}, t=15)
    time.sleep(5)
    btn_edit = cuenta.coords_de(app, win, 'a[href="/settings/profile"], [data-testid="editProfileButton"]')
    if btn_edit:
        cuenta.click_trusted(xuser, tab, btn_edit[0], btn_edit[1])
        time.sleep(4)
    coords = cuenta.coords_de(app, win, 'div[aria-label="Add header photo"], div[aria-label="Agregar foto de encabezado"], [data-testid="fileInput"]')

print("Coordenadas del botón de portada:", coords)
if coords:
    # Traer al frente y clickear
    cuenta.al_frente(app, win)
    cuenta.click_trusted(xuser, tab, coords[0], coords[1])
    time.sleep(1.5)

    # Inyectar archivo vía rk-native-pick
    picker = str(Path.home() / "Apps" / "ranukita-bridge" / "scripts" / "rk-native-pick")
    r = subprocess.run([picker, HEADER_IMAGE], capture_output=True, text=True)
    print("Resultado rk-native-pick:", r.stdout or r.stderr)
    time.sleep(4)

    # Clickear "Apply" / "Aplicar" en la ventana de recorte de X
    coords_apply = cuenta.coords_de(app, win, '[data-testid="applyButton"], div[role="button"]:has-text("Apply"), div[role="button"]:has-text("Aplicar")')
    if coords_apply:
        print("Clickeando Aplicar...")
        cuenta.click_trusted(xuser, tab, coords_apply[0], coords_apply[1])
        time.sleep(3)

    # Clickear "Save" / "Guardar" en el modal de perfil
    coords_save = cuenta.coords_de(app, win, '[data-testid="Profile_Save_Button"], div[role="button"]:has-text("Save"), div[role="button"]:has-text("Guardar")')
    if coords_save:
        print("Clickeando Guardar...")
        cuenta.click_trusted(xuser, tab, coords_save[0], coords_save[1])
        time.sleep(4)
        print("✅ ¡Portada de perfil guardada con éxito en @GambetafutbolAR!")
    else:
        print("ℹ️ Modal abierto. Si requiere confirmación, haz clic en Guardar.")
else:
    print("⚠️ No se encontró el botón directo. Se dejó abierta la pestaña en la configuración del perfil para confirmación.")
