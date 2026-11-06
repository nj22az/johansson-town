"""Replace Minato's primitive props in-place, before its seven finish batches merge.

All coordinates use the game's x/y/z frame. Furniture keeps the original tops and
collision envelopes; detail is structure on an existing item, never aisle clutter.
"""
import math
import re


def create_prop_api(source):
    api = {k: source[k] for k in ('bpy', 'M', 'mat', 'cube', 'cyl', 'cone', 'ball', 'ring', 'loc')}
    bpy, loc = api['bpy'], api['loc']
    # Tiny props are seen at human camera distances: twelve radial segments with
    # smooth normals preserve their shape without spending geometry on microns.
    original_cyl,original_ball=api['cyl'],api['ball']
    def efficient_cyl(name,r,h,at,m,verts=12,axis='y',rot=0.):
        return original_cyl(name,r,h,at,m,min(verts,12),axis,rot)
    def efficient_ball(name,scale,at,m,seg=10,rings=6):
        return original_ball(name,scale,at,m,min(seg,12) if max(scale)<.10 else seg,min(rings,6) if max(scale)<.10 else rings)
    api.update(cyl=efficient_cyl,ball=efficient_ball)

    def old(name):
        pattern = re.compile(re.escape(name) + r'(?:\.\d+)?$')
        return [o for o in bpy.context.scene.objects if pattern.fullmatch(o.name)]

    def remove(names):
        for name in names:
            for o in old(name):
                bpy.data.objects.remove(o, do_unlink=True)

    def snapshot(o):
        # Primitive makers apply scale to cubes, but not to the ellipsoid spheres.
        bounds = o.bound_box
        if abs(o.rotation_euler.x) + abs(o.rotation_euler.y) > .001:
            from mathutils import Euler, Vector
            rotation = Euler((o.rotation_euler.x, o.rotation_euler.y, 0)).to_matrix()
            bounds = [rotation @ Vector(tuple(v[i]*o.scale[i] for i in range(3))) for v in bounds]
            sizes = [max(v[i] for v in bounds)-min(v[i] for v in bounds) for i in range(3)]
        else:
            sizes = [max(v[i] for v in bounds)-min(v[i] for v in bounds) for i in range(3)]
            sizes = [sizes[i]*o.scale[i] for i in range(3)]
        return {'name': o.name, 'at': (o.location.x, o.location.z, -o.location.y),
                'size': (sizes[0], sizes[2], sizes[1]), 'yaw': o.rotation_euler.z,
                'material': o.data.materials[0]}

    def mesh(name, verts, faces, material, smooth=False):
        data = bpy.data.meshes.new(name)
        data.from_pydata([loc(v) for v in verts], [], faces)
        data.materials.append(material); data.update()
        obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
        if smooth:
            for face in data.polygons: face.use_smooth = True
        return obj

    def lathe(name, profile, at, material, verts=16, ellipse=1., yaw=0.):
        verts=min(verts,12) if max(r for r,y in profile)<.20 else min(verts,16)
        cx, cy, cz = at
        vertices = []
        for r, y in profile:
            for k in range(verts):
                a = k*math.tau/verts
                x, z = r*math.cos(a), r*math.sin(a)*ellipse
                vertices.append((cx+x*math.cos(yaw)+z*math.sin(yaw), cy+y,
                                 cz-x*math.sin(yaw)+z*math.cos(yaw)))
        faces = [(i*verts+k, (i+1)*verts+k,
                  (i+1)*verts+(k+1)%verts, i*verts+(k+1)%verts)
                 for i in range(len(profile)-1) for k in range(verts)]
        return mesh(name, vertices, faces, material, True)

    def tube(name, points, radius, material):
        from mathutils import Vector
        centres=[Vector(p) for p in points];vertices=[];sides=4
        for i,p in enumerate(centres):
            tangent=(centres[min(i+1,len(centres)-1)]-centres[max(i-1,0)]).normalized()
            reference=Vector((1,0,0)) if abs(tangent.z)>.9 else Vector((0,0,1))
            u=tangent.cross(reference).normalized();v=tangent.cross(u).normalized()
            for k in range(sides):
                q=p+radius*(u*math.cos(k*math.tau/sides)+v*math.sin(k*math.tau/sides))
                vertices.append(tuple(q))
        faces=[(i*sides+k,i*sides+(k+1)%sides,(i+1)*sides+(k+1)%sides,(i+1)*sides+k) for i in range(len(centres)-1) for k in range(sides)]
        faces += [tuple(reversed(range(sides))),tuple(range((len(centres)-1)*sides,len(centres)*sides))]
        return mesh(name,vertices,faces,material,True)

    def text(name, value, at, size, material, yaw=0.):
        data = bpy.data.curves.new(name, 'FONT'); data.body = value
        # Blender's default font has Latin glyphs. The simple coin stamp remains
        # readable on hosts without a loadable CJK font rather than exporting tofu.
        if value == '福': data.body = 'LUCK'
        data.size = size; data.align_x = 'CENTER'; data.align_y = 'CENTER'
        data.resolution_u = 2; data.extrude = 0
        obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
        obj.location = loc(at); obj.rotation_euler = (math.pi/2, 0, yaw)
        data.materials.append(material)
        data_mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        result=bpy.data.objects.new(name,data_mesh);bpy.context.collection.objects.link(result)
        result.matrix_world=obj.matrix_world.copy()
        if not data_mesh.materials:data_mesh.materials.append(material)
        bpy.data.objects.remove(obj,do_unlink=True);bpy.data.curves.remove(data)
        return result

    api.update(old=old, remove=remove, snapshot=snapshot, mesh=mesh, lathe=lathe, tube=tube, text=text)
    return api


def upgrade_real_props(api):
    bpy, M, mat = (api[k] for k in ('bpy', 'M', 'mat'))
    cube, cyl, ball, ring = (api[k] for k in ('cube', 'cyl', 'ball', 'ring'))
    old, remove, snap, lathe, tube, text, mesh = (api[k] for k in ('old', 'remove', 'snapshot', 'lathe', 'tube', 'text', 'mesh'))
    ivory = mat('Dish warm ivory', 'e9dfc9', .34)
    glass = mat('Moulded drink glass', 'cfdfdc', .08, alpha=.26)
    dark = mat('Appliance recess', '272a27', .66)
    thread = mat('Upholstery thread', '99775d', .9)
    cloth = mat('Woven oshibori', 'd7ceba', .95)
    steel_edge = mat('Polished rolled steel lip', 'c2c4b9', .26, .75)
    bottle_cream = mat('Bottle label ivory', 'dfd0a8', .9)
    bottle_ink = mat('Bottle label ink', '493e31', .95)
    inventory = {}

    def at(p, x=0., y=0., z=0.): return p[0]+x, p[1]+y, p[2]+z

    def take(name, extras=()):
        items = [snap(o) for o in old(name)]; remove([name, *extras])
        inventory[name] = len(items); return items

    def vessel(name, p, r, h, material=ivory, ceramic=True, ellipse=1.):
        # A foot, curved outer wall, rolled lip, inner wall and real recessed floor.
        wall = min(.008, r*.12)
        profile = [(0,0),(r*.48,0),(r*.52,.005),(r*.7,.011),(r,h*.83),
                   (r*.985,h),(r-wall,h),(r*.7-wall,.017),(0,.017)]
        lathe(name, profile, p, material, 16, ellipse)
        if ceramic:
            lathe(name+' painted rim', [(r*.987,h-.006),(r*.99,h-.003)], p, M['blue'],16,ellipse)

    def dish(name, p, w, d, material=ivory, h=.016):
        r=w/2
        lathe(name, [(0,0),(r*.45,0),(r*.5,.003),(r*.83,h*.48),
                     (r,h*.88),(r*.97,h),(r*.82,h*.62),(r*.48,.007),(0,.007)],
              p, material, 20, d/w)
        lathe(name+' cobalt edge', [(r*.977,h*.83),(r*.977,h*.94)],p,M['blue'],20,d/w)

    def bottle(name, p, r, h, material, label='AWAMORI', cap=True, square=False):
        neck=r*.36
        if square:
            cube(name+' square body',(r*1.8,h*.70,r*1.8),at(p,0,h*.35),material,bevel=r*.16)
            lathe(name+' shoulder',[(r*.75,h*.68),(r*.73,h*.74),(neck,h*.81),(neck,h*.95)],p,material,12)
        else:
            lathe(name+' glass body',[(0,0),(r*.8,0),(r,.009),(r,h*.62),
                                     (r*.91,h*.72),(neck*1.1,h*.82),(neck,h*.95),
                                     (neck*.76,h*.95),(neck*.72,h*.88)],p,material,12)
        lathe(name+' lip',[(neck*1.05,h*.93),(neck*1.08,h*.96)],p,material,12)
        if cap:
            cyl(name+' screw cap',neck*1.08,h*.04,at(p,0,h*.98),M['lacquer'],12)
            for j in range(6):
                a=j*math.tau/6
                cube(name+' cap flute',(.002,h*.034,.002),at(p,math.cos(a)*neck*1.08,h*.98,math.sin(a)*neck*1.08),steel_edge)
        else:
            cyl(name+' open dark mouth',neck*.70,.001,at(p,0,h*.925),dark,12)
        if label:
            # The curved paper front follows the glass shoulder; lettering is actual
            # shared-material geometry, so it survives the final colour merge.
            cube(name+' paper label',(r*1.5,h*.27,.0018),at(p,0,h*.37,r+.001),bottle_cream,bevel=.002)
            cube(name+' red label rule',(r*1.36,.003,.0006),at(p,0,h*.46,r+.0021),M['red'])
            text(name+' brand',label,at(p,0,h*.39,r+.0027),min(r*.23,.012),bottle_ink)
            text(name+' label fine print','MINATO',at(p,0,h*.30,r+.0027),min(r*.16,.008),bottle_ink)

    def folded_cloth(name,p,w,d,material=cloth):
        cube(name+' folded base',(w,.004,d),at(p,0,.002),material,bevel=.001)
        verts=[]
        for row in range(3):
            for col in range(5):
                x=(col/4-.5)*w*.74;z=(row/2-.5)*d
                verts.append(at(p,x,.005+.002*math.sin(col*1.7+row*.6),z))
        faces=[(r*5+c,(r+1)*5+c,(r+1)*5+c+1,r*5+c+1) for r in range(2) for c in range(4)]
        mesh(name+' creased fold',verts,faces,material)
        for z in (-d/2+.003,d/2-.003): tube(name+' hem',[at(p,-w*.45,.004,z),at(p,w*.45,.004,z)],.0006,thread)

    # ---------------------------------------------------------------- vessels
    for name in ('Stacked plates','Yakitori plate','Sashimi plate'):
        for item in take(name):
            x,y,z=item['at'];w,h,d=item['size']
            dish('Turned '+name,(x,y-h/2,z),w,d,item['material'],max(.010,h))
    for name in ('Edamame bowl','Prep bowl','Ochoko','Donburi'):
        for item in take(name, ('Donburi rim',) if name=='Donburi' else ()):
            x,y,z=item['at'];w,h,d=item['size']
            vessel('Hollow '+name,(x,y-h/2,z),w/2,h,item['material'],True,d/w)
    for item in take('Tokkuri',('Tokkuri neck',)):
        p=item['at'];r=item['size'][0]/2;base=at(p,0,-item['size'][1]/2)
        lathe('Turned sake flask',[(0,0),(r*.52,0),(r,.026),(r,.070),
              (r*.72,.110),(r*.38,.125),(r*.4,.152),(r*.24,.152),(r*.23,.139)],base,ivory,16)
        lathe('Sake flask blue band',[(r*.993,.032),(r*.993,.040)],base,M['blue'],16)
        text('Sake flask mark','SAKE',at(base,0,.065,r+.001),.010,M['blue'])
    for name in ('Beer glass','Rocks glass','Water cup'):
        for item in take(name):
            p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
            lathe('Hollow '+name,[(0,0),(r*.91,0),(r,.005),(r,h),
                  (r-.003,h),(r-.004,.009),(0,.009)],base,glass,16)
            ring(name+' rolled lip',r-.001,.0016,at(base,0,h-.001),glass)
            if name=='Water cup':cyl('Water in cup',r-.005,.002,at(base,0,h*.62),M['clear'],16)
    for item in take('Beer in glass',('Beer head',)):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        lathe('Table beer glass',[(0,0),(r*.95,0),(r*1.08,.004),(r*1.08,h+.025),
              (r,h+.025),(r,.01),(0,.01)],base,glass,16)
        cyl('Poured lager',r*.96,h*.78,at(base,0,.008+h*.39),M['beer'],16)
        cyl('Uneven beer head',r*.98,.008,at(base,0,.012+h*.78),M['foam'],16)
        ring('Beer foam lacing',r,.001,at(base,0,h+.011),M['foam'])
    for item in take('Glass ashtray'):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        lathe('Recessed glass ashtray',[(0,0),(r*.9,0),(r,.006),(r,h),
              (r*.75,h),(r*.6,.006),(0,.006)],base,glass,16)
        for side in (-1,1):cube('Ashtray cigarette groove',(.011,.002,.024),at(base,side*r*.83,h-.001),dark,bevel=.001)

    # ---------------------------------------------------------------- bottles
    for item in take('Bottle',('Bottle neck','Bottle shoulder','Bottle cap','Bottle label','Keep tag')):
        p=item['at'];w,h,d=item['size'];m=item['material'];base=at(p,0,-h/2)
        square=m==M['whisky'];full_h=h+.0925 if square else h+.12
        # Shelf spacing is .34 m. The original tall isshobin necks pierced the
        # board above; keep the complete bottle below that board's underside.
        if base[1]<2.40:full_h=min(full_h,.306)
        label='WHISKY' if square else 'GIN' if m==M['gin'] else 'SHOCHU' if m==M['clear'] else 'AWAMORI'
        bottle('Back bar '+label,base,w/2,full_h,m,label,square=square)
    for name,extras,label,full_h in [('Big beer bottle',('Big beer neck','Beer label'),'UMINEKO',.32),
                                   ('Open whisky',('Open whisky neck','Open whisky label'),'WHISKY',.29),
                                   ('Open gin',('Open gin neck',),'GIN',.30),
                                   ('Sauce bottle',('Bottle label',),'SAUCE',.27)]:
        for item in take(name,extras):
            p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
            if name=='Sauce bottle':base=(p[0],.8975,p[2])
            bottle('Shaped '+name,base,w/2,full_h,item['material'],label,
                   cap=not name.startswith('Open'),square=name=='Open whisky')

    # ---------------------------------------------------------------- open storage
    crates=take('Beer crate',('Bottle top',))
    for item in crates:
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2);m=item['material']
        covered=any(abs(other['at'][0]-p[0])<.01 and abs(other['at'][2]-p[2])<.01 and other['at'][1]>p[1]+.15 for other in crates)
        cube('Crate open base',(w,.018,d),at(base,0,.009),m,bevel=.004)
        for y in (.055,.15,.287):
            for z in (-d/2+.009,d/2-.009):cube('Crate horizontal rail',(w,.018,.018),at(base,0,y,z),m,bevel=.003)
        for x in (-w/2+.009,w/2-.009):
            for z in (-d/2+.01,d/2-.01):cube('Crate corner',( .022,h,.022),at(base,x,h/2,z),m,bevel=.003)
            # Hand opening between the upper/lower crossbars, with short end webs.
            for y in (.203,.287):cube('Crate handle rail',(.020,.016,d),at(base,x,y),m,bevel=.003)
            for z in (-d*.38,d*.38):cube('Crate handle end',(.02,.082,d*.15),at(base,x,.245,z),m,bevel=.004)
        for i in range(7):
            x=-w*.42+i*w*.14
            for z in (-d/2+.01,d/2-.01):cube('Crate web slat',(.013,.242,.013),at(base,x,.135,z),m)
        text('Crate brewery mark','BEER',at(base,0,.145,d/2+.01),.038,bottle_cream)
        for i in range(4):
            for j in range(3):bottle('Empty return bottle',at(base,-.165+i*.11,.018,-.1+j*.1),.026,.274 if covered else .32,M['brown'],None,False)

    # ---------------------------------------------------------------- small condiments
    for item in take('Soy cruet',('Soy cruet cap',)):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        lathe('Soy cruet shaped body',[(0,0),(r*.6,0),(r,.015),(r,h*.63),
              (r*.6,h*.88),(r*.55,h)],base,ivory,12)
        cyl('Soy cruet fitted lid',r*.63,.007,at(base,0,h+.002),M['red'],12)
        tube('Soy cruet pouring spout',[at(base,0,h*.76,r*.7),at(base,0,h*.84,r*1.32)],.006,ivory)
        text('Soy cruet mark','SOY',at(base,0,h*.47,r+.001),.010,M['blue'])
    for name in ('Shichimi tin','Pepper shaker','Table condiment jar'):
        for item in take(name):
            p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
            lathe('Detailed '+name,[(0,0),(r*.9,0),(r,.004),(r,h*.88),(r*.8,h),(0,h)],base,item['material'],12)
            cyl(name+' perforated lid',r*.88,.005,at(base,0,h+.001),steel_edge,12)
            for k in range(5):
                a=k*math.tau/5;cyl(name+' lid hole',.0013,.001,at(base,math.cos(a)*r*.4,h+.004,math.sin(a)*r*.4),dark,6)
            cube(name+' label',(r*1.4,h*.4,.001),at(base,0,h*.44,r+.001),bottle_cream)
            text(name+' printing','PEPPER' if name=='Pepper shaker' else 'CHILI',at(base,0,h*.44,r+.002),.006,bottle_ink)
    for name in ('Garlic jar','Beni shoga pot'):
        for item in take(name):
            p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
            vessel('Open '+name,base,r,h,glass if name=='Garlic jar' else M['red'],False)
            for k in range(6):
                a=k*2.4;ball(name+' contents',(.006,.008,.008),at(base,math.cos(a)*r*.48,h*.64,math.sin(a)*r*.48),ivory if name=='Garlic jar' else M['salmon'],8,4)
            cyl(name+' screw lid',r*1.01,.005,at(base,0,h+.0025),M['lacquer'],12)
    for name in ('Toothpick box','Chopstick box','Chopstick holder'):
        for item in take(name):
            p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
            cube(name+' bottom',(w,.008,d),at(base,0,.004),M['honey'],bevel=.002)
            for side in (-1,1):
                cube(name+' long wall',(w,h,.006),at(base,0,h/2,side*(d/2-.003)),M['honey'],bevel=.002)
                cube(name+' end wall',(.006,h,d),at(base,side*(w/2-.003),h/2),M['honey'],bevel=.002)
            for k in range(6):
                x=-w*.38+k*w*.15
                if name=='Toothpick box':cyl('Visible toothpick',.0015,h*.87,at(base,x,h*.6),bottle_cream,5)
                else: tube('Stored bamboo chopstick',[at(base,x,.012,-d*.32),at(base,x,h*.86,d*.32)],.0018,bottle_cream)
    for item in take('Water pitcher'):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        lathe('Hollow water pitcher',[(0,0),(r*.8,0),(r,.015),(r,h),(r-.007,h),(r-.009,.012),(0,.012)],base,M['steel'],16)
        tube('Pitcher loop handle',[at(base,r*.88,h*.74),at(base,r*1.29,h*.72),at(base,r*1.4,h*.38),at(base,r*.92,h*.30)],.006,steel_edge)
        tube('Pitcher pouring lip',[at(base,-r*.92,h),at(base,-r*1.1,h+.009),at(base,-r*.8,h)],.006,steel_edge)
    for item in take('Chopstick sleeve',('Sleeve band',)):
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2+.002)
        cube('Folded paper sleeve',(w,.002,d*.72),at(base,0,.001,d*.12),bottle_cream)
        cube('Chopstick sleeve red band',(w+.001,.0008,.035),at(base,0,.0025,-d*.21),M['red'])
        for x in (-.006,.006):tube('Exposed bamboo tips',[at(base,x,.003,-d*.5),at(base,x,.003,d*.49)],.0018,M['honey'])
        tube('Paper sleeve folded seam',[at(base,w*.45,.003,-d*.18),at(base,w*.45,.003,d*.48)],.0006,thread)
    for item in take('Rolled oshibori',('Oshibori tray',)):
        p=at(item['at'],0,.009);d=item['size'][2]
        dish('Oshibori shallow tray',(p[0],1.111,p[2]),.08,.20,M['honey'],.008)
        cyl('Cotton rolled oshibori',.021,d,p,cloth,12,axis='z')
        # Fine longitudinal creases and visible spiralled cotton ends read as a
        # single rolled towel; separated thick folds looked like spare chopsticks.
        for k in range(5):
            a=k*math.tau/7
            tube('Oshibori cloth crease',[at(p,math.cos(a)*.021,math.sin(a)*.021,-d*.46),at(p,math.cos(a)*.021,math.sin(a)*.021,d*.46)],.0006,bottle_cream)
        for side in (-1,1):
            points=[]
            for j in range(28):
                a=j/27*math.tau*1.7;r=.002+j/27*.016
                points.append(at(p,math.cos(a)*r,math.sin(a)*r,side*(d/2+.0005)))
            tube('Oshibori rolled cotton end',points,.00065,bottle_cream)
    for item in take('Cloth'):
        p=item['at'];w,h,d=item['size'];folded_cloth('Prep towel',(p[0],.9,-5.69),w,d)
    for name in ('Menu stand','Table menu'):
        for item in take(name):
            p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
            # Folded table tent, with two inclined printed faces and an open bottom.
            verts=[at(base,-w/2,0,-.018),at(base,w/2,0,-.018),at(base,w/2,h,0),at(base,-w/2,h,0),
                   at(base,-w/2,0,.018),at(base,w/2,0,.018)]
            mesh('Folded '+name,verts,[(0,1,2,3),(3,2,5,4)],bottle_cream)
            text(name+' title','MINATO',at(base,0,h*.77,.010),min(.018,w*.18),bottle_ink)
            for j in range(4):cube(name+' price line',(w*.64,.001,.0006),at(base,0,h*(.59-j*.105),.013+j*.002),M['red'])

    # ---------------------------------------------------------------- working kitchen
    def carcass(item, material, count=2):
        p=item['at'];w,h,d=item['size'];bottom=at(p,0,-h/2)
        cube('Cabinet bottom',(w,.024,d),at(bottom,0,.012),material)
        for side in (-1,1):cube('Cabinet side',(.022,h,d),at(bottom,side*(w/2-.011),h/2),material)
        for z in (-d/2+.012,d/2-.012):
            for j in range(count):
                x=-w/2+(j+.5)*w/count
                cube('Working cabinet door',(w/count-.018,h-.055,.018),at(bottom,x,h/2,z),material,bevel=.004)
                cube('Cabinet inset door rim',(w/count-.055,.009,.005),at(bottom,x,h-.043,z+(.013 if z>0 else -.013)),steel_edge)
                cube('Cabinet pull',(.082,.013,.015),at(bottom,x,h*.70,z+(.028 if z>0 else -.028)),dark,bevel=.004)
        return bottom

    for name in ('Work top cabinet','Sink cabinet','Ramen work top cabinet','Toppings table'):
        for item in take(name,('Cabinet door seam',) if name=='Work top cabinet' else ()):
            carcass(item,M['steel'],7 if name=='Work top cabinet' else 2)

    def sink_top(item, holes):
        p=item['at'];w,h,d=item['size'];xmin=p[0]-w/2;xmax=p[0]+w/2;zmin=p[2]-d/2;zmax=p[2]+d/2
        edges=sorted([xmin,xmax,*[x for hole in holes for x in (hole[0]-hole[2]/2,hole[0]+hole[2]/2)]])
        for x0,x1 in zip(edges[:-1],edges[1:]):
            if x1-x0<.001:continue
            hole=next((t for t in holes if t[0]-t[2]/2<=(x0+x1)/2<=t[0]+t[2]/2),None)
            strips=[(zmin,zmax)] if not hole else [(zmin,hole[1]-hole[3]/2),(hole[1]+hole[3]/2,zmax)]
            for z0,z1 in strips:
                if z1-z0>.001:cube('Sink cutout counter steel',(x1-x0,h,z1-z0),((x0+x1)/2,p[1],(z0+z1)/2),M['steel'])

    for name in ('Work top','Sink top'):
        for item in take(name):
            holes=[(2.85,-3.06,.46,.36)] if name=='Work top' else [(3.52,-5.95,.5,.44),(4.18,-5.95,.5,.44)]
            sink_top(item,holes)

    def basin(p,w,d,top,depth):
        # Rolled rectangular flange and true sloped basin; cabinet/top holes remain
        # empty down to the metal floor rather than a black rectangle on a slab.
        rings=[(w/2,d/2,top),(w/2-.016,d/2-.016,top-.006),
               (w/2-.035,d/2-.035,top-depth),(w/2-.045,d/2-.045,top-depth-.005)]
        v=[]
        for rx,rz,y in rings:
            for x,z in [(-rx,-rz),(rx,-rz),(rx,rz),(-rx,rz)]:v.append((p[0]+x,y,p[2]+z))
        mesh('Real recessed stainless sink',v,[(i*4+k,(i+1)*4+k,(i+1)*4+(k+1)%4,i*4+(k+1)%4) for i in range(3) for k in range(4)]+[(15,14,13,12)],M['steel'])
        drain=(p[0],top-depth+.002,p[2]);cyl('Sink drain recess',.026,.002,drain,dark,12)
        ring('Sink drain steel rim',.027,.002,at(drain,0,.001),steel_edge)
        for a in range(3):
            angle=a*math.pi/3
            tube('Sink drain strainer',[(drain[0]+math.cos(angle)*t,drain[1]+.002,drain[2]+math.sin(angle)*t) for t in (-.019,.019)],.0012,steel_edge)
        for dx in (-w/2,w/2):tube('Sink rolled side',[(p[0]+dx,top+.002,p[2]-d/2),(p[0]+dx,top+.002,p[2]+d/2)],.003,steel_edge)
        for dz in (-d/2,d/2):tube('Sink rolled end',[(p[0]-w/2,top+.002,p[2]+dz),(p[0]+w/2,top+.002,p[2]+dz)],.003,steel_edge)

    for item in take('Sink basin'):basin(item['at'],.46,.36,.9175,.12)
    for item in take('Sink bowl'):basin(item['at'],.5,.44,.8975,.15)
    for name,extras in [('Sink tap',('Tap spout',)),('Kitchen tap',('Kitchen spout',))]:
        for item in take(name,extras):
            p=item['at'];h=item['size'][1];base=at(p,0,-h/2)
            points=[base,at(base,0,h*.69),at(base,0,h*.88,.006),at(base,0,h*.98,.043),at(base,0,h*.96,.095),at(base,0,h*.83,.133)]
            tube('Curved mixer tap',points,.012 if name=='Sink tap' else .015,steel_edge)
            cyl('Tap mounting flange',.025,.006,at(base,0,.003),steel_edge,12)
            for dx in (-.037,.037):
                cyl('Hot cold tap valve',.015,.020,at(base,dx,.015),M['steel'],10)
                cube('Tap lever',(.040,.007,.009),at(base,dx,.029),M['red'] if dx<0 else M['blue'],bevel=.002)

    def cooking_pot(name,item,kind):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2);body_r=r*.81
        if kind=='wok':
            lathe('Hollow '+name,[(0,0),(r*.42,0),(r*.64,h*.18),(r*.83,h*.52),(r,h),(r-.007,h),(r*.79,h*.51),(r*.4,.009),(0,.009)],base,M['darksteel'],20)
        else:
            lathe('Hollow '+name,[(0,0),(body_r*.93,0),(body_r,.01),(body_r,h),
                  (body_r-.012,h),(body_r-.014,.018),(0,.018)],base,M['steel'] if kind=='stock' else M['darksteel'],20)
            ring('Cookware rolled rim',body_r,.003,at(base,0,h),steel_edge)
            for side in (-1,1):
                x=side*body_r
                tube('Pot riveted loop handle',[at(base,x,h*.73,-r*.12),at(base,side*r*.98,h*.73,-r*.12),at(base,side*r*.98,h*.73,r*.12),at(base,x,h*.73,r*.12)],.006,steel_edge)
                ball('Pot handle rivet',(.005,.005,.003),at(base,x,h*.73,r*.13),steel_edge,6,4)
        if kind=='pan':tube('Pan dark handle',[at(base,-body_r*.95,h*.75),at(base,-r-.13,h*.79)],.014,M['smoke'])

    for name,kind in [('Stock pot','stock'),('Soup pot','stock'),('Wok','wok'),('Frying pan','pan')]:
        for item in take(name):cooking_pot(name,item,kind)
    for name in ('Stock pot broth','Soup'):
        for item in take(name):
            p=at(item['at'],0,-.018 if name=='Stock pot broth' else -.028);r=item['size'][0]/2*.82
            cyl('Simmering '+name,r,.003,p,M['broth'],20)
            for k in range(7):
                a=k*2.4;ball('Broth simmer bubble',(.009,.002,.009),at(p,math.cos(a)*r*.62,.003,math.sin(a)*r*.62),M['foam'],8,4)
    for item in take('Pot lid'):
        p=item['at'];r=item['size'][0]/2
        lathe('Domed pot lid',[(0,.02),(r*.35,.016),(r*.85,.004),(r,0),(r*.95,-.004)],p,steel_edge,20)
        ball('Pot lid knob',(.023,.016,.023),at(p,0,.03),dark,10,6)
    for item in take('Kettle',('Kettle lid',)):
        p=item['at'];r=item['size'][0]/2;base=at(p,0,-item['size'][1]/2)
        lathe('Shaped steel kettle',[(0,0),(r*.67,0),(r*.92,.035),(r*.90,.10),(r*.63,.15),(r*.58,.16),(0,.16)],base,M['steel'],16)
        lathe('Kettle fitted lid',[(0,.178),(r*.45,.171),(r*.63,.163)],base,steel_edge,16)
        tube('Kettle carrying handle',[at(base,-r*.55,.13),at(base,-r*.7,.208),at(base,0,.234),at(base,r*.7,.208),at(base,r*.55,.13)],.009,dark)
        tube('Kettle pouring spout',[at(base,r*.65,.055),at(base,r*1.06,.080),at(base,r*1.18,.129)],.017,steel_edge)
        ball('Kettle lid knob',(.013,.010,.013),at(base,0,.187),dark,8,4)
    for item in take('Burner ring'):
        p=item['at'];ring('Burner cast iron circle',.087,.008,p,dark)
        cyl('Burner flame cap',.049,.007,p,dark,16)
        for k in range(4):
            a=k*math.pi/2
            tube('Burner pan support',[(p[0]+math.cos(a)*r,p[1]+(.015 if r<.055 else .008),p[2]+math.sin(a)*r) for r in (.034,.09,.113)],.008,dark)
    for item in take('Range knob'):
        p=item['at'];cyl('Stove knob collar',.032,.012,p,steel_edge,12,axis='z')
        cyl('Stove turned control',.024,.023,at(p,0,0,.012),dark,12,axis='z')
        cube('Knob setting stripe',(.003,.013,.001),at(p,0,.008,.025),ivory)
    for item in take('Rice cooker',('Rice cooker lid',)):
        p=item['at'];r=item['size'][0]/2;base=at(p,0,-item['size'][1]/2)
        lathe('Rice cooker shaped shell',[(0,0),(r*.8,0),(r*.91,.02),(r,.09),(r*.96,.20),(r*.86,.224),(r*.73,.236),(0,.236)],base,ivory,20)
        ring('Rice cooker lid gasket',r*.88,.006,at(base,0,.218),dark)
        tube('Rice cooker lid handle',[at(base,-.043,.233),at(base,-.043,.265),at(base,.043,.265),at(base,.043,.233)],.012,dark)
        cube('Rice cooker control panel',(.085,.048,.008),at(base,0,.09,r+.001),dark,bevel=.005)
        cube('Cooker heating switch',(.030,.013,.006),at(base,0,.076,r+.008),steel_edge,bevel=.003)
        ball('Cooker orange cook lamp',(.004,.004,.002),at(base,-.022,.105,r+.007),M['red'],8,4)
        text('Rice cooker lettering','COOK',at(base,.012,.106,r+.010),.009,ivory)
        for dx in (-r*.88,r*.88):cube('Rice cooker side grip',(.025,.017,.059),at(base,dx,.16),dark,bevel=.005)
    # Basket walls are real wire grids; the interior is visible down into the oil.
    for name in ('Fryer basket','Tebo basket'):
        for item in take(name):
            p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
            if name=='Fryer basket':
                for i in range(6):
                    x=-w/2+i*w/5
                    tube('Fryer basket transverse wire',[at(base,x,h,-d/2),at(base,x,0,-d/2),at(base,x,0,d/2),at(base,x,h,d/2)],.0025,steel_edge)
                for i in range(9):
                    z=-d/2+i*d/8
                    tube('Fryer basket cross wire',[at(base,-w/2,h,z),at(base,-w/2,0,z),at(base,w/2,0,z),at(base,w/2,h,z)],.0025,steel_edge)
                for y in (h*.35,h*.68,h):tube('Fryer basket perimeter',[at(base,-w/2,y,-d/2),at(base,w/2,y,-d/2),at(base,w/2,y,d/2),at(base,-w/2,y,d/2),at(base,-w/2,y,-d/2)],.003,steel_edge)
            else:
                r=w/2
                for k in range(12):
                    a=k*math.tau/12;tube('Noodle basket vertical wire',[at(base,math.cos(a)*r*.78,0,math.sin(a)*r*.78),at(base,math.cos(a)*r,h,math.sin(a)*r)],.0018,steel_edge)
                for y in (0,h*.3,h*.6,h):ring('Noodle basket woven ring',r*(.78+.22*y/h),.002,at(base,0,y),steel_edge)
                for k in range(4):tube('Noodle basket mesh base',[at(base,-r*.7,0,(k-1.5)*r*.35),at(base,r*.7,0,(k-1.5)*r*.35)],.0018,steel_edge)
    for item in take('Toppings tray'):
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
        cube('Ingredient tray floor',(w,.006,d),at(base,0,.003),M['steel'],bevel=.004)
        for side in (-1,1):
            cube('Ingredient tray rolled side',(.005,h,d),at(base,side*(w/2-.0025),h/2),steel_edge,bevel=.002)
            cube('Ingredient tray rolled end',(w,h,.005),at(base,0,h/2,side*(d/2-.0025)),steel_edge,bevel=.002)
    for item in take('Ladle cup'):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1]
        vessel('Hollow ladle bowl',at(p,0,-h/2),r,h,M['steel'],False)
    for item in take('Oden pot'):
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
        cube('Oden thin pot floor',(w,.012,d),at(base,0,.006),M['steel'],bevel=.003)
        for side in (-1,1):
            cube('Oden thin end',(w,h,.010),at(base,0,h/2,side*(d/2-.005)),M['steel'],bevel=.003)
            cube('Oden thin side',(.010,h,d),at(base,side*(w/2-.005),h/2),M['steel'],bevel=.003)
            tube('Oden rolled handle',[at(base,side*w/2,h*.73,-.045),at(base,side*(w/2+.036),h*.73,-.045),at(base,side*(w/2+.036),h*.73,.045),at(base,side*w/2,h*.73,.045)],.006,steel_edge)
    for item in take('Fryer'):
        carcass(item,M['steel'],1)
        p=item['at'];w,h,d=item['size']
        cube('Fryer deep oil well',(.56,.012,.5),(p[0],.72,p[2]-.02),dark)
        for side in (-1,1):
            cube('Fryer oil tank side',(.018,.18,.54),(p[0]+side*.285,.82,p[2]-.02),M['steel'])
            cube('Fryer oil tank end',(.59,.18,.018),(p[0],.82,p[2]-.02+side*.26),M['steel'])
        cube('Fryer thermostat panel',(.59,.085,.068),(p[0],.942,p[2]-.30),dark,bevel=.006)
        cyl('Fryer thermostat knob',.022,.012,(p[0]+.15,.944,p[2]-.26),steel_edge,16,axis='z')
        text('Fryer setting','180 C',(p[0]-.09,.944,p[2]-.259),.022,ivory)
    for item in take('Noodle boiler'):
        p=item['at'];w,h,d=item['size'];carcass(item,M['steel'],2)
        for side in (-1,1):
            cube('Noodle boiler well side',(.02,.13,d*.80),(p[0]+side*w*.45,.87,p[2]),M['steel'])
            cube('Noodle boiler well end',(w*.92,.13,.02),(p[0],.87,p[2]+side*d*.40),M['steel'])
        for k in range(3):
            cyl('Boiler control knob',.026,.020,(p[0]-.25+k*.25,.68,p[2]+d/2+.018),dark,16,axis='z')
        tube('Boiler drain pipe',[(p[0]+w*.38,.75,p[2]+d/2+.01),(p[0]+w*.38,.69,p[2]+d/2+.05)],.012,steel_edge)
    for item in take('Dish rack'):
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
        for z in (-d/2,d/2):tube('Dish rack support rim',[at(base,-w/2,.015,z),at(base,w/2,.015,z)],.006,steel_edge)
        for k in range(11):
            x=-w*.46+k*w*.092
            tube('Dish rack wire slot',[at(base,x,.05,-d/2),at(base,x,0,-d/2),at(base,x,0,d/2),at(base,x,.05,d/2)],.003,steel_edge)
        for x in (-w*.4,w*.4):tube('Dish rack wall bracket',[at(base,x,0,0),at(base,x,-.16,-d/2)],.008,steel_edge)
    for item in take('Plate in rack'):
        p=item['at'];material=item['material']
        o=dish('Dish rack ceramic plate',(0,0,0),.2,.2,material,.011)
        # dish() emits its two meshes directly in world coordinates; turn both as
        # vertical plates, the original orientation of the wall drying rack.
        for o in list(bpy.context.scene.objects):
            if o.name.startswith('Dish rack ceramic plate') and tuple(o.location)==(0.,0.,0.):
                o.rotation_euler.y=math.pi/2;o.location=api['loc'](p)
    for item in [snap(o) for o in old('Grill body')]:
        p=item['at'];w,h,d=item['size']
        cube('Grill charcoal access door',(w*.75,h*.43,.008),at(p,0,-h*.07,d/2+.005),M['lacquer'],bevel=.006)
        for k in range(12):cube('Grill air vent',(.028,.004,.002),at(p,-w*.36+k*w*.065,-h*.06,d/2+.011),steel_edge)
        for side in (-1,1):tube('Grill lifting handle',[at(p,side*w/2,h*.1,-.04),at(p,side*(w/2+.036),h*.1,-.04),at(p,side*(w/2+.036),h*.1,.04),at(p,side*w/2,h*.1,.04)],.008,steel_edge)
    inventory['Grill body finish']=len(old('Grill body'))
    for item in [snap(o) for o in old('Beer tower')]:
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        cyl('Beer tower mounting flange',r*1.42,.008,base,steel_edge,16)
        cyl('Beer tap valve body',.026,.04,at(base,0,h*.82,.046),steel_edge,16,axis='z')
        tube('Beer tap downward nozzle',[at(base,0,h*.82,.063),at(base,0,h*.80,.102),at(base,0,h*.65,.116)],.009,steel_edge)
        cube('Tap drip tray base',(.17,.009,.16),at(base,0,.003,.095),M['steel'],bevel=.006)
        for k in range(8):tube('Tap drip grille',[at(base,-.067+k*.019,.009,.022),at(base,-.067+k*.019,.009,.162)],.0018,dark)
    remove(['Beer spout']);inventory['Beer tower finish']=len(old('Beer tower'))
    # Cabinet drawer/oven/fridge faces are physical joins and controls rather than
    # blank silver volumes. Their feet stay on the same original slab.
    for name in ('Range body','Prep bench','Back bar cupboard','Kitchen fridge','Drinks fridge'):
        items=[snap(o) for o in old(name)];inventory[name+' finish']=len(items)
        for item in items:
            p=item['at'];w,h,d=item['size'];z=p[2]+d/2+.003
            if name=='Range body':
                cube('Range oven door frame',(w*.72,h*.46,.016),(p[0],h*.35,z),dark,bevel=.015)
                cube('Range oven window',(w*.52,h*.28,.005),(p[0],h*.35,z+.01),M['hood'],bevel=.008)
                tube('Oven door handle',[(p[0]-w*.24,h*.61,z+.032),(p[0]+w*.24,h*.61,z+.032)],.013,steel_edge)
            else:
                n=2 if w>.9 else 1
                for j in range(n):
                    x=p[0]-w/2+(j+.5)*w/n
                    cube('Appliance inset seam',(.002,h*.85,.001),(x-w/n*.43,p[1],z),dark)
                    if 'fridge' not in name.lower():cube('Appliance drawer pull',(.09,.012,.019),(x,h*.70,z+.013),dark,bevel=.003)
                for dx in (-w*.36,w*.36):cyl('Appliance adjustable foot',.021,.045,(p[0]+dx,.025,p[2]+d*.33),dark,8)
    for name in ('Grill hood','Kitchen canopy','Ramen canopy','Ramen extractor'):
        items=[snap(o) for o in old(name)];inventory[name+' filters']=len(items)
        for item in items:
            p=item['at'];w,h,d=item['size'];y=p[1]-h/2-.002
            cube('Extractor inset filter',(w*.88,.004,d*.72),(p[0],y,p[2]),dark)
            for k in range(12):cube('Extractor mesh baffle',(.009,.008,d*.70),(p[0]-w*.42+k*w*.84/11,y-.003,p[2]),steel_edge)
            cube('Extractor filter handle',(.09,.014,.018),(p[0],y-.009,p[2]+d*.32),M['steel'],bevel=.004)

    # ---------------------------------------------------------------- domestic edge objects
    for item in take('Umbrella stand'):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1]
        vessel('Glazed umbrella stand',at(p,0,-h/2),r,h,M['blue'],False)
        ring('Umbrella stand cream rim',r*.98,.008,at(p,0,h/2-.006),ivory)
    for item in take('Umbrella'):
        p=item['at'];h=item['size'][1];base=at(p,0,-h/2)
        tube('Umbrella steel shaft',[at(base,0,.02),at(base,0,h*.88)],.004,steel_edge)
        lathe('Furled umbrella canopy',[(.004,.03),(.016,.15),(.028,.43),(.023,.63),(.009,.80)],base,M['lacquer'],8)
        for k in range(8):
            a=k*math.tau/8;tube('Umbrella folded seam',[at(base,math.cos(a)*r,y,math.sin(a)*r) for r,y in [(.006,.09),(.025,.43),(.008,.79)]],.0013,thread)
        ring('Umbrella fastening strap',.024,.003,at(base,0,.51),M['brown'])
        tube('Umbrella curved handle',[at(base,0,.82),at(base,0,.94),at(base,.014,.96),at(base,.030,.95),at(base,.034,.91),at(base,.022,.89)],.008,M['brown'])
    for item in take('Sakaki vase'):
        p=item['at'];base=at(p,0,-item['size'][1]/2)
        lathe('Sakaki porcelain vase',[(0,0),(.018,0),(.024,.018),(.023,.050),(.010,.068),(.013,.080),(.008,.080),(.007,.065)],base,ivory,12)
    for item in take('Sakaki'):
        p=item['at'];tube('Sakaki woody branch',[at(p,0,-.10),p,at(p,.007,.066)],.0018,M['honey'])
        for j in range(7):
            side=1 if j%2 else -1;y=-.06+j*.018
            tube('Sakaki fine stem',[at(p,0,y),at(p,side*.025,y+.008,.008)],.0008,M['sakaki'])
            ball('Sakaki oval leaf',(.018,.004,.009),at(p,side*.027,y+.008,.008),M['sakaki'],10,6)
            tube('Sakaki leaf vein',[at(p,side*.014,y+.012,.008),at(p,side*.040,y+.012,.008)],.00045,M['tatami'])
    shrine_items=take('Kamidana shrine')
    for item in shrine_items:
        p=item['at'];w,h,d=item['size'];z=p[2]+d/2
        cube('Shrine dark inner altar',(w*.75,h*.78,.004),(p[0],p[1],z+.001),M['smoke'])
        for side in (-1,1):cube('Shrine miniature post',(.020,h,.023),(p[0]+side*w*.40,p[1],z+.014),M['honey'],bevel=.003)
        for side in (-1,1):
            cube('Shrine panel door',(w*.30,h*.72,.008),(p[0]+side*w*.24,p[1],z+.016),M['honey'],bevel=.002)
            cyl('Shrine door knob',.003,.008,(p[0]+side*w*.16,p[1],z+.022),M['brass'],8,axis='z')
        cube('Shrine altar step',(w,.016,d*1.12),(p[0],p[1]-h/2-.002,p[2]),M['honey'],bevel=.002)
    for item in [snap(o) for o in old('Shimenawa')]:
        p=item['at'];w=item['size'][0]
        for k in range(3):
            points=[]
            for j in range(30):
                a=j/29*math.tau*8+k*math.tau/3
                points.append((p[0]-w*.49+j/29*w*.98,p[1]+math.cos(a)*.013,p[2]+math.sin(a)*.013))
            tube('Twisted shrine straw rope',points,.005,M['rope'])
        for x in (-.25,-.08,.08,.25):
            mesh('Shrine folded paper streamer',[at(p,x,0,.024),at(p,x+.018,-.025,.024),at(p,x+.005,-.032,.024),at(p,x+.021,-.056,.024),at(p,x+.004,-.071,.024),at(p,x-.008,-.043,.024)],[(0,1,2,3,4,5)],ivory)
    inventory['Shrine carved detailing']=len(shrine_items)
    for item in take('Left shoes'):
        p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2)
        cube('Shoe shaped rubber sole',(w,.009,d),at(base,0,.0045),dark,bevel=.018)
        ball('Leather shoe toe',(w*.48,h*.38,d*.38),at(base,0,h*.42,d*.12),item['material'],14,8)
        ball('Leather shoe heel',(w*.46,h*.43,d*.21),at(base,0,h*.47,-d*.25),item['material'],12,8)
        cyl('Shoe dark collar opening',w*.27,.001,at(base,0,h*.86,-d*.25),dark,14)
        lathe('Shoe rolled collar',[(w*.30,h*.81),(w*.30,h*.9),(w*.26,h*.9)],at(base,0,0,-d*.25),item['material'],14,1.35)
        tube('Shoe toe seam',[at(base,x,h*.66,d*.20+abs(x)*.2) for x in (-w*.33,0,w*.33)],.0012,thread)
    for item in take('Komodaru',('Barrel rope','Barrel label')):
        p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
        lathe('Straw-wrapped sake barrel',[(0,0),(r*.92,0),(r,.065),(r,h*.76),(r*.92,h),(0,h)],base,M['straw'],20)
        for k in range(32):
            a=k*math.tau/32
            tube('Barrel straw strand',[at(base,math.cos(a)*r*.92,.012,math.sin(a)*r*.92),at(base,math.cos(a)*r,.075,math.sin(a)*r),at(base,math.cos(a)*r,h*.77,math.sin(a)*r),at(base,math.cos(a)*r*.92,h-.01,math.sin(a)*r*.92)],.003,M['rope'] if k%4==0 else M['straw'])
        for y in (.08,h-.08):
            for dy in (-.012,.012):ring('Barrel bound straw rope',r+.004,.009,at(base,0,y+dy),M['rope'])
        cube('Sake barrel paper panel',(.002,.24,.25),at(base,r+.008,h*.55),bottle_cream,bevel=.002)
        text('Sake barrel brewery','MINATO',at(base,r+.010,h*.61),.035,M['red'],math.pi/2)
        text('Sake barrel type','SAKE',at(base,r+.010,h*.46),.032,bottle_ink,math.pi/2)

    # ---------------------------------------------------------------- furnishings and textiles
    for name in ('Stool cushion','Ramen stool top'):
        for item in take(name):
            p=item['at'];r=item['size'][0]/2;h=item['size'][1];base=at(p,0,-h/2)
            lathe('Tailored '+name,[(0,0),(r*.86,0),(r,.012),(r,h*.75),(r*.94,h),(0,h)],base,item['material'],20)
            ring('Stool cushion stitched welt',r*.973,.0025,at(base,0,h*.77),thread)
            for k in range(8):
                a=k*math.tau/8
                tube('Stool upholstery stitch',[at(base,math.cos(a)*r*.94,h*.83,math.sin(a)*r*.94),at(base,math.cos(a+.045)*r*.94,h*.83,math.sin(a+.045)*r*.94)],.0007,thread)
    for name in ('Booth seat','Bench cushion','Lounge seat'):
        items=[snap(o) for o in old(name)];inventory[name+' tailoring']=len(items)
        for item in items:
            p=item['at'];w,h,d=item['size'];y=p[1]+h/2-.008
            # Piping follows the rounded edge and remains just below the seat top.
            points=[(p[0]-w/2+.025,y,p[2]-d/2+.015),(p[0]+w/2-.025,y,p[2]-d/2+.015),
                    (p[0]+w/2-.015,y,p[2]+d/2-.025),(p[0]-w/2+.015,y,p[2]+d/2-.025),
                    (p[0]-w/2+.025,y,p[2]-d/2+.015)]
            tube('Seat upholstered piping',points,.003,thread)
            for j in range(1,4):
                x=p[0]-w/2+j*w/4
                tube('Cushion panel seam',[(x,p[1]+h*.47,p[2]-d*.38),(x,p[1]+h*.47,p[2]+d*.38)],.001,thread)
    for item in [snap(o) for o in old('Booth back')]:
        p=item['at'];w,h,d=item['size'];front=p[2]+(.071 if p[2]<2.2 else -.071)
        for j in range(1,8):
            x=p[0]-w/2+j*w/8
            tube('Booth diamond tuft seam',[(x-.07,p[1]-h*.28,front),(x+.035,p[1],front),(x-.07,p[1]+h*.28,front)],.0012,M['button'])
    inventory['Booth back tailoring']=len(old('Booth back'))
    for item in [snap(o) for o in old('Lounge back')]:
        p=item['at'];w,h,d=item['size'];x=p[0]+w/2+.001
        for z in (p[2]-d*.36,p[2]+d*.36):tube('Lounge back sewn seam',[(x,p[1]-h*.38,z),(x,p[1]+h*.38,z)],.0015,thread)
        tube('Lounge back top welt',[(x,p[1]+h*.40,p[2]-d*.41),(x,p[1]+h*.40,p[2]+d*.41)],.0025,thread)
    inventory['Lounge back tailoring']=len(old('Lounge back'))
    for item in [snap(o) for o in old('Tatami')]:
        p=item['at'];w,h,d=item['size'];y=p[1]+h/2+.0005
        for k in range(40):
            z=p[2]-d*.48+k*d*.96/39
            tube('Tatami woven rush',[(p[0]-w*.45,y,z),(p[0]+w*.45,y,z)],.00055,M['rope'] if k%6==0 else M['straw'])
    inventory['Tatami woven rush']=len(old('Tatami'))
    for item in [snap(o) for o in old('Zabuton')]:
        p=item['at'];w,h,d=item['size']
        for side in (-1,1):tube('Zabuton sewn edge',[(p[0]-w*.44,p[1]+h*.28,p[2]+side*d*.46),(p[0]+w*.44,p[1]+h*.28,p[2]+side*d*.46)],.0018,thread)
        ball('Zabuton centre stitch',(.008,.001,.008),at(p,0,h/2),M['heri'],8,4)
    inventory['Zabuton sewn edge']=len(old('Zabuton'))
    for name in ('Bar pendant shade','Enamel shade'):
        for item in take(name):
            p=item['at'];w,h,d=item['size'];base=at(p,0,-h/2);r=w/2
            lathe('Hollow '+name,[(r,0),(r*.72,h*.42),(r*.29,h),
                  (r*.23,h),(r*.68,h*.42),(r-.006,.004)],base,item['material'],20)
            ring('Lamp rolled shade lip',r-.003,.003,base,steel_edge)
    for name in ('Ramen noren','Noren panel'):
        for item in take(name):
            p=item['at'];w,h,d=item['size'];v=[]
            for row in range(7):
                for col in range(13):
                    x=(col/12-.5)*w;y=(row/6-.5)*h
                    v.append(at(p,x,y,math.sin(col*math.pi/2)*.004*(.45+row/6*.55)))
            faces=[(r*13+c,r*13+c+1,(r+1)*13+c+1,(r+1)*13+c) for r in range(6) for c in range(12)]
            mesh('Pleated '+name,v,faces,item['material'],True)
            tube('Noren stitched hem',[at(p,x,-h/2+.014,.004*math.sin((x/w+.5)*12*math.pi/2)) for x in (-w/2,-w/4,0,w/4,w/2)],.0015,thread)
    # Fish-case trim and irregular ice crystals sit in the original shallow case.
    ice_items=take('Neta case ice')
    for item in ice_items:
        p=item['at'];w,h,d=item['size']
        cube('Fish case chilled bed',(w,.014,d),at(p,0,-h/2+.007),M['ice'])
        for k in range(48):
            x=-w*.47+(k%24)*w*.94/23;z=-d*.32+(k//24)*d*.64
            o=ball('Crushed display ice',(.025,.012,.021),at(p,x,.009,z),M['ice'],6,4);o.rotation_euler.z=(k%5)*.3
    for x in (-3.71,-1.09):
        tube('Display case front upright',[(x,1.285,-2.475),(x,1.525,-2.475)],.008,steel_edge)
    tube('Display case glass lower track',[(-3.70,1.285,-2.473),(-1.10,1.285,-2.473)],.006,steel_edge)
    for x in (-2.95,-1.85):cube('Sliding glass finger pull',(.05,.017,.008),(x,1.40,-2.473),steel_edge,bevel=.004)
    # Street panes and scenic view are supplied by the runtime exploration module.
    # These remain physical carpentry, with no geometry inside the entry passage.
    remove(['Street window paper'])
    inventory['Street window opaque sheet removed']=1
    for x in (-4.975,-2.825):
        cube('Street window inset stile',(.023,1.06,.026),(x,1.72,6.231),M['smoke'],bevel=.003)
        cube('Street window metal catch',(.018,.052,.008),(x,1.61,6.207),M['brass'],bevel=.003)
        cyl('Street catch screw',.0022,.002,(x,1.62,6.201),dark,8,axis='z')
    cube('Street window worn sill',(2.34,.034,.13),(-3.9,1.152,6.22),M['honey'],bevel=.005)
    cube('Street window sliding runner',(2.21,.007,.022),(-3.9,1.174,6.21),M['smoke'])
    koagari=take('Koagari window paper')
    paper=mat('Layered shoji washi','c8bb99',.94)
    for item in koagari:
        p=item['at'];w,h,d=item['size']
        cube('Koagari washi layered paper',(w,h,d),p,paper)
        for k in range(30):
            z=p[2]-d*.48+k*d*.96/29
            tube('Shoji visible paper fibre',[(p[0]-.006,p[1]-h*.46,z),(p[0]-.006,p[1]+h*.46,z+.008)],.0005,cloth)
        for z in (p[2]-d/2+.07,p[2]+d/2-.07):
            cube('Shoji recessed finger pull',(.009,.078,.022),(p[0]-.032,p[1]-.08,z),dark,bevel=.007)
    cube('Entry header carved trim',(3.82,.065,.14),(0,2.41,6.23),M['honey'],bevel=.009)
    for side in (-1,1):
        cube('Entry frame inset stop',(.025,2.30,.055),(side*1.913,1.17,6.235),M['honey'],bevel=.003)
        for y in (.41,1.81):cyl('Entry frame brass fastener',.004,.003,(side*1.913,y,6.205),M['brass'],8,axis='z')
    inventory['Entry and window structural joinery']=3
    return inventory
