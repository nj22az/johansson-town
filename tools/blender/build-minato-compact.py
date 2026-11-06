"""Author the compact Minato / Sato shared interior in Blender.

This prototype preserves the legacy room and the original walnut assets.
Coordinates in the plan and this file use metres, game X / Y-up / Z.  Blender
uses X / -Z / Y.  The retained walnut cabinet is imported at its authored size.

blender -b --python tools/blender/build-minato-compact.py -- --root . --plan PATH
"""
from pathlib import Path
import argparse
import importlib.util
import hashlib
import json
import math
import re
import struct
import sys
import tempfile

import bpy
import bmesh
from mathutils import Matrix, Vector


def loc(p):
    return (p[0], -p[2], p[1])


def linear(hex_colour):
    channels = [int(hex_colour.strip('#')[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels)


class CompactRoom:
    def __init__(self, root, plan, out):
        self.root, self.plan, self.out = root, plan, out
        self.scene = bpy.context.scene
        self.floor = float(plan.get('floorY', .04))
        self.materials = {}
        self.structural = []
        self.ceilings = []
        self.cutaway_walls = []
        self.objects = []
        self.notes = []
        self.current_owner = 'Thao'
        self.current_purpose = 'Fitted interior of Minato Izakaya; used by its guests and keeper.'
        self.font = None
        font_path = out/'minato-signs.otf'
        if font_path.exists():
            self.font = bpy.data.fonts.load(str(font_path))

    def tag(self, obj, owner=None, purpose=None, role=None):
        obj['owner'] = owner or self.current_owner
        obj['purpose'] = purpose or self.current_purpose
        obj['place'] = 'minato-compact'
        if role:
            obj['role'] = role
        self.objects.append(obj)
        return obj

    def material(self, name, colour, rough=.72, metal=0, emission=0, texture=None):
        if name in self.materials:
            return self.materials[name]
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bs = mat.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Base Color'].default_value = (*linear(colour), 1)
        bs.inputs['Roughness'].default_value = rough
        bs.inputs['Metallic'].default_value = metal
        if emission:
            bs.inputs['Emission Color'].default_value = (*linear(colour), 1)
            bs.inputs['Emission Strength'].default_value = emission
        if texture:
            image = bpy.data.images.load(str(texture), check_existing=True)
            image.pack()
            node = mat.node_tree.nodes.new('ShaderNodeTexImage')
            node.image = image
            mat.node_tree.links.new(node.outputs['Color'], bs.inputs['Base Color'])
        mat.use_backface_culling = True
        self.materials[name] = mat
        return mat

    def mesh(self, name, vertices, faces, material, smooth=False):
        data = bpy.data.meshes.new(name)
        data.from_pydata([loc(v) for v in vertices], [], faces)
        data.materials.append(material)
        data.update()
        obj = bpy.data.objects.new(name, data)
        self.scene.collection.objects.link(obj)
        for face in data.polygons:
            face.use_smooth = smooth
        return self.tag(obj)

    def box(self, name, size, at, material, bevel=0, omit=(), yaw=0):
        x, y, z = [s / 2 for s in size]
        vertices = [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
                    (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
        faces = [('back',(0,3,2,1)),('front',(4,5,6,7)),
                 ('bottom',(0,1,5,4)),('right',(1,2,6,5)),
                 ('top',(2,3,7,6)),('left',(3,0,4,7))]
        obj = self.mesh(name, vertices, [f for key,f in faces if key not in omit], material)
        obj.location = loc(at)
        obj.rotation_euler.z = yaw
        if bevel:
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) / 4), segments=2, affect='EDGES')
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(obj.data)
            bm.free()
        # World-size UVs give the retained walnut texture a physical grain scale.
        uv = obj.data.uv_layers.new(name='UVMap')
        for polygon in obj.data.polygons:
            normal = polygon.normal
            axis = max(range(3), key=lambda i: abs(normal[i]))
            indices = [i for i in range(3) if i != axis]
            for loop_index in polygon.loop_indices:
                co = obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
                uv.data[loop_index].uv = (co[indices[0]] / 1.2, co[indices[1]] / 1.2)
        return obj

    def lathe(self, name, profile, at, material, segments=20, ellipse=1):
        vertices = []
        for radius, y in profile:
            for i in range(segments):
                a = i * math.tau / segments
                vertices.append((at[0] + radius * math.cos(a), at[1] + y,
                                 at[2] + radius * math.sin(a) * ellipse))
        faces = [(j*segments+i,(j+1)*segments+i,
                  (j+1)*segments+(i+1)%segments,j*segments+(i+1)%segments)
                 for j in range(len(profile)-1) for i in range(segments)]
        return self.mesh(name, vertices, faces, material, True)

    def rod(self, name, start, end, radius, material, segments=12):
        start, end = Vector(start), Vector(end)
        axis = (end - start).normalized()
        ref = Vector((0,1,0)) if abs(axis.y) < .9 else Vector((1,0,0))
        u = axis.cross(ref).normalized()
        v = axis.cross(u).normalized()
        vertices = [tuple(p + radius * (u*math.cos(i*math.tau/segments)+v*math.sin(i*math.tau/segments)))
                    for p in (start,end) for i in range(segments)]
        faces = [(i,(i+1)%segments,segments+(i+1)%segments,segments+i) for i in range(segments)]
        faces += [tuple(reversed(range(segments))),tuple(range(segments,2*segments))]
        return self.mesh(name,vertices,faces,material,True)

    def text(self, name, value, at, size, material, yaw=0, align='CENTER'):
        curve = bpy.data.curves.new(name,'FONT')
        curve.body = value
        curve.size = size
        curve.align_x = align
        curve.align_y = 'CENTER'
        curve.resolution_u = 2
        curve.extrude = 0
        if self.font:
            curve.font = self.font
        obj = bpy.data.objects.new(name,curve)
        self.scene.collection.objects.link(obj)
        obj.location = loc(at)
        obj.rotation_euler = (math.pi/2,0,yaw)
        curve.materials.append(material)
        return self.tag(obj)

    def import_asset(self, path, name, at, yaw=0):
        before = set(self.scene.objects)
        bpy.ops.import_scene.gltf(filepath=str(path))
        imported = list(set(self.scene.objects)-before)
        roots = [o for o in imported if o.parent not in imported]
        holder = bpy.data.objects.new(name,None)
        self.scene.collection.objects.link(holder)
        holder.location = loc(at)
        holder.rotation_euler.z = yaw
        for obj in roots:
            obj.parent = holder
        purpose=('Retained original Walnut Harbour cabinet, forty-two bottles and fourteen fictional Higa Liquor house brands.'
                 if 'backbar' in name.lower().replace(' ','') else
                 'Shortened walnut service counter; human-scale mouldings and height, with depth authored to the compact plan.')
        for obj in imported:
            self.tag(obj,purpose=purpose)
        self.tag(holder,purpose=purpose)
        return holder

    def palette(self):
        self.material('Cedar floor', '#78553a', .7, texture=self.root/'art/izakaya/walnut-source/runtime-walnut.jpg')
        self.material('Cedar joinery', '#503727', .68)
        self.material('Honey cedar', '#986b45', .63)
        self.material('Warm lime plaster', '#b6a486', .93)
        self.material('Sato sage plaster', '#838b72', .95)
        self.material('Cream ceramic', '#e8dfca', .36)
        self.material('Indigo ceramic', '#31556b', .38)
        self.material('Brushed kitchen steel', '#a6aaa5', .42, .65)
        self.material('Dark fittings', '#302e2a', .63, .12)
        self.material('Oxblood upholstery', '#7d302c', .61)
        self.material('Aged brass', '#a08552', .4, .65)
        self.material('Noren indigo', '#293b51', .94)
        self.material('Warm lamp', '#ffcb85', .65, emission=3)
        self.material('Red lantern', '#bd3c2f', .82, emission=.22)
        self.material('Quarry tile', '#93705a', .86)
        self.material('Dark grout', '#4f4c43', .9)
        self.material('Paper', '#dfd1af', .94)
        self.material('Ink', '#2d2c28', .95)
        self.material('Celadon tile', '#bdc9b3', .65)
        self.material('Enamel cream', '#d4cdb4', .52)
        self.material('Tea', '#54331d', .28)
        self.material('Food cream', '#d4b983', .7)
        self.material('Food green', '#687b3f', .8)

    def stool(self, name, x, z, chrome=False):
        m = self.materials
        self.current_purpose = 'A usable place at the counter; seat top follows the game furniture standard.'
        self.lathe(name+' cushion',[(.16,.38),(.19,.39),(.195,.435),(.18,.46),(0,.46)],(x,0,z),m['Oxblood upholstery'],24)
        if chrome:
            self.lathe(name+' pedestal',[(.16,.04),(.17,.055),(.04,.075),(.028,.10),(.028,.38)],(x,0,z),m['Brushed kitchen steel'])
            for a in range(12):
                p=a*math.tau/12; q=(a+1)*math.tau/12
                self.rod(name+' foot ring',(x+.13*math.cos(p),.19,z+.13*math.sin(p)),(x+.13*math.cos(q),.19,z+.13*math.sin(q)),.009,m['Brushed kitchen steel'])
        else:
            for dx in (-.12,.12):
                for dz in (-.12,.12):
                    self.box(name+' leg',(.035,.34,.035),(x+dx,.21,z+dz),m['Cedar joinery'],.003,omit=('bottom','top'))
            for dx in (-.12,.12):
                self.rod(name+' side rung',(x+dx,.16,z-.12),(x+dx,.16,z+.12),.012,m['Cedar joinery'])
            for dz in (-.12,.12):
                self.rod(name+' front rung',(x-.12,.16,z+dz),(x+.12,.16,z+dz),.012,m['Cedar joinery'])

    def booth(self, x, z, width=1.5, table_depth=.75, bench_offset=.65):
        m=self.materials
        self.current_purpose = 'Four-person booth for the sisters and neighbouring residents; compact table leaves the service route clear.'
        self.box('Four-place booth table',(width,.055,table_depth),(x,.6925,z),m['Cedar floor'],.018)
        for dx in (-width*.37,width*.37):
            self.box('Booth table trestle',(.10,.60,.43),(x+dx,.365,z),m['Cedar joinery'],.01,omit=('bottom','top'))
            self.box('Booth table trestle foot',(.34,.05,.52),(x+dx,.065,z),m['Cedar joinery'],.01,omit=('bottom',))
        for side in (-1,1):
            bz=z+side*bench_offset
            self.box('Booth bench plinth',(width,.32,.40),(x,.20,bz),m['Cedar joinery'],.01,omit=('bottom',))
            self.box('Booth upholstered seat',(width,.10,.42),(x,.41,bz),m['Oxblood upholstery'],.025)
            self.box('Booth upholstered back',(width,.60,.10),(x,.75,bz+side*.235),m['Oxblood upholstery'],.025)
            self.box('Booth back cap',(width+.025,.045,.12),(x,1.0625,bz+side*.235),m['Cedar joinery'],.008)
            for dx in (-width*.25,width*.25):
                self.box('Booth stitched panel',(.003,.45,.006),(x+dx,.76,bz+side*.181),m['Cedar joinery'],.001)

    def place_setting(self, x, z, surface=.78, yaw=0):
        m=self.materials
        self.current_purpose = 'Guest table setting supplied by Thao; dishes and chopsticks are supported by the table surface.'
        self.lathe('Blue side plate',[(.035,0),(.06,.005),(.089,.014),(.09,.02),(.08,.023),(.055,.012),(0,.012)],(x,surface,z),m['Indigo ceramic'],24)
        self.lathe('Oolong cup',[(.025,0),(.03,.009),(.037,.075),(.036,.080),(.031,.080),(.026,.013),(0,.013)],(x+.20,surface,z-.025),m['Cream ceramic'],20)
        self.box('Chopstick paper sleeve',(.19,.004,.036),(x,surface+.002,z+.15),m['Paper'],.001,omit=('bottom',),yaw=yaw)
        for offset in (-.008,.008):
            self.rod('Resting chopstick',(x-.105,surface+.008,z+.15+offset),(x+.105,surface+.008,z+.15+offset),.002,m['Honey cedar'])
        self.box('Folded oshibori',(.11,.022,.055),(x-.20,surface+.011,z-.02),m['Cream ceramic'],.012,omit=('bottom',))

    def pendant(self, name, x, z, y=2.28):
        m=self.materials
        self.current_purpose = 'Warm practical light above the guest counter or table, clear of walking headroom.'
        self.lathe(name+' shade',[(.19,0),(.17,.08),(.07,.24),(.065,.25),(.058,.25),(.16,.078),(.182,.005)],(x,y,z),m['Dark fittings'],24)
        self.lathe(name+' diffuser',[(0,0),(.11,0),(.11,.012),(0,.012)],(x,y+.018,z),m['Warm lamp'],20)
        self.rod(name+' cord',(x,y+.25,z),(x,float(self.plan.get('ceilingY',2.92))-.015,z),.006,m['Dark fittings'])
        self.area_light(name+' practical',(x,y+.02,z),(x,.70,z),70,.8,(1,.76,.48))

    def area_light(self, name, at, target, energy, size, colour):
        data=bpy.data.lights.new(name,'AREA')
        data.energy=energy
        data.shape='DISK'
        data.size=size
        data.color=colour
        obj=bpy.data.objects.new(name,data)
        self.scene.collection.objects.link(obj)
        obj.location=loc(at)
        obj.rotation_euler=(Vector(loc(target))-obj.location).to_track_quat('-Z','Y').to_euler()
        return obj


def short_counter(root,out,width,depth=.70):
    """Re-author continuous walnut joinery, without scaling its mouldings or height."""
    spec=importlib.util.spec_from_file_location('minato_walnut',root/'tools/blender/build-minato-walnut.py')
    source=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    asset=source.Asset('Compact counter')
    source.box(asset,'Counter foot plinth',(0,0,.045),(width-.20,depth-.23,.09),'Dark hardware',omit=('top','bottom'))
    source.box(asset,'Counter carcass',(0,0,.385),(width-.14,depth-.22,.59),omit=('top','bottom'))
    panels=max(3,round(width/1.02))
    pitch=(width-.24)/panels
    for i in range(panels):
        x=(i-(panels-1)/2)*pitch
        source.rect_ring(asset,f'Counter raised panel {i+1}',x,-(depth-.22)/2,.381,pitch-.025,.53,.055,-depth/2+.074,-depth/2+.089)
    source.box(asset,'Counter walnut nosing',(0,0,.7025),(width-.02,depth-.015,.045),omit=('top','bottom'))
    source.box(asset,'Counter slate top',(0,0,.7325),(width,depth,.015),'Slate',omit=('bottom',))
    source.rod(asset,'Counter brass footrail',(-width/2+.20,-depth/2+.018,.14),(width/2-.20,-depth/2+.018,.14),.014,segments=10)
    for fraction in (-.38,0,.38):
        x=width*fraction
        source.rod(asset,'Counter rail bracket',(x,-depth/2+.108,.12),(x,-depth/2+.018,.14),.009,segments=8)
    path=out/'minato-compact-counter.glb'
    report=source.glb_write(asset,path)
    return path,report


def prepare_render(room,samples=32,width=1440,height=960):
    scene=room.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=samples
    scene.cycles.use_denoising=True
    scene.cycles.max_bounces=6
    scene.cycles.diffuse_bounces=3
    scene.cycles.glossy_bounces=3
    scene.render.resolution_x=width
    scene.render.resolution_y=height
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
    scene.view_settings.exposure=.5
    world=bpy.data.worlds.new('Minato evening ambience')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.13,.17,.22,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.25
    scene.world=world
    camera_data=bpy.data.cameras.new('Architectural review camera')
    camera=bpy.data.objects.new('Architectural review camera',camera_data)
    scene.collection.objects.link(camera)
    scene.camera=camera
    camera_data.clip_start=.04
    camera_data.clip_end=100
    return camera


def render_views(room,camera,views):
    results=[]
    for view in views:
        at,target=view['at'],view['target']
        camera.location=loc(at)
        camera.rotation_euler=(Vector(loc(target))-camera.location).to_track_quat('-Z','Y').to_euler()
        camera.data.type='ORTHO' if view.get('ortho') else 'PERSP'
        camera.data.lens=view.get('lens',27)
        if view.get('ortho'):
            camera.data.ortho_scale=view['ortho']
        hidden=[]
        if view.get('cutaway'):
            hidden=room.ceilings + room.cutaway_walls
            for obj in hidden:
                obj.hide_render=True
        path=room.out/(view['name']+'.png')
        room.scene.render.filepath=str(path)
        bpy.ops.render.render(write_still=True)
        for obj in hidden:
            obj.hide_render=False
        results.append({'file':path.name,'camera':view,'planRevision':room.plan['revision'],
                        'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                        'renderer':'Blender Cycles; architectural prototype lighting, not the game ink pass'})
        print('Rendered',path.name,flush=True)
    return results


def measure(scene):
    bpy.context.view_layer.update()
    meshes=[o for o in scene.objects if o.type=='MESH' and not o.get('reviewOnly')]
    points=[o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
    bounds={
        'min':[min(v.x for v in points),min(v.z for v in points),min(-v.y for v in points)],
        'max':[max(v.x for v in points),max(v.z for v in points),max(-v.y for v in points)],
    }
    return {'meshes':len(meshes),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes),
            'bounds':bounds,'materials':len({m for o in meshes for m in o.data.materials if m})}


def export_room(room,report):
    # Keep original objects and editable Japanese text in the Blender source.
    bpy.ops.file.pack_all()
    blend_path=room.out/'minato-compact.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path),compress=True)
    report['editable']=measure(room.scene)
    for obj in room.scene.objects:
        if obj.type=='FONT':
            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH')
    batches={}
    for obj in list(room.scene.objects):
        if obj.type!='MESH' or obj.parent or obj.get('reviewOnly'):
            continue
        if len(obj.data.materials)!=1:
            continue
        key=('ceiling' if obj in room.ceilings else 'room',obj.data.materials[0].name)
        batches.setdefault(key,[]).append(obj)
    for (role,material),objects in batches.items():
        provenance=[{'name':o.name,'owner':o.get('owner'),'purpose':o.get('purpose')} for o in objects]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        obj=bpy.context.object
        obj.name='Minato compact / '+role+' / '+material
        obj['sourceObjects']=json.dumps(provenance,ensure_ascii=False)
        obj['role']=role
    bpy.ops.object.select_all(action='DESELECT')
    for obj in room.scene.objects:
        if obj.type in ('MESH','EMPTY') and not obj.get('reviewOnly'):
            obj.select_set(True)
    path=room.root/'assets/models/izakaya/minato-interior-compact.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
                              export_yup=True,export_animations=False,export_cameras=False,
                              export_lights=False,export_extras=True,export_apply=True)
    report['export']=measure(room.scene)
    report['export']['file']=path.name
    report['export']['path']=str(path.relative_to(room.root))
    report['export']['bytes']=path.stat().st_size
    raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
    payload=json.loads(raw[20:20+length])
    report['export']['meshes']=len(payload['meshes'])
    report['export']['primitives']=sum(len(item['primitives']) for item in payload['meshes'])
    report['export']['materials']=len(payload['materials'])
    report['export']['triangles']=sum(payload['accessors'][part['indices']]['count']//3 for item in payload['meshes'] for part in item['primitives'])
    report['export']['sha256']=hashlib.sha256(raw).hexdigest()
    report['blend']=blend_path.name
    report['blendSha256']=hashlib.sha256(blend_path.read_bytes()).hexdigest()
    report['inputs']={}
    for source_path in [room.out/'plan.json',Path(__file__),room.root/'tools/blender/build-minato-walnut.py',
                        room.root/'assets/models/izakaya/minato-walnut-backbar.glb',room.out/'minato-signs.otf']:
        report['inputs'][str(source_path.resolve().relative_to(room.root))]=hashlib.sha256(source_path.read_bytes()).hexdigest()
    (room.out/'compact-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)


def wall(room,name,axis,start,end,fixed,thickness,openings=(),finish='Warm lime plaster',cutaway=False):
    """Partition a wall around real apertures. No opaque planes span an opening."""
    m=room.materials
    cuts=sorted(set([start,end]+[max(start,min(end,v)) for o in openings for v in o[:2]]))
    height=room.plan['ceilingY']
    made=[]
    for a,b in zip(cuts,cuts[1:]):
        if b-a<.001: continue
        forbidden=[o[2:] for o in openings if o[0]<(a+b)/2<o[1]]
        levels=sorted(set([room.floor,1.035,height]+[max(room.floor,min(height,v)) for o in forbidden for v in o]))
        for lo,hi in zip(levels,levels[1:]):
            if hi-lo<.001 or any(o[0]<(lo+hi)/2<o[1] for o in forbidden): continue
            mat=m['Cedar joinery'] if hi<=1.035 else m[finish]
            size=(b-a,hi-lo,thickness) if axis=='X' else (thickness,hi-lo,b-a)
            at=((a+b)/2,(lo+hi)/2,fixed) if axis=='X' else (fixed,(lo+hi)/2,(a+b)/2)
            obj=room.box(name,size,at,mat,omit=('bottom','top'))
            room.structural.append(obj)
            made.append(obj)
    if cutaway: room.cutaway_walls.extend(made)
    return made


def floor_rect(room,name,bounds,wood=False):
    x0,x1,z0,z1=bounds
    m=room.materials
    step=.20 if wood else .36
    length=1.55 if wood else .36
    ix=0;x=x0
    while x<x1-.001:
        xend=min(x+step,x1)
        z=z0-(length*.50 if ix%2 and wood else 0)
        while z<z1-.001:
            a=max(z,z0);b=min(z+length,z1)
            if b>a+.005:
                room.box(name,(xend-x-.004,.027,b-a-.004),((x+xend)/2,room.floor-.0135,(a+b)/2),m['Cedar floor' if wood else 'Quarry tile'],omit=('bottom',))
            z+=length
        x=xend;ix+=1


def shell(room):
    p=room.plan;m=room.materials
    j=p['joinery'];dj,dh,wf=j['doorJamb'],j['doorHead'],j['windowFrame'];sj,sh=j['serviceJamb'],j['serviceHead']
    main,annex=p['main'],p['ramen'];f=room.floor;h=p['ceilingY'];t=p['wallThickness']
    room.current_purpose='The compact building envelope; doors and window are actual openings and every walking area has continuous ground.'
    poly=p['floorPolygon']
    # A single foundation under the whole L, followed by mutually exclusive finishes.
    room.mesh('Continuous L-shaped floor foundation',[(x,.01,z) for x,z in poly],[tuple(reversed(range(len(poly))))],m['Dark grout'])
    floor_rect(room,'Main cedar floor',(main['minX'],main['maxX'],-1.8,p['wc']['minZ']),True)
    floor_rect(room,'Entry cedar floor',(main['minX'],p['wc']['minX'],p['wc']['minZ'],main['maxZ']),True)
    floor_rect(room,'Guest WC quarry tiles',(p['wc']['minX'],main['maxX'],p['wc']['minZ'],main['maxZ']))
    floor_rect(room,'Main kitchen quarry tiles',(main['minX'],main['maxX'],main['minZ'],-1.8))
    floor_rect(room,'Sato quarry tiles',(main['maxX'],annex['maxX'],annex['minZ'],annex['maxZ']))
    e=p['entrance'];re=p['ramenEntrance'];w=p['window']
    # Rough openings include the joinery. The clear door/window sizes stay as
    # measured; wall reveals must not occupy the jambs' visible end faces.
    front_openings=[(d['position'][0]-d['width']/2-dj,d['position'][0]+d['width']/2+dj,f,d['height']+dh) for d in (e,re)]
    front_openings.append((w['position'][0]-w['width']/2-wf,w['position'][0]+w['width']/2+wf,
                           w['position'][1]-w['height']/2-wf,w['position'][1]+w['height']/2+wf))
    wall(room,'Street facade','X',main['minX']-t,annex['maxX']+t,main['maxZ']+t/2,t,front_openings,cutaway=True)
    wall(room,'Minato west wall','Z',main['minZ'],main['maxZ'],main['minX']-t/2,t)
    wall(room,'Minato rear wall','X',main['minX']-t,main['maxX']+t,main['minZ']-t/2,t)
    wall(room,'Minato kitchen east wall','Z',main['minZ'],annex['minZ'],main['maxX']+t/2,t)
    wall(room,'Sato rear wall','X',main['maxX']+t,annex['maxX']+t,annex['minZ']-t/2,t,finish='Sato sage plaster')
    wall(room,'Sato east wall','Z',annex['minZ'],annex['maxZ'],annex['maxX']+t/2,t,finish='Sato sage plaster',cutaway=True)
    c=p['connection']
    wall(room,'Shared service wall','Z',annex['minZ'],annex['maxZ'],c['x'],annex['minX']-main['maxX'],[(c['minZ']-sj,c['maxZ']+sj,f,c['height']+sh)])
    # Architraves are outside the clear apertures, leaving their specified width intact.
    for title,door in [('Minato entrance',e),('Sato entrance',re)]:
        x=door['position'][0];z=door['position'][2]-.028;ww=door['width'];hh=door['height']
        for side in (-1,1):room.box(title+' jamb',(dj,hh-f,.095),(x+side*(ww/2+dj/2),(hh+f)/2,z),m['Honey cedar'],.004)
        room.box(title+' lintel',(ww+2*dj,dh,.10),(x,hh+dh/2,z),m['Honey cedar'],.004)
        # Entry leaves retract into their wall pockets. No visible plane occupies
        # either entry or the neighbouring street-window aperture.
    x,y,z=w['position'];ww=w['width'];hh=w['height']
    for side in (-1,1):
        # Butt the jambs into the head and sill; no crossed timber boxes.
        room.box('Window side jamb',(wf,hh,.15),(x+side*(ww/2+wf/2),y,z+.04),m['Honey cedar'],.003)
        room.box('Window head or sill',(ww+2*wf,wf,.15),(x,y+side*(hh/2+wf/2),z+.04),m['Honey cedar'],.003)
    room.box('Window central mullion',(.035,hh,.10),(x,y,z+.06),m['Honey cedar'],.002)
    # Head beams stop at wall faces. Ceiling panels are a separate export role.
    for zz in (-2.85,-.15,2.65):
        obj=room.box('Main exposed ceiling beam',(main['maxX']-main['minX'],.13,.12),((main['minX']+main['maxX'])/2,h-.065,zz),m['Cedar joinery'])
        room.ceilings.append(obj)
    for bounds in [main,{'minX':main['maxX'],'maxX':annex['maxX'],'minZ':annex['minZ'],'maxZ':annex['maxZ']}]:
        obj=room.box('Fitted plaster ceiling',(bounds['maxX']-bounds['minX'],.07,bounds['maxZ']-bounds['minZ']),((bounds['minX']+bounds['maxX'])/2,h+.035,(bounds['minZ']+bounds['maxZ'])/2),m['Warm lime plaster'])
        obj['role']='ceiling';room.ceilings.append(obj)
    # Framed open service connection, with kitchen signage facing both businesses.
    for zz in (c['minZ']-sj/2,c['maxZ']+sj/2):
        room.box('Shared kitchen passage jamb',(.32,c['height']-f,sj),(c['x'],(c['height']+f)/2,zz),m['Honey cedar'],.002)
    room.box('Shared kitchen passage lintel',(.32,sh,c['maxZ']-c['minZ']+2*sj),(c['x'],c['height']+sh/2,(c['minZ']+c['maxZ'])/2),m['Honey cedar'],.002)


def steel_unit(room,name,x,z,width,depth,top,front=1,doors=True):
    """Supported cabinet with a continuous thin worktop and front hardware."""
    m=room.materials
    room.box(name+' plinth',(width-.09,.08,depth-.10),(x,.08,z),m['Dark fittings'],.005,omit=('bottom',))
    room.box(name+' carcass',(width-.04,top-.155,depth-.045),(x,(top+.085)/2,z),m['Brushed kitchen steel'],.008,omit=('top','bottom','front' if front>0 else 'back'))
    room.box(name+' worktop',(width,.035,depth),(x,top-.0175,z),m['Brushed kitchen steel'],.008,omit=('bottom',))
    if doors:
        count=max(1,round(width/.52));pitch=(width-.05)/count
        for i in range(count):
            xx=x+(i-(count-1)/2)*pitch;zz=z+front*(depth/2-.008)
            room.box(name+' recessed door',(pitch-.014,top-.22,.025),(xx,(top+.12)/2,zz),m['Brushed kitchen steel'],.006,omit=('back' if front>0 else 'front',))
            room.rod(name+' pull',(xx-.07,top-.14,zz+front*.035),(xx+.07,top-.14,zz+front*.035),.008,m['Dark fittings'])


def sink_basin(room,name,x,z,top,width=.35,depth=.42):
    """A shallow formed basin, constructed as sloping walls around a real recess."""
    m=room.materials
    # The unit top is intentionally cut below this basin later by its footprint.
    outer=[(x-width/2,top,z-depth/2),(x+width/2,top,z-depth/2),(x+width/2,top,z+depth/2),(x-width/2,top,z+depth/2)]
    inner=[(x-width*.32,top-.13,z-depth*.30),(x+width*.32,top-.13,z-depth*.30),(x+width*.32,top-.13,z+depth*.30),(x-width*.32,top-.13,z+depth*.30)]
    room.mesh(name,outer+inner,[(i,(i+1)%4,4+(i+1)%4,4+i) for i in range(4)]+[(4,7,6,5)],m['Brushed kitchen steel'])
    for i in range(4):room.rod(name+' rolled rim',outer[i],outer[(i+1)%4],.008,m['Brushed kitchen steel'])
    room.lathe(name+' drain',[(0,0),(.025,0),(.025,.003),(0,.003)],(x,top-.129,z),m['Dark fittings'],12)
    # A three-part bent spout is clear of the basin opening.
    room.rod(name+' tap riser',(x,top,z-depth/2-.035),(x,top+.22,z-depth/2-.035),.012,m['Brushed kitchen steel'])
    room.rod(name+' tap bridge',(x,top+.22,z-depth/2-.035),(x,top+.22,z-.04),.012,m['Brushed kitchen steel'])
    room.rod(name+' tap outlet',(x,top+.22,z-.04),(x,top+.18,z-.04),.012,m['Brushed kitchen steel'])


def cut_worktop_hole(room,obj,x,z,width,depth):
    """Boolean only the thin top, keeping sink openings honest and self-contained."""
    cutter=room.box('Temporary basin cutter',(width,.20,depth),(x,obj.location.z,z),room.materials['Dark fittings'])
    mod=obj.modifiers.new('Actual basin opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    room.objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)


def kitchen(room):
    p=room.plan;m=room.materials
    room.current_purpose='Shared evening and lunch kitchen; real supported worktops, cold storage, washing and compact hot appliances.'
    w=p['worktop'];x,_,z=w['position'];top=w['top']
    steel_unit(room,'Minato service workbench',x,z,w['width'],w['depth'],top,front=-1)
    # Oden bath, supported on the workbench and divided into six visible compartments.
    ox=p['kitchenStations']['oden'][0]
    room.box('Oden warmer',(.58,.13,.38),(ox,top+.065,z),m['Brushed kitchen steel'],.014)
    for xx in (-.19,0,.19):
        for zz in (-.087,.087):
            room.box('Oden broth',(.174,.008,.156),(ox+xx,top+.134,z+zz),m['Tea'],.005,omit=('bottom',))
            room.lathe('Oden daikon',[(.037,0),(.038,.027),(0,.027)],(ox+xx,top+.139,z+zz),m['Food cream'],12)
    for xx in (-.097,.097):room.box('Oden divider',(.008,.025,.36),(ox+xx,top+.142,z),m['Brushed kitchen steel'])
    room.box('Oden centre divider',(.56,.025,.008),(ox,top+.142,z),m['Brushed kitchen steel'])
    # Prep has its own clear surface; knives lie safely on the board.
    px=p['kitchenStations']['prep'][0]
    room.box('Cedar cutting board',(.62,.025,.35),(px,top+.0125,z),m['Honey cedar'],.012,omit=('bottom',))
    room.box('Prep knife blade',(.15,.004,.036),(px+.10,top+.028,z+.05),m['Brushed kitchen steel'],.001,omit=('bottom',))
    room.box('Prep knife handle',(.10,.018,.028),(px-.025,top+.034,z+.05),m['Dark fittings'],.006)
    # Tonight's otoshi, the small dish that goes out with a guest's first drink: two
    # bowls of mozuku already dressed, side by side with a centimetre between their rims
    # (0.07 m rims 0.15 m apart), clear of the knife.
    for xx in (-.225,-.075):
        room.lathe('Otoshi bowl',[(.045,0),(.07,.055),(.066,.06),(.04,.012),(0,.012)],(px+xx,top+.026,z-.065),m['Cream ceramic'],16)
        room.lathe('Otoshi mozuku',[(.038,.0125),(.028,.026),(0,.03)],(px+xx,top+.026,z-.065),m['Food green'],16)
    # A compact charcoal grill uses a real grate above its body, not a flat decal.
    gx=p['kitchenStations']['grill'][0]
    room.box('Yakitori grill body',(.60,.16,.37),(gx,top+.08,z),m['Dark fittings'],.012)
    for i in range(12):room.rod('Yakitori grate',(gx-.27+i*.049,top+.173,z-.16),(gx-.27+i*.049,top+.173,z+.16),.005,m['Brushed kitchen steel'],8)
    for i in range(3):
        xx=gx-.14+i*.14
        room.rod('Yakitori skewer',(xx,top+.187,z-.18),(xx,top+.187,z+.20),.0025,m['Honey cedar'],8)
        for zz in (-.09,0,.09):room.box('Yakitori on the grill',(.065,.035,.067),(xx,top+.20,z+zz),m['Food cream'],.012)
    room.box('Yakitori extraction canopy',(.83,.23,.57),(gx,2.24,z),m['Brushed kitchen steel'],.025)
    room.box('Yakitori canopy underside',(.73,.008,.46),(gx,2.121,z),m['Dark fittings'],omit=('top',))
    room.box('Yakitori extraction duct',(.22,p['ceilingY']-2.355,.24),(gx,(p['ceilingY']+2.355)/2,z),m['Brushed kitchen steel'],.012,omit=('top','bottom'))
    for dx in (-.31,.31):room.rod('Hood hanging rod',(gx+dx,2.35,z),(gx+dx,p['ceilingY'],z),.008,m['Dark fittings'])
    # Full-height cold store, door clearances remain outside the work aisle.
    s=p['storage'];sx,_,sz=s['position'];sw=s['width'];sh=s['height'];sd=s['depth']
    room.box('Shared cold store plinth',(sw-.06,.08,sd-.08),(sx,.08,sz),m['Dark fittings'],.008,omit=('bottom',))
    room.box('Shared cold store cabinet',(sw,sh-.12,sd),(sx,(sh+.12)/2,sz),m['Brushed kitchen steel'],.018,omit=('front',))
    for lo,hi in ((.13,.80),(.82,sh-.018)):
        room.box('Cold store insulated door',(sw-.03,hi-lo,.035),(sx,(lo+hi)/2,sz+sd/2+.008),m['Enamel cream'],.012,omit=('back',))
        room.rod('Cold store vertical pull',(sx+sw*.31,lo+.12,sz+sd/2+.045),(sx+sw*.31,hi-.12,sz+sd/2+.045),.013,m['Dark fittings'])
    room.text('Cold store stock label','冷蔵', (sx,1.77,sz+sd/2+.033),.10,m['Ink'])
    # Rear combined stainless unit: left basin, small range, fryer at right.
    s=p['sink'];sx,_,sz=s['position'];st=s['top']
    steel_unit(room,'Rear washing and cooking unit',sx,sz,s['width'],s['depth'],st)
    worktop=bpy.data.objects.get('Rear washing and cooking unit worktop')
    bx=s.get('basinX',sx-.37)
    cut_worktop_hole(room,worktop,bx,sz,.345,.415)
    sink_basin(room,'Shared wash basin',bx,sz,st+.003,.35,.42)
    # A smooth tiled splashback rather than numerous thin coplanar decorative planes.
    room.box('Rear kitchen tile splashback',(s['width'],.64,.025),(sx,st+.32,p['main']['minZ']+.016),m['Celadon tile'],.004,omit=('back',))
    rx=s.get('rangeX',sx+.03)
    room.box('Single burner gas range',(.35,.10,.40),(rx,st+.05,sz),m['Brushed kitchen steel'],.012)
    room.lathe('Gas burner ring',[(.09,0),(.105,.008),(.105,.02),(.075,.02),(.075,.008)],(rx,st+.102,sz),m['Dark fittings'],20)
    for a in range(4):
        dx,dz=math.cos(a*math.pi/2),math.sin(a*math.pi/2)
        room.rod('Range pan support',(rx+dx*.05,st+.132,sz+dz*.05),(rx+dx*.14,st+.132,sz+dz*.14),.007,m['Dark fittings'],8)
    room.lathe('Range simmer pan',[(.085,0),(.105,.07),(.098,.075),(.078,.015),(0,.015)],(rx,st+.139,sz),m['Brushed kitchen steel'],20)
    fx=s.get('fryerX',sx+.45)
    room.box('Compact fryer',(.25,.18,.42),(fx,st+.09,sz),m['Brushed kitchen steel'],.012)
    room.box('Fryer oil well',(.205,.008,.28),(fx,st+.184,sz+.025),m['Tea'],.006,omit=('bottom',))
    for i in range(7):room.rod('Fryer basket wire',(fx-.085+i*.028,st+.195,sz-.09),(fx-.085+i*.028,st+.195,sz+.14),.0018,m['Brushed kitchen steel'],6)
    room.rod('Fryer insulated basket handle',(fx,st+.22,sz+.15),(fx,st+.25,sz+.28),.009,m['Dark fittings'])
    room.box('Wash and hot zone splash divider',(.018,.28,.48),(1.18,st+.14,sz),m['Brushed kitchen steel'],.003)
    room.box('Rear hot zone canopy',(.78,.19,.61),((rx+fx)/2,2.15,sz),m['Brushed kitchen steel'],.02)
    room.box('Rear hot zone duct',(.24,.695,.24),((rx+fx)/2,2.5925,sz-.10),m['Brushed kitchen steel'],.01,omit=('top','bottom'))


def sato(room):
    p=room.plan;m=room.materials
    room.current_owner='Mrs Sato'
    room.current_purpose='Mrs Sato’s lunch counter, with three counter seats and two ledge places; stock and appliances are supported by fitted joinery.'
    c=p['ramenCounter'];x,_,z=c['position'];ww=c['width'];d=c['depth'];top=c['top']
    room.box('Sato counter plinth',(ww-.08,.08,d-.13),(x,.08,z),m['Dark fittings'],.006,omit=('bottom',))
    room.box('Sato counter cabinetry',(ww-.04,.61,d-.04),(x,.425,z),m['Sato sage plaster'],.008,omit=('top','bottom'))
    room.box('Sato cream counter edge',(ww,.045,d),(x,top-.0225,z),m['Enamel cream'],.008)
    for i in range(3):room.box('Sato counter reed panel',(.65,.46,.02),(x+(i-1)*.77,.43,z+d/2+.001),m['Honey cedar'],.005)
    for i,xx in enumerate(p['ramenStools']):
        room.stool(f'Sato counter stool {i+1}',xx,p['ramenSeatZ'],True)
        room.place_setting(xx,z+.11,top)
    ledge=p['ramenLedge'];lx,_,lz=ledge['position']
    room.box('Sato side ledge',(ledge['width'],.05,ledge['depth']),(lx,ledge['top']-.025,lz),m['Enamel cream'],.008)
    for zz in (lz-.5,lz+.5):
        room.rod('Sato ledge steel bracket',(lx-.17,ledge['top']-.06,zz),(p['ramen']['maxX']-.015,.48,zz),.014,m['Brushed kitchen steel'])
    for i,zz in enumerate(ledge['seatZ']):room.stool(f'Sato ledge stool {i+1}',ledge['seatX'],zz,True)
    prep=p['ramenPrep'];px,_,pz=prep['position'];pt=prep['top']
    steel_unit(room,'Sato rear preparation bench',px,pz,prep['width'],prep['depth'],pt)
    room.box('Sato kitchen splashback',(prep['width'],.71,.026),(px,pt+.355,p['ramen']['minZ']+.018),m['Celadon tile'],.003,omit=('back',))
    room.box('Sato preparation board',(.53,.025,.38),(3.10,pt+.0125,pz),m['Honey cedar'],.008,omit=('bottom',))
    # Noodle boiler with baskets held by their handles; stock pots beside it.
    room.box('Sato noodle boiler',(.50,.22,.44),(3.65,pt+.11,pz),m['Brushed kitchen steel'],.018)
    room.box('Noodle boiler open bath',(.43,.008,.36),(3.65,pt+.224,pz),m['Tea'],.006,omit=('bottom',))
    for xx in (3.54,3.76):
        room.lathe('Noodle basket rim',[(.075,0),(.079,.01),(.072,.016),(.069,.003)],(xx,pt+.232,pz),m['Brushed kitchen steel'],16)
        room.rod('Noodle basket handle',(xx,pt+.25,pz+.08),(xx,pt+.39,pz+.18),.006,m['Dark fittings'])
    for xx in (4.25,4.65):
        room.lathe('Sato soup stock pot',[(.13,0),(.15,.025),(.15,.29),(.14,.30),(.135,.28),(.125,.025),(0,.025)],(xx,pt,pz),m['Brushed kitchen steel'],24)
        room.lathe('Stock pot lid',[(0,0),(.148,0),(.14,.018),(0,.025)],(xx,pt+.30,pz),m['Brushed kitchen steel'],24)
        room.lathe('Stock pot lid knob',[(.022,0),(.026,.035),(0,.035)],(xx,pt+.325,pz),m['Dark fittings'],16)
        for side in (-1,1):room.rod('Stock pot side handle',(xx+side*.145,pt+.21,pz-.035),(xx+side*.20,pt+.21,pz+.035),.009,m['Dark fittings'])
    for xx in (5.02,5.24):
        # An open steel pan, with the food below its rim. A closed solid pan
        # previously ran through the toppings and flashed at the bevels.
        room.box('Sato topping pan bottom',(.18,.012,.32),(xx,pt+.006,pz),m['Brushed kitchen steel'],.003)
        for dx in (-.084,.084):
            room.box('Sato topping pan side',(.012,.058,.32),(xx+dx,pt+.041,pz),m['Brushed kitchen steel'],.003)
        for dz in (-.154,.154):
            room.box('Sato topping pan end',(.156,.058,.012),(xx,pt+.041,pz+dz),m['Brushed kitchen steel'],.003)
        room.box('Sato toppings',(.15,.046,.27),(xx,pt+.035,pz),m['Food green' if xx<5.1 else 'Food cream'],.005,omit=('bottom',))
    room.box('Sato hot water urn',(.29,.42,.28),(5.60,pt+.21,pz),m['Enamel cream'],.035)
    room.rod('Sato urn spout',(5.60,pt+.15,pz+.145),(5.60,pt+.15,pz+.22),.018,m['Dark fittings'])
    # High rack and real brackets above the prep run, with stacked service bowls.
    room.box('Sato bowl shelf',(1.25,.035,.28),(3.25,1.78,pz+.06),m['Brushed kitchen steel'],.004)
    for xx in (2.72,3.78):room.rod('Sato shelf bracket',(xx,1.76,pz+.18),(xx,1.49,p['ramen']['minZ']+.045),.012,m['Brushed kitchen steel'])
    for xx in (2.85,3.18,3.51):
        for j in range(3):room.lathe('Sato stacked soup bowls',[(.065,0),(.13,.10),(.125,.107),(.056,.014),(0,.014)],(xx,1.80+j*.039,pz+.06),m['Cream ceramic'],20)
    room.box('Sato soup extraction hood',(1.20,.20,.59),(4.44,2.18,pz),m['Brushed kitchen steel'],.018)
    room.box('Sato soup hood duct',(.30,.66,.27),(4.44,2.61,pz-.04),m['Brushed kitchen steel'],.01,omit=('top','bottom'))
    # Handwritten-style wooden shop name, anchored to the wall above the service hatch.
    room.box('Sato shop sign board',(1.45,.29,.035),(4.22,2.64,p['ramen']['minZ']+.025),m['Honey cedar'],.008,omit=('back',))
    room.text('Sato sign','佐藤らーめん',(4.22,2.64,p['ramen']['minZ']+.048),.19,m['Ink'])
    room.current_owner='Thao'


def toilet(room):
    p=room.plan;wc=p['wc'];m=room.materials;f=room.floor;t=p['wallThickness']
    jamb=p['joinery']['wcJamb']
    room.current_purpose='Guest toilet serving both businesses; accessible from the dining side, with a real basin, pan, mirror and folding doorway.'
    wall(room,'WC north partition','X',wc['minX']-t/2,wc['maxX'],wc['minZ'],t)
    wall(room,'WC west partition','Z',wc['minZ']+t/2,wc['maxZ'],wc['minX'],t,[(wc['doorZ']-wc['doorWidth']/2-jamb,wc['doorZ']+wc['doorWidth']/2+jamb,f,2.10)])
    # Two 0.43 m leaves fold into 0.43 m of the available 0.77 m side wall.
    # This is a full-width operable leaf arrangement, not an undersized slider.
    for zz in (wc['doorZ']-wc['doorWidth']/2-jamb/2,wc['doorZ']+wc['doorWidth']/2+jamb/2):
        room.box('WC door jamb',(.18,2.10-f,jamb),(wc['doorX'],(2.10+f)/2,zz),m['Honey cedar'],.004)
    room.box('WC folding door guide',(.055,.045,1.305),(wc['doorX']-.105,2.145,2.4725),m['Dark fittings'],.003)
    for dx in (-.105,-.155):
        room.box('WC parked folding leaf',(.025,2.035,.43),(wc['doorX']+dx,1.0675,2.91),m['Honey cedar'],.004)
    for yy in (.28,1.00,1.80):room.rod('WC folding door hinge',(wc['doorX']-.13,yy,3.125),(wc['doorX']-.13,yy+.07,3.125),.009,m['Aged brass'])
    room.rod('WC recessed door handle',(wc['doorX']-.173,.93,2.75),(wc['doorX']-.173,1.12,2.75),.007,m['Dark fittings'])
    room.box('WC door sign support',(.04,.22,.56),(wc['doorX']-.10,2.37,wc['doorZ']),m['Paper'],.004)
    # The sign is on the dining side (-X) of its support, so it faces -X: yaw +pi/2 turned it into the board.
    room.text('Guest washroom sign','手洗い',(wc['doorX']-.128,2.37,wc['doorZ']),.14,m['Ink'],yaw=-math.pi/2)
    tx,ty,tz=wc['toilet']
    room.lathe('WC porcelain pedestal',[(.12,0),(.14,.05),(.105,.23),(.16,.33)],(tx,ty,tz),m['Cream ceramic'],24,1.2)
    room.lathe('WC porcelain bowl',[(.14,0),(.20,.11),(.205,.16),(.18,.19),(.155,.17),(.09,.055),(0,.045)],(tx,ty+.24,tz-.10),m['Cream ceramic'],28,1.42)
    room.lathe('WC seat ring',[(.176,0),(.204,.012),(.200,.032),(.161,.032),(.154,.016),(.176,0)],(tx,ty+.43,tz-.10),m['Enamel cream'],28,1.4)
    room.box('WC cistern',(.40,.45,.18),(tx,ty+.57,tz+.19),m['Cream ceramic'],.05)
    room.box('WC cistern lid',(.42,.035,.20),(tx,ty+.8075,tz+.19),m['Cream ceramic'],.015)
    room.rod('WC flush lever',(tx-.12,ty+.69,tz+.29),(tx-.05,ty+.69,tz+.29),.012,m['Brushed kitchen steel'])
    sx,sy,sz=wc['sink']
    room.lathe('WC basin pedestal',[(.11,0),(.09,.06),(.065,.53),(.13,.69)],(sx,f,sz),m['Cream ceramic'],20)
    # One continuous open basin shell; the rim is its highest surface.
    room.lathe('WC porcelain washbasin',[(.13,-.11),(.205,-.035),(.218,0),(.195,.012),(.14,-.085),(0,-.09)],(sx,sy,sz),m['Cream ceramic'],28,.84)
    room.rod('WC tap riser',(sx,sy-.01,sz-.14),(sx,sy+.14,sz-.14),.012,m['Brushed kitchen steel'])
    room.rod('WC tap spout',(sx,sy+.14,sz-.14),(sx,sy+.14,sz-.035),.012,m['Brushed kitchen steel'])
    room.box('WC mirror backing',(.49,.64,.027),(sx,1.42,wc['minZ']+.087),m['Honey cedar'],.012)
    room.box('WC silver mirror',(.445,.59,.006),(sx,1.42,wc['minZ']+.104),m['Brushed kitchen steel'],.008,omit=('back',))
    room.rod('WC hand towel rail',(1.05,1.10,wc['minZ']+.11),(1.40,1.10,wc['minZ']+.11),.012,m['Brushed kitchen steel'])
    room.box('WC folded hand towel',(.23,.30,.012),(1.22,.96,wc['minZ']+.125),m['Cream ceramic'],.004)
    room.box('WC paper holder backing',(.025,.12,.15),(wc['minX']+.09,.78,2.99),m['Honey cedar'],.004)
    # A roll on its spindle, kept entirely inside the cubicle.
    room.rod('WC paper roll',(wc['minX']+.13,.79,2.94),(wc['minX']+.13,.79,3.045),.047,m['Paper'],16)
    room.area_light('WC overhead',((wc['minX']+wc['maxX'])/2,2.83,2.50),(1.50,.30,2.50),48,.65,(1,.88,.68))


def ticket_machine(room):
    p=room.plan;m=room.materials;tx,_,tz=p['details']['ticketMachine']
    room.current_owner='Mrs Sato'
    room.current_purpose='Period meal-ticket machine at Sato’s entry, with an open approach from the right and a supported coin return.'
    room.box('Sato ticket machine base',(.42,.12,.36),(tx,.10,tz),m['Dark fittings'],.012,omit=('bottom',))
    room.box('Sato ticket machine pedestal',(.34,.65,.29),(tx,.485,tz),m['Enamel cream'],.012)
    room.box('Sato ticket machine body',(.45,.66,.34),(tx,1.14,tz),m['Enamel cream'],.025)
    room.box('Ticket machine inset control panel',(.386,.43,.012),(tx,1.20,tz+.176),m['Dark fittings'],.008,omit=('back',))
    for row in range(3):
        for col in range(3):
            xx=tx+(col-1)*.115;yy=1.32-row*.105
            room.box('Ticket selection button',(.093,.067,.012),(xx,yy,tz+.19),m['Paper'],.005,omit=('back',))
            room.text('Ticket selection price',str(400+row*100),(xx,yy,tz+.198),.031,m['Ink'])
    room.box('Ticket machine coin slot',(.045,.008,.015),(tx+.12,1.43,tz+.18),m['Dark fittings'])
    room.box('Ticket delivery recess',(.24,.085,.025),(tx,.895,tz+.177),m['Dark fittings'],.008,omit=('back',))
    room.box('Ticket delivery lip',(.26,.018,.065),(tx,.855,tz+.195),m['Brushed kitchen steel'],.004)
    room.text('Ticket machine header','食券',(tx,1.445,tz+.177),.07,m['Ink'])
    room.current_owner='Thao'


def furnish(room):
    p=room.plan;m=room.materials
    b=p['backbar'];room.import_asset(room.root/'assets/models/izakaya/minato-walnut-backbar.glb','Minato walnut back bar',b['position'])
    c=p['counter']
    with tempfile.TemporaryDirectory(prefix='minato-compact-counter-') as tmp:
        counter_path,counter_report=short_counter(room.root,Path(tmp),c['width'],c['depth'])
        room.import_asset(counter_path,'Minato walnut counter',c['position'])
    for i,x in enumerate(p['counterStools']):
        room.stool(f'Minato counter stool {i+1}',x,p['counterSeatZ'])
        room.place_setting(x,c['position'][2]+.17,c['top'])
    b=p['booth'];room.booth(b['position'][0],b['position'][2],b['tableWidth'],b['tableDepth'],(b['benchZ'][1]-b['benchZ'][0])/2)
    # Two deliberately laid places leave a clear guestbook position for the runtime dressing.
    room.place_setting(-2.15,2.22,b['tableTop']);room.place_setting(-2.15,2.58,b['tableTop'])
    for i,(x,y,z) in enumerate(p['details']['lanterns']):room.pendant(f'Minato counter pendant {i+1}',x,z,y)
    room.pendant('Minato booth pendant',b['position'][0],b['position'][2],2.24)
    kitchen(room);sato(room);toilet(room);ticket_machine(room)
    room.pendant('Sato counter pendant',4.35,.35,2.25)
    room.area_light('Minato soft ceiling',(-1.3,2.82,.65),(-1.3,.65,-.6),115,3.2,(1,.84,.64))
    room.area_light('Minato backbar practical',(-2.10,2.77,-2.93),(-2.10,1.2,-3.4),45,2.5,(1,.72,.45))
    room.area_light('Sato working ceiling',(4.05,2.82,.1),(4.05,.8,-.9),85,2.4,(1,.89,.71))
    room.area_light('Street window fill',(-2.4,1.65,3.8),(-2.3,1.1,.5),100,2.6,(.66,.78,1))
    room.area_light('Entry warm spill',(0,1.7,3.8),(-.3,.9,1.2),45,1.4,(1,.72,.44))
    return counter_report


def seated_scale_reference(room):
    """Neutral adult mannequin for review cameras; excluded from game export."""
    before=set(room.scene.objects)
    mat=room.material('Review scale reference','#9b9d94',.9)
    x=room.plan['counterStools'][2];z=room.plan['counterSeatZ']
    room.current_owner='Architectural review'
    room.current_purpose='Neutral adult scale reference; review only and excluded from runtime GLB.'
    room.lathe('Review adult seated torso',[(.13,.48),(.15,.64),(.17,.93),(.19,1.08),(.08,1.13)],(x,0,z),mat,16,.66)
    room.lathe('Review adult head',[(0,-.13),(.075,-.10),(.095,0),(.083,.10),(0,.13)],(x,1.29,z-.015),mat,20,.87)
    room.rod('Review adult neck',(x,1.08,z),(x,1.19,z),.046,mat)
    for side in (-1,1):
        xx=x+side*.10
        room.rod('Review adult thigh',(xx,.52,z),(xx,.48,z-.32),.075,mat)
        room.rod('Review adult shin',(xx,.48,z-.32),(xx,.12,z-.28),.052,mat)
        room.box('Review adult shoe',(.12,.09,.24),(xx,.085,z-.34),mat,.035)
        room.rod('Review adult upper arm',(x+side*.18,1.05,z),(x+side*.22,.82,z-.13),.052,mat)
        room.rod('Review adult forearm',(x+side*.22,.82,z-.13),(x+side*.17,.81,z-.38),.041,mat)
    for obj in set(room.scene.objects)-before:obj['reviewOnly']=True
    room.current_owner='Thao'


def review_runtime_poster(room):
    """Show the application's Artlist print in Blender reviews, once only.

    The running game hangs this in izakaya-posters.js, so it must not enter
    the GLB as a second poster laid on the same wall.
    """
    x,y,z=5.845,1.85,1.06;w,h=1.08,1.44
    mat=room.material('Review Sango Quay print','#ffffff',.9,texture=room.root/'assets/graphics/izakaya/sango-quay-artlist.webp')
    obj=room.mesh('Runtime Sango Quay print - review only',[(x,y-h/2,z-w/2),(x,y-h/2,z+w/2),(x,y+h/2,z+w/2),(x,y+h/2,z-w/2)],[(0,1,2,3)],mat)
    uv=obj.data.uv_layers.new(name='UVMap')
    for i,co in enumerate(((0,0),(1,0),(1,1),(0,1))):uv.data[i].uv=co
    obj['reviewOnly']=True


def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--plan',type=Path)
    parser.add_argument('--samples',type=int,default=32)
    parser.add_argument('--width',type=int,default=1440)
    parser.add_argument('--height',type=int,default=960)
    parser.add_argument('--no-render',action='store_true')
    opt=parser.parse_args(args)
    root=opt.root.resolve();out=root/'art/izakaya/compact';out.mkdir(parents=True,exist_ok=True)
    plan_path=opt.plan or out/'plan.json';plan=json.loads(plan_path.read_text())
    previous_report=json.loads((out/'compact-report.json').read_text()) if (out/'compact-report.json').exists() else {}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version=0
    room=CompactRoom(root,plan,out);room.palette();shell(room);counter=furnish(room);review_runtime_poster(room);seated_scale_reference(room)
    camera=prepare_render(room,opt.samples,opt.width,opt.height)
    views=[{'name':'entry','at':[.08,1.59,3.10],'target':[-1.67,1.23,-1.40],'lens':24},
           {'name':'counter','at':[-3.66,1.55,1.06],'target':[-1.38,1.27,-2.76],'lens':27},
           {'name':'overhead','at':[8.5,12.0,10.5],'target':[.60,1.05,-.10],'ortho':16.0,'cutaway':True}]
    report={'title':plan['title'],'planRevision':plan['revision'],'dimensions':plan,'units':plan['units'],
            'notes':['Architectural prototype. Blender render lighting is independent of runtime lighting.',
                     'Existing 42-bottle walnut cabinet imported at scale 1.0; counter re-authored at the planned length and depth.',
                     'Runtime radio, phone, guestbook, karaoke, TV, period posters, calendar, curtains, bottle-keep shelf and tanuki are intentionally supplied by the application.',
                     'Two 0.43 m WC door leaves fold beside its 0.86 m clear opening; door and street window apertures are physically open.'],
            'counter':counter,'renders':[]}
    if not opt.no_render:
        report['renders']=render_views(room,camera,views)
    else:
        report['renders']=previous_report.get('renders',[])
        for render in report['renders']:
            render.setdefault('planRevision',previous_report.get('renderPlanRevision',previous_report.get('planRevision')))
            rendered_file=out/render['file']
            if rendered_file.exists():render['sha256']=hashlib.sha256(rendered_file.read_bytes()).hexdigest()
    report['renderPlanRevisions']=sorted(set(render['planRevision'] for render in report['renders']))
    camera.location=loc(views[0]['at'])
    camera.rotation_euler=(Vector(loc(views[0]['target']))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='PERSP';camera.data.lens=views[0]['lens']
    room.scene.render.filepath=str(out/'entry.png')
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.region_3d.view_perspective='CAMERA'
                area.spaces.active.region_3d.view_camera_zoom=0
    export_room(room,report)


if __name__=='__main__':
    main()
