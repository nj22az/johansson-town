"""Blender 4.5: measured, editable skirt study. No runtime replacement.

blender -b --python vy_skirt_study.py -- --reference /path/source.glb --output /path/out
The supplied character is retained only in the native review scene, not the garment GLB.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

parser = argparse.ArgumentParser()
parser.add_argument('--reference', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--render', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=args.reference)
source = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
source.name = 'REFERENCE — supplied static character (not authored here)'
bpy.context.view_layer.objects.active = source
source.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

reference_collection = collection('01 SUPPLIED REFERENCE — static, unrigged')
for c in list(source.users_collection):
    c.objects.unlink(source)
reference_collection.objects.link(source)
study_collection = collection('02 AUTHORED GARMENT — editable quad cage')
qa_collection = collection('03 REFERENCE CROP — review only')
stage_collection = collection('04 MATCHED CAMERAS AND LIGHTS')

def mesh_object(name, verts, faces, coll=study_collection):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    for p in mesh.polygons:
        p.use_smooth = True
    return obj

def material(name, colour, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*colour, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*colour, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = .25
    return mat

cloth = material('Soft charcoal twill — no painted fake folds', (.018, .020, .023), .73)
bsdf=cloth.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Sheen Weight'].default_value=.12
bsdf.inputs['Sheen Roughness'].default_value=.55
bsdf.inputs['Anisotropic'].default_value=.08
# Preview-only tactile response. This node graph is not exported as an assumed
# Three.js shader: runtime parity requires its own measured material path.
nodes=cloth.node_tree.nodes;links=cloth.node_tree.links
uv_node=nodes.new('ShaderNodeTexCoord')
waves=[]
for direction in ['X','Y']:
    wave=nodes.new('ShaderNodeTexWave');wave.bands_direction=direction
    wave.inputs['Scale'].default_value=220
    links.new(uv_node.outputs['UV'],wave.inputs['Vector']);waves.append(wave)
multiply=nodes.new('ShaderNodeMath');multiply.operation='MULTIPLY'
for i,wave in enumerate(waves):links.new(wave.outputs['Color'],multiply.inputs[i])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.07;bump.inputs['Distance'].default_value=.00006
links.new(multiply.outputs[0],bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
clay = material('Neutral geometry comparison', (.32, .35, .39), .68)

# The source is a single scanned/generated surface, with arms alongside the skirt.
# Keep only dark faces inside the garment envelope. This crop is explicitly QA,
# never the export. Measurements use first garment intersections, not outer arm hits.
mesh = source.data
uv = mesh.uv_layers.active.data
images = [n.image for n in source.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE']
base = next(im for im in images if 'base' in im.name.lower() or 'color' in im.name.lower()) if any('base' in im.name.lower() or 'color' in im.name.lower() for im in images) else images[0]
pixels = list(base.pixels)
w, h = base.size

def is_dark(poly):
    coord = sum((uv[li].uv for li in poly.loop_indices), Vector((0., 0.))) / len(poly.loop_indices)
    x, y = int(coord.x % 1 * (w - 1)), int(coord.y % 1 * (h - 1))
    p = (y * w + x) * 4
    return max(pixels[p:p + 3]) < .30

crop_faces = []
for p in mesh.polygons:
    c = p.center
    # Shoulder/sleeve stripes are outside this restrained skirt envelope.
    t = min(1, max(0, (-.105 - c.z) / .27))
    bound = .14 + .065 * math.sin(t * math.pi / 2)
    if -.379 < c.z < -.103 and abs(c.x) < bound + .009 and -.195 < c.y < .14 and is_dark(p):
        crop_faces.append(tuple(p.vertices))
used = sorted({v for f in crop_faces for v in f})
indices = {old: new for new, old in enumerate(used)}
crop = mesh_object('SUPPLIED skirt surface crop — bounded colour selection', [mesh.vertices[v].co for v in used], [tuple(indices[v] for v in f) for f in crop_faces], qa_collection)
crop.data.materials.append(clay)
bvh = BVHTree.FromPolygons([v.co for v in crop.data.vertices], [p.vertices for p in crop.data.polygons])

def hit(z, angle, cy):
    direction = Vector((math.sin(angle), -math.cos(angle), 0))
    p, _, _, _ = bvh.ray_cast(Vector((0, cy, z)), direction, .35)
    return p

rows = []
for z in [-.108, -.125, -.15, -.175, -.2, -.225, -.25, -.275, -.3, -.325]:
    front, back = hit(z, 0, -.05), hit(z, math.pi, -.05)
    if front is None or back is None:
        raise RuntimeError(f'Garment measurement missing at {z}')
    cy = (front.y + back.y) / 2
    left, right = hit(z, -math.pi / 2, cy), hit(z, math.pi / 2, cy)
    if left is None or right is None:
        raise RuntimeError(f'Side measurement missing at {z}')
    rows.append(dict(z=z, half_width=(right.x-left.x)/2, front_y=front.y, back_y=back.y, centre_y=cy))
print('MEASURED_GARMENT', json.dumps(rows), flush=True)

# Four named panels meet at the front/back/side lines; each has its own surface
# shape. This is a sewn-form cage, not a surface of revolution scaled in depth.
N = 64
levels = [0, .008, .04, .10, .20, .32, .46, .60, .74, .86, .95, .985, 1]
waist_z, hem_z = -.105, -.375

def profile(z):
    z = max(rows[-1]['z'], min(rows[0]['z'], z))
    for a, b in zip(rows, rows[1:]):
        if b['z'] <= z <= a['z']:
            t = (z-a['z'])/(b['z']-a['z'])
            return {k: a[k]*(1-t)+b[k]*t for k in ['half_width','front_y','back_y','centre_y']}
    return rows[-1]

verts, faces = [], []
def waist_wave(a):
    return -.0016*max(0,math.cos(a))**4+.0010*math.sin(a)**4

def angular_distance(a,b):
    return math.atan2(math.sin(a-b),math.cos(a-b))

for t in levels:
    z = waist_z + (hem_z-waist_z)*t
    p = profile(z)
    for i in range(N):
        a = 2*math.pi*i/N
        sx, c = math.sin(a), math.cos(a)
        # Separate flatter front panel and fuller seat; lateral transitions have
        # controlled fullness instead of a uniform ellipse.
        exp = .88 if c >= 0 else .97
        x = p['half_width'] * math.copysign(abs(sx)**exp, sx)
        depth = p['centre_y']-p['front_y'] if c >= 0 else p['back_y']-p['centre_y']
        y = p['centre_y'] - math.copysign(depth * abs(c)**(.78 if c>=0 else .92), c)
        # Extremely restrained longitudinal panel ease, strongest below hip.
        ease = .0012*math.sin(math.pi*t)**2 * math.sin(4*a)**2
        x += ease*sx
        y -= ease*c
        # Three broad, deliberately offset release lines; no dense random
        # wrinkles. Their envelope dies at the hem so the clean outline remains.
        release=max(0,min(1,(t-.60)/.40))
        flutes=sum(amp*math.exp(-(angular_distance(a,centre)/.24)**2)
                   for centre,amp in [(-.32,.0014),(.56,-.0010),(math.pi+.26,.0013)])
        radial=flutes*math.sin(math.pi*release)
        seam=-.00055*sum(math.exp(-(angular_distance(a,side)/.065)**2) for side in [math.pi/2,3*math.pi/2])
        x+=(radial+seam)*sx;y-=(radial+seam)*c
        # Turn the outer panel into the lower hem over the final 1.35 cm of
        # source-space height. This is visible form in the cage, not a shader
        # trick or a razor-thin boundary left for the bevel to disguise.
        turn=max(0,min(1,(t-.95)/.05))
        turn=.004*turn*turn*(3-2*turn)
        x-=turn*sx
        y+=turn*c
        verts.append((x,y,z+waist_wave(a)*(1-t)**4))
for j in range(len(levels)-1):
    for i in range(N):
        q=(i+1)%N
        # Outward winding, front of character is -Y.
        faces.append((j*N+i,(j+1)*N+i,(j+1)*N+q,j*N+q))
skirt = mesh_object('Skirt — front, back and side panel cage', verts, faces)
skirt.data.materials.append(cloth)
skirt['construction'] = 'Original editable panel surface, measured against supplied static reference; not rigged.'
for label, predicate in [('Front panel', lambda a: math.cos(a)>.5), ('Back panel', lambda a: math.cos(a)<-.5), ('Side panels',lambda a: abs(math.cos(a))<=.5), ('Waist anchor',lambda a: True)]:
    group=skirt.vertex_groups.new(name=label)
    ids=[j*N+i for j,t in enumerate(levels) for i in range(N) if predicate(i*2*math.pi/N) and (label!='Waist anchor' or t<.041)]
    group.add(ids, 1, 'REPLACE')
skirt.shape_key_add(name='Basis')
for name in ['Waist width', 'Hip width', 'Seat depth', 'Front ease', 'Length', 'Hem flare']:
    key=skirt.shape_key_add(name=name)
    for i,v in enumerate(verts):
        x,y,z=v; t=levels[i//N]; a=(i%N)*2*math.pi/N
        if name=='Waist width': x += .025*(1-t)**3*math.sin(a)
        elif name=='Hip width': x += .025*math.sin(math.pi*t)*math.sin(a)
        elif name=='Seat depth': y += .03*max(0,-math.cos(a))*math.sin(math.pi*t/2)
        elif name=='Front ease': y -= .018*max(0,math.cos(a))*math.sin(math.pi*t)
        elif name=='Length': z -= .065*t
        elif name=='Hem flare': x += .035*t*t*math.sin(a); y -= .018*t*t*math.cos(a)
        key.data[i].co=(x,y,z)
    key.slider_min=-1
    key.slider_max=1
sub=skirt.modifiers.new('Smooth panel transitions', 'SUBSURF'); sub.levels=1; sub.render_levels=2
solid=skirt.modifiers.new('Cloth thickness and inner lining', 'SOLIDIFY'); solid.thickness=.0045; solid.offset=-1; solid.use_even_offset=True
bevel=skirt.modifiers.new('Soft turned hem edge', 'BEVEL'); bevel.width=.0022; bevel.segments=3

# A distinct narrow, closed band, fitted to the same waist contour. The band
# follows width/hip fitting keys so the garment remains a coherent editable asset.
band_verts=[]; band_faces=[]
for z,offset in [(-.1045,.0008),(-.106,.0012),(-.119,.0007),(-.121,.00015)]:
    p=profile(z)
    for i in range(N):
        a=i*2*math.pi/N; sx=math.sin(a); c=math.cos(a)
        x=(p['half_width']+offset)*math.copysign(abs(sx)**(.88 if c>=0 else .97),sx)
        d=p['centre_y']-p['front_y'] if c>=0 else p['back_y']-p['centre_y']
        y=p['centre_y']-math.copysign((d+offset)*abs(c)**(.78 if c>=0 else .92),c)
        band_verts.append((x,y,z+waist_wave(a)))
for j in range(3):
    for i in range(N):
        q=(i+1)%N; band_faces.append((j*N+i,(j+1)*N+i,(j+1)*N+q,j*N+q))
band=mesh_object('Waistband — separate fitted construction',band_verts,band_faces)
band.data.materials.append(cloth)
band.shape_key_add(name='Basis')
for name in ['Waist width','Hip width','Seat depth','Front ease','Length','Hem flare']:
    key=band.shape_key_add(name=name)
    for i,v in enumerate(band_verts):
        x,y,z=v;t=(waist_z-z)/(waist_z-hem_z);a=(i%N)*2*math.pi/N
        if name=='Waist width': x+=.025*(1-t)**3*math.sin(a)
        elif name=='Hip width': x+=.025*math.sin(math.pi*t)*math.sin(a)
        elif name=='Seat depth': y+=.03*max(0,-math.cos(a))*math.sin(math.pi*t/2)
        elif name=='Front ease': y-=.018*max(0,math.cos(a))*math.sin(math.pi*t)
        elif name=='Length': z-=.065*t
        elif name=='Hem flare': x+=.035*t*t*math.sin(a);y-=.018*t*t*math.cos(a)
        key.data[i].co=(x,y,z)
    key.slider_min=-1
    driver=key.driver_add('value').driver;driver.type='AVERAGE'
    var=driver.variables.new();var.name='fit';var.type='SINGLE_PROP';var.targets[0].id=skirt
    var.targets[0].data_path=f'data.shape_keys.key_blocks["{name}"].value'
sub=band.modifiers.new('Soft band', 'SUBSURF');sub.levels=1;sub.render_levels=2
solid=band.modifiers.new('Closed band thickness', 'SOLIDIFY');solid.thickness=.0013;solid.offset=-1
bev=band.modifiers.new('Band edge', 'BEVEL');bev.width=.0004;bev.segments=2
seam_group=band.vertex_groups.new(name='Soft lower seam normals')
seam_group.add(list(range(N*2,N*3)),.35,'REPLACE')
seam_group.add(list(range(N*3,N*4)),1,'REPLACE')
transfer=band.modifiers.new('Blend lower seam into skirt normals','DATA_TRANSFER')
transfer.object=skirt;transfer.use_loop_data=True;transfer.data_types_loops={'CUSTOM_NORMAL'}
transfer.loop_mapping='POLYINTERP_NEAREST';transfer.vertex_group=seam_group.name

# UVs are stable across fitting keys, for future authored cloth maps.
for obj, ring_count in [(skirt,len(levels)),(band,4)]:
    uv_layer=obj.data.uv_layers.new(name='Garment panels')
    for poly in obj.data.polygons:
        for li in poly.loop_indices:
            vi=obj.data.loops[li].vertex_index
            u=(vi%N)/N
            if poly.index%N==N-1 and vi%N==0:u=1
            uv_layer.data[li].uv=(u,(vi//N)/(ring_count-1))

# Explicit interchange cage: no dependency on Blender modifier internals or the
# supplied dense character. Fit deltas can be baked before the existing rig is
# bound; this is authoring data, not an enabled runtime asset.
cage={'version':1,'axes':'Blender Z up, front -Y; Three.js conversion [x,z,-y]',
      'source_height':1.902922,'waist_z':waist_z,'hem_z':hem_z,'parts':[]}
for obj in [skirt,band]:
    basis=[list(v.co) for v in obj.data.shape_keys.key_blocks['Basis'].data]
    cage['parts'].append({'name':obj.name,'positions':[[round(v,7) for v in co] for co in basis],
        'quads':[list(p.vertices) for p in obj.data.polygons],
        'corner_uvs':[[round(v,7) for v in loop.uv] for loop in obj.data.uv_layers.active.data],
        'fit_deltas':{key.name:[[round(v.co[a]-basis[i][a],7) for a in range(3)] for i,v in enumerate(key.data)] for key in list(obj.data.shape_keys.key_blocks)[1:]}})
(out/'Vy-skirt-fit-cage.json').write_text(json.dumps(cage,separators=(',',':'))+'\n')

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Neutral studio world')
scene.world.color=(.25,.25,.25)
scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.55,.55,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5

def area(name, location, power, size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);stage_collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector((0,0,-.2))-obj.location).to_track_quat('-Z','Y').to_euler()
area('Neutral key',(-2,-3,4),320,3)
area('Soft fill',(3,-1,1),150,3)
area('Rear separation',(0,3,2),220,2)
cams={}
for name,position in [('front',(0,-3,-.24)),('quarter',(2,-3,-.18)),('side',(3,0,-.24)),('back',(0,3,-.24))]:
    data=bpy.data.cameras.new(name);data.type='ORTHO';data.ortho_scale=.52
    obj=bpy.data.objects.new('MATCHED '+name,data);stage_collection.objects.link(obj);obj.location=position
    obj.rotation_euler=(Vector((0,-.025,-.24))-obj.location).to_track_quat('-Z','Y').to_euler();cams[name]=obj
scene.camera=cams['quarter']

report={'source_file':Path(args.reference).name,'units':'source glTF units; Blender Z up, front -Y','selection':'Dark surface faces, z -0.379 to -0.103, bounded skirt envelope. First ray hits exclude external sleeve/arm surfaces. Crop is a review aid, not a clean garment asset.','waist_z':waist_z,'hem_z':hem_z,'length':waist_z-hem_z,'reference_body_height':1.902922,'cardinal_measurements':rows,'cage_vertices':len(verts),'cage_quads':len(faces),'fit_controls':[k.name for k in skirt.data.shape_keys.key_blocks][1:],'limitations':['Static garment study, not skinned or cloth simulated.','Reference crop retains source imperfections and may have selection holes.','No full original body, hair, face or top reconstruction claimed.','Shape-key extremes require body fitting and pose validation before runtime use.']}
(out/'reference-measurements.json').write_text(json.dumps(report,indent=2)+'\n')

source.hide_render=True;crop.hide_render=True
bpy.ops.object.select_all(action='DESELECT')
skirt.select_set(True);band.select_set(True);bpy.context.view_layer.objects.active=skirt
# Export a fixed evaluated rest mesh, retaining original editable keys in .blend.
# Applying non-topology-preserving thickness to morphs needs a dedicated bake;
# this rest export deliberately does not claim those keys survive GLB export.
export_objects=[]
for obj in [skirt,band]:
    subdivision=next(m for m in obj.modifiers if m.type=='SUBSURF')
    subdivision.levels=0
    bpy.context.view_layer.update()
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    baked=bpy.data.meshes.new_from_object(evaluated)
    # Bevel clamping can leave coincident zero-area strips at the tight upper
    # support loop. Clean the baked export, retaining the editable source cage.
    bm=bmesh.new();bm.from_mesh(baked)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7)
    bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=1e-7)
    bm.normal_update();bm.to_mesh(baked);bm.free()
    export_obj=bpy.data.objects.new(obj.name+' — rest export',baked)
    study_collection.objects.link(export_obj);export_objects.append(export_obj)
    subdivision.levels=1
skirt.select_set(False);band.select_set(False)
for o in export_objects:o.select_set(True)
bpy.context.view_layer.objects.active=export_objects[0]
bpy.ops.export_scene.gltf(filepath=str(out/'Vy-skirt-rest.glb'),use_selection=True,export_format='GLB',export_apply=True,export_yup=True)
report['rest_export_triangles']=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in export_objects)
(out/'reference-measurements.json').write_text(json.dumps(report,indent=2)+'\n')
for o in export_objects:bpy.data.objects.remove(o,do_unlink=True)

def render(label, objects, mat=None):
    source.hide_render=source not in objects;crop.hide_render=crop not in objects
    skirt.hide_render=skirt not in objects;band.hide_render=band not in objects
    scene.view_layers[0].material_override=mat
    for name,cam in cams.items():
        scene.camera=cam;scene.render.filepath=str(out/f'{label}-{name}.png');bpy.ops.render.render(write_still=True)

if args.render:
    render('reference-clay',[crop],clay)
    render('authored-clay',[skirt,band],clay)
    render('authored-cloth',[skirt,band])
    # Full source is displayed honestly as source only, for visual context.
    source.hide_render=False;crop.hide_render=True;skirt.hide_render=True;band.hide_render=True
    scene.view_layers[0].material_override=None
    scene.camera=cams['quarter'];scene.camera.data.ortho_scale=2.15
    scene.camera.location=(2,-3,.05);scene.camera.rotation_euler=(Vector((0,0,0))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/'supplied-character-context.png');bpy.ops.render.render(write_still=True)
    scene.camera.data.ortho_scale=.52

source.hide_render=True;source.hide_set(True);crop.hide_render=True;crop.hide_set(True)
skirt.hide_render=False;band.hide_render=False
scene.camera=cams['front'];scene.view_layers[0].material_override=None
bpy.ops.object.select_all(action='DESELECT');skirt.select_set(True);bpy.context.view_layer.objects.active=skirt
for screen in bpy.data.screens:
    for area_ui in screen.areas:
        if area_ui.type=='VIEW_3D':
            area_ui.spaces.active.region_3d.view_distance=.7
            area_ui.spaces.active.region_3d.view_location=(0,-.025,-.24)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Vy-skirt-study.blend'),compress=True)
print('STUDY_COMPLETE',json.dumps(report),flush=True)
