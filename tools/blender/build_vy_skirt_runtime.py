"""Bake a 1,472-triangle garment candidate with short returns, not full lining.

This is an unrigged material/geometry candidate, not an enabled Creator asset.
"""
import argparse
import json
import math
import sys
from collections import Counter
from pathlib import Path

import bpy
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('directory')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(args.directory)
bpy.ops.wm.open_mainfile(filepath=str(out/'Vy-skirt-study.blend'))
cage=json.loads((out/'Vy-skirt-fit-cage.json').read_text())
for previous in list(bpy.data.collections):
    if previous.name.startswith('05 RUNTIME CANDIDATE'):
        for obj in list(previous.objects):
            mesh=obj.data;bpy.data.objects.remove(obj,do_unlink=True)
            if mesh.users==0:bpy.data.meshes.remove(mesh)
        bpy.data.collections.remove(previous)
for previous in list(bpy.data.materials):
    if previous.name.startswith('Runtime charcoal') and previous.users==0:bpy.data.materials.remove(previous)
for previous in list(bpy.data.images):
    if previous.name.startswith('Garment micro weave normal') and previous.users==0:bpy.data.images.remove(previous)
collection=bpy.data.collections.new('05 RUNTIME CANDIDATE — unrigged, not accepted')
bpy.context.scene.collection.children.link(collection)

mat=bpy.data.materials.new('Runtime charcoal — sheen and micro weave')
mat.use_nodes=True
nodes=mat.node_tree.nodes;links=mat.node_tree.links;bsdf=nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.018,.020,.023,1)
bsdf.inputs['Roughness'].default_value=.73
bsdf.inputs['Specular IOR Level'].default_value=.25
bsdf.inputs['Sheen Weight'].default_value=.12
bsdf.inputs['Sheen Roughness'].default_value=.55
# glTF carries sheen colour, not Blender's independent weight. Keep the actual
# exported lobe restrained rather than silently exporting full white velvet.
bsdf.inputs['Sheen Tint'].default_value=(.06,.06,.06,1)
mat.use_backface_culling=False
image=bpy.data.images.new('Garment micro weave normal',width=256,height=256,alpha=False)
image.colorspace_settings.name='Non-Color'
pixels=[]
for y in range(256):
    for x in range(256):
        # A periodic, low-amplitude normal field, not painted wrinkle noise.
        u=x*2*math.pi/8;v=y*2*math.pi/8
        nx=.20*math.cos(u)*(.55+.45*math.sin(v))
        ny=.20*math.cos(v)*(.55-.45*math.sin(u))
        n=Vector((-nx,-ny,1)).normalized()
        pixels.extend((n.x*.5+.5,n.y*.5+.5,n.z*.5+.5,1))
image.pixels.foreach_set(pixels);image.filepath_raw=str(out/'Vy-skirt-weave-normal.png');image.file_format='PNG';image.save();image.pack()
texture=nodes.new('ShaderNodeTexImage');texture.image=image
normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.08
links.new(texture.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bsdf.inputs['Normal'])

objects=[];part_reports=[]
for part_index,part in enumerate(cage['parts']):
    ring_count=len(part['positions'])//64
    sampled=[[part['positions'][ring*64+i] for i in range(0,64,2)] for ring in range(ring_count)]
    # Ring specification: source ring, radial inset, vertical offset.
    if part_index==0:
        specs=[(0,.0025,-.006),(0,.0025,-.001)]+[(j,0,0) for j in range(ring_count)]+[(ring_count-1,.002,.0015),(ring_count-1,.0045,.007),(ring_count-1,.0045,.014)]
        close=False
    else:
        specs=[(j,0,0) for j in range(ring_count)]+[(ring_count-1,.0013,0),(0,.0025,0)]
        close=True
    positions=[];source_indices=[]
    for ring,inset,dz in specs:
        cy=-.049 if ring==0 else -.026 if part_index==0 and ring==ring_count-1 else -.047
        for i,co in enumerate(sampled[ring]):
            x,y,z=co;direction=Vector((x,y-cy,0)).normalized()
            positions.append((x-inset*direction.x,y-inset*direction.y,z+dz))
            source_indices.append(ring*64+i*2)
    faces=[]
    for row in range(len(specs) if close else len(specs)-1):
        nxt=(row+1)%len(specs)
        for i in range(32):
            q=(i+1)%32;faces.append((row*32+i,nxt*32+i,nxt*32+q,row*32+q))
    mesh=bpy.data.meshes.new('Reduced garment cage');mesh.from_pydata(positions,[],faces);mesh.update()
    obj=bpy.data.objects.new('Runtime '+('skirt' if part_index==0 else 'waistband'),mesh);collection.objects.link(obj)
    mesh.materials.append(mat)
    for face in mesh.polygons:face.use_smooth=True
    uv=mesh.uv_layers.new(name='Garment UV')
    for face in mesh.polygons:
        for li in face.loop_indices:
            vi=mesh.loops[li].vertex_index;row,i=divmod(vi,32)
            u=i/32
            if face.index%32==31 and i==0:u=1
            # Give the return strips actual UV area. Reusing an outer ring's V
            # collapses their UVs and produces invalid tangent-space highlights.
            uv.data[li].uv=(u,row/(len(specs)-1))
    for face in mesh.polygons:
        coords=[uv.data[li].uv for li in face.loop_indices]
        twice_area=abs(sum(a.x*b.y-b.x*a.y for a,b in zip(coords,coords[1:]+coords[:1])))
        assert twice_area>1e-10,'Collapsed UV return strip'
    obj.shape_key_add(name='Basis')
    for name,deltas in part['fit_deltas'].items():
        key=obj.shape_key_add(name=name)
        for i,(base,source_i) in enumerate(zip(positions,source_indices)):
            key.data[i].co=Vector(base)+Vector(deltas[source_i])
        key.slider_min=-1
    counts=Counter()
    for face in faces:
        for a,b in zip(face,face[1:]+face[:1]):counts[tuple(sorted((a,b)))]+=1
    boundary=sum(v==1 for v in counts.values());nonmanifold=sum(v>2 for v in counts.values())
    assert nonmanifold==0
    assert boundary==(64 if part_index==0 else 0)
    part_reports.append({'name':obj.name,'vertices':len(positions),'quads':len(faces),'triangles':len(faces)*2,'boundary_edges':boundary,'more_than_two_face_edges':nonmanifold})
    objects.append(obj)
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(out/'Vy-skirt-runtime-candidate.glb'),use_selection=True,export_format='GLB',export_apply=False,export_morph=True,export_yup=True)
triangles=sum(p['triangles'] for p in part_reports)
assert 1200<=triangles<=1600
raw=(out/'Vy-skirt-runtime-candidate.glb').read_bytes()
length=int.from_bytes(raw[12:16],'little');gltf=json.loads(raw[20:20+length])
material=gltf['materials'][0]
checks={'within_1200_1600_triangles':True,'two_garment_meshes':len(gltf['meshes'])==2,
        'six_exported_fit_targets':all(len(m['primitives'][0].get('targets',[]))==6 for m in gltf['meshes']),
        'normal_texture_exported':'normalTexture' in material,
        'sheen_exported':'KHR_materials_sheen' in material.get('extensions',{}),
        'short_returns_no_full_lining':part_reports[0]['boundary_edges']==64,
        'no_skeleton_or_animation':not gltf.get('skins') and not gltf.get('animations')}
assert all(checks.values()),checks
report={'triangles':triangles,'parts':part_reports,'checks':checks,'glb_bytes':len(raw),
    'status':'Unrigged runtime geometry/material candidate. Not integrated or pose accepted.',
    'material_limits':'Sheen and low-strength tangent normal texture export verified in GLB metadata; Three.js render parity and performance still require inspection.',
    'normal_scale':material['normalTexture'].get('scale',1),
    'lining':'Only top tuck returns and three-ring hem returns remain. The two open boundaries are intentional; the waist band is closed.',
    'unverified':['Dressed-body fit','Shirt tuck clearance in motion','Thigh splay and sitting correctives','Shared rig binding','Runtime shader/render parity','Device performance']}
(out/'runtime-candidate-verification.json').write_text(json.dumps(report,indent=2)+'\n')
for obj in objects:obj.hide_render=True;obj.hide_set(True)
skirt=bpy.data.objects['Skirt — front, back and side panel cage']
bpy.ops.object.select_all(action='DESELECT');skirt.select_set(True);bpy.context.view_layer.objects.active=skirt
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Vy-skirt-study.blend'),compress=True)
print('RUNTIME_CANDIDATE',json.dumps(report),flush=True)
