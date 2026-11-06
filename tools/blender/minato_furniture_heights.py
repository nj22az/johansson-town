"""Apply the game's furniture standards to the authored furniture before finish batching.

Bodies scale vertically from their floor. Tabletop props translate by the surface
change and retain their proportions. Floorboards, kitchen equipment and koagari
platforms retain their authored elevations. Runtime dressings use the same standards.
"""
import re
from mathutils import Vector

def apply_furniture_heights(bpy, root):
    bpy.context.view_layer.update()
    text=(root/'src/world/furniture-standards.js').read_text()
    heights={k:float(re.search(r'\b'+k+r':([.\d]+)',text).group(1)) for k in ('seat','table','serviceCounter','till')}
    report={'heights':heights,'scaled':0,'translated':0,'families':{}}
    for obj in [o for o in bpy.context.scene.objects if o.type=='MESH']:
        family=re.sub(r'\.\d+$','',obj.name)
        vertices=[obj.matrix_world@v.co for v in obj.data.vertices]
        if not vertices:continue
        # Blender Z is game Y; Blender -Y is game Z.
        lo=[min(v[i] for v in vertices) for i in range(3)];hi=[max(v[i] for v in vertices) for i in range(3)]
        x=(lo[0]+hi[0])/2;y=(lo[2]+hi[2])/2;z=-(lo[1]+hi[1])/2
        scale=1.;offset=0.
        main_counter=(family.startswith(('Counter carcass','Counter front slat','Counter kick','Guest ledge','Counter arm-rail','Arm-rail bracket','Foot rail','Ramen counter carcass','Ramen guest ledge')))
        if main_counter:
            scale=heights['serviceCounter']/1.11
        elif family.startswith(('Serving shelf','Ramen serving shelf')):
            offset=heights['serviceCounter']-1.28
        elif -5.12<x<3.5 and -2.78<z<-1.86 and lo[2]>1.04 and hi[2]<1.75:
            # Both the ledge props and the raised shelf props keep their real support.
            offset=heights['serviceCounter']-(1.28 if z< -2.48 else 1.11)
        elif 6.55<x<10.35 and -2.48<z<-1.86 and lo[2]>1.04 and hi[2]<1.75:
            offset=heights['serviceCounter']-1.11
        elif family.startswith(('Stool','Tailored Stool','Ramen stool','Tailored Ramen stool','Ramen foot ring')):
            source=.735 if z>-.5 else .76 if x>6.5 else .71
            scale=heights['seat']/source
        elif family.startswith(('Booth plinth','Booth seat','Booth back','Booth top rail','Tuft button','Booth diamond')):
            scale=heights['seat']/.565
        elif family.startswith(('Seat upholstered piping','Cushion panel seam')):
            scale=heights['seat']/(.565 if x< -2 and z<3.6 else .56)
        elif family.startswith(('Bench cushion','Bench board','Bench support')):
            scale=heights['seat']/.56
        elif family.startswith(('Table top','Table apron','Table leg')):
            scale=heights['table']/.945
        elif ((-4.9<x<-2.1 and 1.40<z<3.0) or (1.20<x<4.0 and 1.20<z<2.80)) and lo[2]>.91 and hi[2]<1.5:
            offset=heights['table']-.945
        elif family.startswith(('Wall ledge','Ledge bracket')):
            scale=heights['serviceCounter']/1.075
        elif family.startswith(('Lounge seat','Lounge back','Lounge plinth','Lounge piping','Lounge foot')) or (-6.1<x<-5.2 and 3.70<z<5.5 and hi[2]<1.4 and lo[2]>.2):
            scale=heights['seat']/.56
        elif family.startswith(('Lounge table','Walnut lounge table')):
            scale=heights['table']/.7475
        elif -4.95<x<-4.25 and 3.75<z<5.4 and lo[2]>.72 and hi[2]<1.2:
            offset=heights['table']-.7475
        elif family.startswith(('Ramen corner table','Corner table leg')):
            scale=heights['table']/.785
        elif family.startswith('Corner chair'):
            scale=heights['seat']/.495
        elif 6.94<x<8.36 and .55<z<1.75 and lo[2]>.77 and hi[2]<1.3:
            offset=heights['table']-.785
        if scale==1. and offset==0.:continue
        inverse=obj.matrix_world.inverted()
        for vertex,world in zip(obj.data.vertices,vertices):
            world.z=world.z*scale+offset;vertex.co=inverse@world
        obj.data.update()
        report['scaled' if scale!=1. else 'translated']+=1
        report['families'][family]=report['families'].get(family,0)+1
    return report
