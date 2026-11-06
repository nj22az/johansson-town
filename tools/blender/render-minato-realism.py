"""Render the exported Minato scene at actual furniture/detail camera distances.

Run after build-minato-interior.py. No runtime props or invisible audit geometry.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--views',default='');a=p.parse_args(args)
root=Path(a.root).resolve();art=root/'art/izakaya'
bpy.ops.wm.open_mainfile(filepath=str(art/'minato-interior.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.cycles.use_denoising=True
scene.render.resolution_x=1440;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
if scene.world is None:scene.world=bpy.data.worlds.new('Warm night ambient')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.13,.115,.10,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.32
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'

def loc(p):return p[0],-p[2],p[1]
def light(name,p,energy,size,color):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc(p)
 target=Vector(loc((p[0],.6,p[2])))
 o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
for x,z in ((-3.6,-2.3),(1.8,-2.5),(-3.5,2.2),(3.4,2.5)):
 light('Practical warm room fill',(x,3.1,z),210,3.1,(1.,.78,.56))
for x in (-3.,2.,8.5):light('Kitchen practical',(x,3.2,-5.0),145,2.1,(1.,.9,.76))
light('Entry night spill',(-3.9,3.1,5.7),85,2.,(.65,.75,1.))
data=bpy.data.cameras.new('Minato review camera');cam=bpy.data.objects.new('Minato review camera',data)
scene.collection.objects.link(cam);scene.camera=cam
views=[
 ('minato-interior',(0,3.18,5.65),(0,1.28,-2.72),18),
 ('minato-real-kitchen',(5.5,2.18,-3.92),(1.55,1.0,-5.95),22),
 ('minato-real-table',(-1.97,2.00,3.11),(-3.53,1.02,2.22),38),
 ('minato-real-bottles',(-2.83,2.13,-4.33),(-2.87,1.96,-6.1),18),
 ('minato-real-counter',(1.25,2.09,-.60),(1.27,1.07,-3.01),29),
 ('minato-real-entry',(-2.24,2.27,3.99),(-4.15,1.55,6.27),30),
]
for name,at,target,lens in views:
 if a.views and name not in a.views.split(','):continue
 cam.location=loc(at);cam.rotation_euler=(Vector(loc(target))-cam.location).to_track_quat('-Z','Y').to_euler()
 data.lens=lens;data.clip_start=.02;data.clip_end=100
 scene.render.filepath=str(art/(name+'.png'))
 bpy.ops.render.render(write_still=True)
 print('Rendered',name,flush=True)
