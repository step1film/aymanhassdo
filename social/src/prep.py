# Beskär produktbildernas genomskinliga kant så att produkten fyller sin ruta.
from PIL import Image
import json, os
OUT = os.environ['PREP_DIR']
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
P = json.load(open(os.path.join(os.path.dirname(__file__), 'products.json')))
os.makedirs(OUT, exist_ok=True)
for p in P:
    im = Image.open(os.path.join(ROOT, 'assets/products', p['image'])).convert('RGBA')
    bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im.crop(bbox).save(f"{OUT}/{p['id']}.png")
