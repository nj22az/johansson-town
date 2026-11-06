"""Render generated Khaaka plans without a browser; coordinates remain in metres."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
folder=Path(__file__).resolve().parent.parent/'docs'/'building-plans'
try:
    font=ImageFont.truetype('DejaVuSans.ttf',14)
except OSError:
    font=ImageFont.load_default(size=14)
for name in sys.argv[1:]:
    plan=json.loads((folder/(name+'.khaaka.json')).read_text())
    coords=[(p['x'],p['y']) for o in plan['objects'] for p in o.get('points',[])]
    w=max(x for x,y in coords); h=max(y for x,y in coords)
    scale=min(55,1000/max(w,h)); left,top=65,100
    legend=['Green: sampled floor surfaces. Brown: walls and solid fittings.',
            'Domain extent is not net walkable area. Grid: 0.91 m.']
    titles=[o['text'] for o in plan['objects'] if o['type']=='text']
    text_width=max(font.getbbox(text)[2] for text in legend+titles)
    image=Image.new('RGB',(max(int(w*scale)+130,text_width+130),int(h*scale)+200),'#faf8f2'); d=ImageDraw.Draw(image)
    xy=lambda x,y:(left+x*scale,top+y*scale)
    for o in plan['objects']:
        if o['type']=='polygon':
            d.polygon([xy(p['x'],p['y']) for p in o['points']],fill=o['fill'])
    for axis,extent in [(0,w),(1,h)]:
        n=0
        while n*.91<=extent:
            v=n*.91
            d.line([xy(v,0),xy(v,h)] if axis==0 else [xy(0,v),xy(w,v)],fill='#bdb8ab',width=1)
            n+=1
    for o in plan['objects']:
        if o['type']=='text':d.text(xy(o['x'],o['y']),o['text'],font=font,fill=o['fill'])
    d.text((left,image.height-75),'Green: sampled floor surfaces. Brown: walls and solid fittings.',font=font,fill='#333333')
    d.text((left,image.height-50),'Domain extent is not net walkable area. Grid: 0.91 m.',font=font,fill='#333333')
    image.save(folder/(name+'.png'))
