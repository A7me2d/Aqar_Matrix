#!/usr/bin/env python3
"""يبني build/icon.ico بالشكل القياسي اللي ويندوز بيقراه في كل مكان (شريط المهام، Alt-Tab، الشلّة، المستكشف):
   - الأحجام الصغيرة والمتوسطة (16..128) بصيغة BMP/DIB 32-bit + قناع AND — ده الشكل الكلاسيكي اللي كل واجهات ويندوز بتفهمه
   - حجم 256 بس بصيغة PNG (المسموح رسمياً)
   قبل كده كل الأحجام كانت PNG (حتى 16/24/32) وده كان بيطلّع «ورقة بيضا» في شريط المهام على ويندوز.
   الاستخدام: python3 scripts/make-ico.py [مصدر PNG] [الناتج ICO]"""
import io, struct, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "app/icon.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "build/icon.ico"
BMP_SIZES = [16, 20, 24, 32, 40, 48, 64, 96, 128]
PNG_SIZES = [256]

src = Image.open(SRC).convert("RGBA")
assert src.width == src.height and src.width >= 256, "المصدر لازم يكون مربع وكبير (256 على الأقل)"

def bmp_frame(im: Image.Image) -> bytes:
    w, h = im.size
    px = im.tobytes("raw", "BGRA")  # صفوف من فوق لتحت
    rows = [px[y * w * 4:(y + 1) * w * 4] for y in range(h)]
    xor = b"".join(reversed(rows))  # DIB بيتخزّن من تحت لفوق
    mask_row = ((w + 31) // 32) * 4
    andm = bytes(mask_row * h)  # الشفافية جاية من قناة ألفا
    hdr = struct.pack("<IiiHHIIiiII", 40, w, h * 2, 1, 32, 0, len(xor) + len(andm), 0, 0, 0, 0)
    return hdr + xor + andm

def png_frame(im: Image.Image) -> bytes:
    b = io.BytesIO(); im.save(b, "PNG", optimize=True); return b.getvalue()

frames = []
for s in BMP_SIZES:
    frames.append((s, 32, bmp_frame(src.resize((s, s), Image.LANCZOS))))
for s in PNG_SIZES:
    frames.append((s, 32, png_frame(src.resize((s, s), Image.LANCZOS))))

n = len(frames)
out = bytearray(struct.pack("<HHH", 0, 1, n))
off = 6 + 16 * n
for s, bpp, data in frames:
    out += struct.pack("<BBBBHHII", 0 if s >= 256 else s, 0 if s >= 256 else s, 0, 0, 1, bpp, len(data), off)
    off += len(data)
for _, _, data in frames:
    out += data
open(OUT, "wb").write(out)
print("wrote", OUT, len(out), "bytes,", n, "frames:", ",".join(str(f[0]) + ("p" if f[0] in PNG_SIZES else "b") for f in frames))
