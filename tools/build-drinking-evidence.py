#!/usr/bin/env python3
"""Assemble actual capture contact sheets and browser-friendly video copies."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
import subprocess

root = Path(__file__).resolve().parents[1]
out = root / 'docs' / 'qa' / 'drinking'
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font = ImageFont.truetype(font_path, 20)
small = ImageFont.truetype(font_path, 16)
background = '#202528'


def viewport(file):
    image = Image.open(out / file).convert('RGB')
    # These captures are 1100x800. Remove only the page header and controls.
    return image.crop((0, 85, image.width, image.height - 79))


sheet = Image.new('RGB', (1500, 1020), background)
draw = ImageDraw.Draw(sheet)
draw.text((24, 14), 'Actual browser captures · grip, mouth contact and supported set-down', font=font, fill='#eee5d6')
for row, (drink, title) in enumerate([('beer', 'Beer'), ('whiskey', 'Whiskey'), ('gintonic', 'Gin and tonic')]):
    for col, (stage, label) in enumerate([('grip-oblique', 'Grip · 1.20 s'), ('mouth', 'Mouth · 3.50 s'), ('setdown', 'Set-down · 5.65 s')]):
        frame = viewport(f'{drink}-{stage}.png')
        frame.thumbnail((492, 284), Image.Resampling.LANCZOS)
        x, y = col * 500 + 4, row * 322 + 54
        sheet.paste(frame, (x, y))
        draw.text((x + 10, y + 287), f'{title} / {label}', font=small, fill='#d8ddd9')
sheet.save(out / 'contact-sheet.png')

sheet = Image.new('RGB', (1800, 780), background)
draw = ImageDraw.Draw(sheet)
draw.text((20, 14), 'Neighbouring frames around contact transitions · shared beer cycle', font=font, fill='#eee5d6')
for row, (phase, centre) in enumerate([('grasp', 1.20), ('lip', 2.60), ('table', 5.65)]):
    for col in range(5):
        frame = viewport(f'transition-{phase}-{col}.png')
        frame.thumbnail((352, 204), Image.Resampling.LANCZOS)
        x, y = col * 360 + 4, row * 240 + 50
        sheet.paste(frame, (x, y))
        draw.text((x + 8, y + 207), f'{phase} / {centre + (col - 2) / 60:.4f} s', font=small, fill='#d8ddd9')
sheet.save(out / 'transition-contact-sheet.png')

metadata = []
for source in sorted(out.glob('*.webm')):
    target = source.with_suffix('.mp4')
    # Preserve elapsed playback time. A 30 Hz delivery track holds existing
    # frames where necessary; it neither speeds up nor interpolates motion.
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
                    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-threads', '2',
                    '-pix_fmt', 'yuv420p', '-vf', 'fps=30', '-fps_mode', 'cfr',
                    '-movflags', '+faststart', str(target)], check=True)
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames',
        '-show_entries', 'stream=codec_name,width,height,avg_frame_rate,nb_read_frames:format=duration,size',
        '-of', 'json', str(target)]))
    metadata.append({'source': source.name, 'delivery': target.name, **probe})
(out / 'video-files.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Created two contact sheets and {len(metadata)} MP4 copies from real browser captures.')
