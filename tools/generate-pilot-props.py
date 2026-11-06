"""Offline authoring helper; never used by the browser.
Install gradio_client==2.6.1, then run from the game root with available ZeroGPU quota.
Optionally authenticate using the standard HF_TOKEN environment variable.
Stops on any service error; never retries or switches identities to evade quotas.
Raw GLBs still require decimation, collider review and visual acceptance before shipping.
"""
import argparse, os, shutil
from pathlib import Path
from gradio_client import Client, handle_file
parser=argparse.ArgumentParser()
parser.add_argument('prop',choices=['radio','rice-cooker','air-conditioner','stool','fish-crate'])
args=parser.parse_args()
root=Path('assets/generation/pilot');output=root/'raw'/f'{args.prop}.glb'
if output.exists():raise SystemExit('Output already exists; preserve it for review.')
client=Client('https://microsoft-trellis-2.hf.space',token=os.environ.get('HF_TOKEN'),httpx_kwargs={'timeout':120})
client.predict(api_name='/start_session')
reference=client.predict(handle_file(str(root/'references'/f'{args.prop}.png')),api_name='/preprocess_image')
client.predict(reference,1988,'512',7.5,.7,12,5,7.5,.5,12,3,1,0,12,3,api_name='/image_to_3d')
files=client.predict(100000,1024,api_name='/extract_glb')
output.parent.mkdir(parents=True,exist_ok=True)
shutil.copyfile(files[0],output)
client.predict(api_name='/end_session')
print(output)
