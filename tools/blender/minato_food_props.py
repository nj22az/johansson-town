"""Recognizable food shapes in the existing restaurant placements, in metres."""
import math
import random


def upgrade_food_props(api):
    old, remove, snapshot = (api[k] for k in ('old', 'remove', 'snapshot'))
    cube, cyl, ball, ring, tube = (api[k] for k in ('cube', 'cyl', 'ball', 'ring', 'tube'))
    M, mat = api['M'], api['mat']
    cream = mat('Fish fat and daikon fibres', 'eadcc1', .57)
    skin = mat('Fish silver skin', '859393', .4)
    roast = mat('Yakitori char', '493025', .7)
    seed = mat('Konnyaku flecks', '615d4b', .78)
    pod_dark = mat('Edamame seam', '65713d', .65)
    pork_fat = mat('Chashu fat', 'dcc69d', .6)
    yolk = mat('Ajitama yolk', 'dc9e2c', .45)
    inventory = {}
    rng = random.Random(19971005)

    def shift(p, dx=0, dy=0, dz=0):
        return p[0]+dx, p[1]+dy, p[2]+dz

    def family(name, draw):
        items = [snapshot(o) for o in old(name)]
        remove([name])
        for n, item in enumerate(items):
            draw(item, n)
        inventory[name] = len(items)

    def fillet(item, n):
        p, s, m = item['at'], item['size'], item['material']
        # Rounded flesh tapers at both ends; details follow the actual meat kind.
        if m == M['shrimp']:
            for j in range(5):
                a = -.6+j*.27
                q = shift(p, math.sin(a)*s[0]*.32, .004, (j-2)*s[2]*.15)
                ball('Real shrimp segment', (s[0]*.14, s[1]*.46, s[2]*.2), q, m, 12, 8)
                tube('Shrimp white joint', [shift(q,-s[0]*.12,.012,-.006),shift(q,0,.022,0),shift(q,s[0]*.12,.012,.006)], .0018, cream)
            for dx in (-.012,.012):
                ball('Shrimp tail fan', (.016,.005,.025), shift(p,dx,.004,s[2]*.46), m, 10, 6)
            return
        ball('Real fish cut', (s[0]*.5,s[1]*.48,s[2]*.49), p, m, 16, 8)
        if m == M['whitefish']:
            ball('Whitefish skin edge', (s[0]*.44,.003,s[2]*.10),shift(p,0,-s[1]*.34,-s[2]*.34),skin,12,6)
        for j in range(4 if m == M['salmon'] else 2):
            dx=(j-1.5)*s[0]*.21
            tube('Fish grain', [shift(p,dx-s[0]*.07,s[1]*.25,-s[2]*.35),shift(p,dx,s[1]*.48,0),shift(p,dx+s[0]*.07,s[1]*.25,s[2]*.35)], .0018 if m == M['salmon'] else .0009, cream)

    family('Fish on ice', fillet)
    family('Sashimi', fillet)

    def yakitori(item,n):
        p,s=item['at'],item['size']
        ball('Real grilled chicken', (s[0]*.52,s[1]*.5,s[2]*.51),p,M['glaze'],10,6)
        for k in range(2):
            cube('Chicken grill mark', (s[0]*.68,.0015,.003),shift(p,0,s[1]*.46,(k-.5)*s[2]*.3),roast,rot=.25+(.13*(n%3)))
        ball('Chicken caramelised edge', (s[0]*.29,.003,s[2]*.18),shift(p,s[0]*.12,s[1]*.46,-s[2]*.1),M['brown'],8,4)
    family('Yakitori', yakitori)

    def edamame(item,n):
        p=item['at']; yaw=item['yaw']
        for j in range(3):
            off=(j-1)*.014
            ball('Real edamame lobe', (.012,.009,.008),shift(p,math.cos(yaw)*off,0,math.sin(yaw)*off),M['edamame'],10,6)
        tube('Edamame pod seam',[shift(p,math.cos(yaw)*t,.007,math.sin(yaw)*t+.003) for t in (-.024,-.012,0,.012,.024)],.001,pod_dark)
        for t in (-.025,.025):ball('Edamame tip',(.005,.004,.004),shift(p,math.cos(yaw)*t,0,math.sin(yaw)*t),pod_dark,8,4)
    family('Edamame pod',edamame)

    def daikon(item,n):
        p=item['at'];cyl('Real simmered daikon',.045,.035,p,M['daikon'],20)
        for r in (.022,.034):ring('Daikon fibre ring',r,.0008,shift(p,0,.018,0),cream)
        for j in range(5):
            a=j*math.tau/5
            tube('Daikon fibres',[shift(p,math.cos(a)*r,.0185,math.sin(a)*r) for r in (.003,.017,.035)],.0005,cream)
    family('Oden daikon',daikon)
    family('Oden egg',lambda item,n:ball('Real oden egg',(.03,.024,.032),item['at'],M['egg'],16,10))

    def konnyaku(item,n):
        p=item['at'];s=item['size'];bpy=api['bpy']
        # A triangular cut, with a speckled surface, rather than a grey building block.
        v=[(-s[0]/2,-s[2]/2), (s[0]/2,-s[2]/2),(0,s[2]/2)]
        verts=[api['loc'](shift(p,x,y,z)) for y in (-s[1]/2,s[1]/2) for x,z in v]
        mesh=bpy.data.meshes.new('Konnyaku triangle');mesh.from_pydata(verts,[],[(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]);mesh.materials.append(M['konnyaku'])
        o=bpy.data.objects.new('Real konnyaku triangle',mesh);bpy.context.collection.objects.link(o)
        for j in range(9):
            x=rng.uniform(-.019,.019);z=rng.uniform(-.018,.006)
            ball('Konnyaku fleck',(.0009,.0005,.0007),shift(p,x,s[1]/2+.0005,z),seed,6,4)
    family('Oden konnyaku',konnyaku)

    def chashu(item,n):
        p=item['at'];cyl('Real chashu slice',.045,.011,p,M['chashu'],20)
        points=[]
        for i in range(40):
            a=i/39*math.tau*1.65;r=.004+i/39*.033
            points.append(shift(p,math.cos(a)*r,.0065,math.sin(a)*r))
        tube('Chashu rolled fat',points,.0025,pork_fat)
        ring('Chashu roast edge',.044,.0015,shift(p,0,.006,0),roast)
    family('Chashu slice',chashu)

    def nori(item,n):
        p,s=item['at'],item['size'];bpy=api['bpy'];verts=[]
        for row in range(4):
            for col in range(4):
                x=(col/3-.5)*s[0];z=(row/3-.5)*s[2]
                verts.append(api['loc'](shift(p,x,math.sin(col*2+row)*.0017,z)))
        faces=[(r*4+c,r*4+c+1,(r+1)*4+c+1,(r+1)*4+c) for r in range(3) for c in range(3)]
        mesh=bpy.data.meshes.new('Nori rippled surface');mesh.from_pydata(verts,[],faces);mesh.materials.append(M['nori'])
        o=bpy.data.objects.new('Real nori sheet',mesh);bpy.context.collection.objects.link(o)
        for j in range(5):cube('Nori texture',(.01,.0007,.005),shift(p,rng.uniform(-.028,.028),.002,rng.uniform(-.04,.04)),pod_dark,rot=j*.4)
    family('Nori sheet',nori)

    def egg(item,n):
        p=item['at'];ball('Real ajitama half',(.03,.019,.035),shift(p,0,-.005,0),M['egg'],16,8)
        cyl('Ajitama cut white',.028,.002,shift(p,0,.010,0),cream,20)
        cyl('Ajitama orange yolk',.016,.002,shift(p,0,.012,0),yolk,18)
        ball('Ajitama soft yolk',(.011,.0015,.011),shift(p,0,.013,0),yolk,12,6)
    family('Ajitama',egg)

    def topping(item,n):
        p=item['at'];m=item['material']
        if m==M['negi']:
            for j in range(8):
                q=shift(p,(j%4-1.5)*.019,.002,(j//4-.5)*.026)
                ring('Real sliced negi',.008,.002,q,M['negi'])
                ring('Negi pale centre',.0038,.0012,q,cream)
        else:
            for j in range(4):
                q=shift(p,(j-1.5)*.022,0,0)
                cube('Real menma strip',(.017,.011,.049),q,M['menma'],rot=.06*(j%2),bevel=.003)
                cube('Menma fibre',(.001,.001,.042),shift(q,.003,.006,0),cream)
    family('Topping',topping)
    family('Sliced negi',lambda item,n: (ring('Real prep negi ring',.012,.003,item['at'],M['negi']),ring('Prep negi inner ring',.006,.0015,item['at'],cream)))
    return inventory
