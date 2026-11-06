"""Audit saved metric cameras; optionally render selected views without rebuilding meshes."""
import bpy,json,math,sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'art/ferry-engine-room'
bpy.ops.wm.open_mainfile(filepath=str(ART/'Minato_Maru_Engine_Room_H1.blend'))
scene=bpy.context.scene;data=json.loads((ART/'geometry-h1.json').read_text());rows=[]
collection=bpy.data.collections['CAD H1 - retained machinery']
collection.asset_mark()
collection.asset_data.description='Minato Maru measured H1-F1 machinery space. Metric source components; 2.4 m reserved working headroom.'
for tag in ['Minato Maru','Engine room','CAD H1','Blender only']:
 if tag not in collection.asset_data.tags:collection.asset_data.tags.new(tag)
assert scene.unit_settings.system=='METRIC' and scene.unit_settings.scale_length==1
for shot in data['shots']:
 camera=bpy.data.objects[shot['id']];x,y,z=camera.location
 pos=[17.25-y,x,z+1.9];fov=math.degrees(2*math.atan(camera.data.sensor_height/(2*camera.data.lens)))
 assert max(abs(a-b)for a,b in zip(pos,shot['pos']))<.00001
 assert abs(fov-shot['fov'])<.00001
 X,Y,Z=shot['at'];target=Vector((Y,17.25-X,Z-1.9))
 assert abs(camera.rotation_euler.to_quaternion().dot((target-camera.location).to_track_quat('-Z','Y')))>1-.00001
 camera.lock_location=(True,True,True);camera.lock_rotation=(True,True,True);camera.lock_scale=(True,True,True)
 rows.append({'id':shot['id'],'CAD_position':pos,'vertical_fov':fov,'transforms_locked':True})
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'Minato_Maru_Engine_Room_H1.blend'),compress=True)
out=ROOT/'docs/qa/ferry-engine-room-h1';out.mkdir(parents=True,exist_ok=True)
(out/'blender-audit.json').write_text(json.dumps({'units':'metres','source_components':len(bpy.data.collections['CAD H1 - retained machinery'].objects),'cameras':rows,'workflow':scene['asset_workflow'],'finish_revision':scene['finish_revision']},indent=2)+'\n')
if '--render'in sys.argv:
 selected=next((a.split('=',1)[1].split(',')for a in sys.argv if a.startswith('--shots=')),[s['id'] for s in data['shots']])
 scene.cycles.samples=64;scene.render.resolution_x=960;scene.render.resolution_y=720
 if '--cycles'not in sys.argv:
  scene.render.engine='BLENDER_EEVEE';scene.eevee.use_gtao=True;scene.eevee.gtao_distance=.3;scene.eevee.gtao_factor=1.25;scene.eevee.use_soft_shadows=True;scene.eevee.taa_render_samples=64
  glass=bpy.data.materials.get('Retained booth glass')
  if glass:
   glass.blend_method='BLEND';glass.shadow_method='NONE'
   bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Transmission Weight'].default_value=0;bs.inputs['Alpha'].default_value=.38
 for name in selected:
  scene.camera=bpy.data.objects[name];scene.render.filepath=str(ART/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
print('H1_SAVED_SCENE_AUDIT',len(rows),'cameras match CAD')
