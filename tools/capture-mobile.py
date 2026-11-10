#!/usr/bin/env python3
"""Capture mobile renders of demo sites with headless Chrome and compose
16:9 (1280x720) preview cards -> public/images/demos/websites/<slug>-mobile.png

Usage: python3 tools/capture-mobile.py   (needs google-chrome + Pillow)
"""
import os, subprocess, tempfile, threading, functools, http.server
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images", "demos", "websites")
PORT = 8765
UA = ("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36")

DEMOS = {
    "kwena": [f"http://localhost:{PORT}/demos/kwena/{p}" for p in ("index.html", "products.html", "services.html")],
    "realestate": [f"https://estately.cabscode.pro/{p}" for p in ("", "houses", "contact")],
}

def shot(url, path):
    subprocess.run([
        "google-chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--no-sandbox", f"--user-agent={UA}", "--window-size=390,844",
        "--force-device-scale-factor=2", "--virtual-time-budget=6000",
        f"--screenshot={path}", url,
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def phone(img, h):
    w = round(img.width * h / img.height)
    img = img.resize((w, h), Image.LANCZOS)
    pad = 6
    frame = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    d.rounded_rectangle([0, 0, frame.width - 1, frame.height - 1], 26, fill=(28, 32, 30, 255))
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], 20, fill=255)
    frame.paste(img.convert("RGBA"), (pad, pad), mask)
    return frame

def compose(shots, dest):
    W, H = 1280, 720
    bg = Image.new("RGB", (W, H), (233, 237, 230))
    ph = [phone(Image.open(s), 600) for s in shots]
    gap = 56
    total = sum(p.width for p in ph) + gap * (len(ph) - 1)
    x = (W - total) // 2
    for p in ph:
        bg.paste(p, (x, (H - p.height) // 2), p)
        x += p.width + gap
    bg.save(dest, optimize=True)

def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=os.path.join(ROOT, "public"))
    handler.log_message = lambda *a, **k: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory() as tmp:
        for slug, urls in DEMOS.items():
            shots = []
            for i, u in enumerate(urls):
                p = os.path.join(tmp, f"{slug}-{i}.png")
                shot(u, p)
                shots.append(p)
            dest = os.path.join(OUT, f"{slug}-mobile.png")
            compose(shots, dest)
            print("wrote", dest)
    srv.shutdown()

if __name__ == "__main__":
    main()
