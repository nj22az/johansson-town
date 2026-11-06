"""Render the game's review-label metadata using an installed Japanese font."""
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
font=Path(sys.argv[1]);out=Path('/tmp/town-review-labels');out.mkdir(exist_ok=True)
for kind in ['interior','exterior']:
 d=json.loads(Path('/tmp/town-store-'+kind+'.json').read_text())
 for key,mat in d['materials'].items():
  label=mat.get('label')
  if not label or 'jp' not in label:continue
  im=Image.new('RGB',(512,128),'#f4eacf');draw=ImageDraw.Draw(im);draw.rectangle((0,0,12,128),fill=label.get('accent','#b24b4b'))
  draw.text((256,2),label['jp'],font=ImageFont.truetype(str(font),46),fill='#342f29',anchor='mt')
  draw.text((256,76),label['en'],font=ImageFont.truetype(str(font),20),fill='#342f29',anchor='mt');im.save(out/(key+'.png'))
