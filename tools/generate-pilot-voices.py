"""Offline authoring only. Public Qwen Space; stop on errors or quota limits.
Run from the game root: python -u tools/generate-pilot-voices.py
Existing outputs are preserved. No model or service is called by the game.
"""
import json, subprocess
from pathlib import Path
HOST='https://qwen-qwen3-tts.hf.space'
def curl(*args):
    return subprocess.check_output(['curl','-fsSL','--max-time','180',*args])
rows=json.loads(Path('assets/generation/pilot/voices.json').read_text())
folder=Path('assets/audio/voices');folder.mkdir(parents=True,exist_ok=True)
for row in rows:
    output=folder/(row['id']+'.wav')
    if output.exists(): continue
    payload=json.dumps({'data':[row['ja'],'Japanese',row['speaker'],row['instruction'],'1.7B']})
    event=json.loads(curl('-H','Content-Type: application/json','-d',payload,HOST+'/gradio_api/call/generate_custom_voice'))['event_id']
    response=curl(HOST+'/gradio_api/call/generate_custom_voice/'+event).decode()
    lines=response.splitlines();result=None
    for i,line in enumerate(lines):
        if line=='event: error':raise RuntimeError(response)
        if line=='event: complete': result=json.loads(lines[i+1][6:])
    if not result or not result[0]:raise RuntimeError(response)
    data=curl(result[0]['url'])
    if data[:4]!=b'RIFF':raise RuntimeError('Not WAV: '+row['id'])
    output.write_bytes(data)
    (folder/(row['id']+'.source.json')).write_text(json.dumps({'model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice','space':'Qwen/Qwen3-TTS','event':event,'request':json.loads(payload)},ensure_ascii=False,indent=2)+'\n')
    print('Saved '+str(output),flush=True)
