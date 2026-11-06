"""Render a 12-angle orbit and five construction views from the native study."""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('directory')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.directory)
bpy.ops.wm.open_mainfile(filepath=str(out/'Vy-skirt-study.blend'))
scene=bpy.context.scene
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.cycles.samples=32
scene.view_layers[0].material_override=None
camera=scene.camera
camera.data.ortho_scale=.52
skirt=bpy.data.objects['Skirt — front, back and side panel cage']
band=bpy.data.objects['Waistband — separate fitted construction']
def view(name,position,target=(0,-.025,-.24),scale=.52):
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=scale
    scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
for angle in range(0,360,30):
    a=math.radians(angle)
    view(f'orbit-{angle:03d}',(3*math.sin(a),-3*math.cos(a),-.20))
view('detail-high',(0,-1,.65))
view('detail-underside',(.65,-1,-.95))
view('detail-waist',(.3,-1,.15),(0,-.13,-.115),.24)
view('detail-hem',(.7,-1,-.45),(.11,-.13,-.361),.18)
scene.view_layers[0].material_override=bpy.data.materials['Neutral geometry comparison']
wire=skirt.copy();wire.data=skirt.data.copy();bpy.context.collection.objects.link(wire)
for mod in list(wire.modifiers):wire.modifiers.remove(mod)
wire.data.materials.clear()
mat=bpy.data.materials.new('Review topology lines');mat.diffuse_color=(.01,.08,.16,1)
wire.data.materials.append(mat)
mod=wire.modifiers.new('Visible quad cage','WIREFRAME');mod.thickness=.0008;mod.offset=1
# A material override would also hide the topology colour, so set the base clay
# directly for this one view and render the cage as a separate material object.
scene.view_layers[0].material_override=None
skirt.data.materials[0]=bpy.data.materials['Neutral geometry comparison']
band.data.materials[0]=bpy.data.materials['Neutral geometry comparison']
view('detail-cage',(2,-3,-.05))
print('REVIEW_VIEWS_COMPLETE',flush=True)
