"""Bake the approved CAD studies into three opaque, indexed game LODs.

Run from johansson-town/: python3 tools/build-tree-designs.py
The game consumes this exact CAD geometry, not a hand-copied second set of trees.
"""
from pathlib import Path
import json,base64,struct,numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/qa/island-trees-2026-10-25/build_cad.py'
FAMILIES=['broadleaf','fukugi','banyan','pine','palm','pandanus','banana']
models={};cadModels=[];cadSpecs=None;cadScope=None
for level,rows,cols,leafRows,leafAcross,sides in [('near',12,24,8,2,9),('mid',8,16,5,2,7),('far',4,8,2,2,5)]:
    # Use the same authored surfaces and branch endpoints, only fewer samples.
    source=SOURCE.read_text().replace('rows=16,cols=32','rows='+str(rows)+',cols='+str(cols)).replace('rows=14;across=6','rows='+str(leafRows)+';across='+str(leafAcross)).replace("color='#886345',sides=9","color='#886345',sides="+str(sides))
    # Keep the banyan's hanging roots inside the existing 1.9 m park root enclosure.
    # Their tops remain within the substantial first branch, not attached to empty canopy.
    source=source.replace("[[end[0]*.63,3.05,end[2]*.63],[end[0]*.66,1.5,end[2]*.66],[end[0]*.7,0,end[2]*.7]]","[[math.cos(a)*.65,2.52,math.sin(a)*.51],[math.cos(a)*.7,1.3,math.sin(a)*.58],[math.cos(a)*.72,0,math.sin(a)*.64]]")
    if level=='mid':source=source.replace('np.linspace(0,1,19)','np.linspace(0,1,11)').replace("color='#a48b63',sides=10","color='#a48b63',sides=8")
    if level=='far':source=source.replace('np.linspace(0,1,19)','np.linspace(0,1,5)').replace("color='#a48b63',sides=10","color='#a48b63',sides=6").replace('rows=8,cols=12','rows=4,cols=6').replace('for i in range(4):m.crown','for i in range(0):m.crown')
    scope={'__file__':str(SOURCE),'__name__':'tree_cad_source'};exec(compile(source,str(SOURCE),'exec'),scope)
    for family,spec in zip(FAMILIES,scope['SPECS']):
        # Broad banana blades merit an extra transverse sample; do not spend six
        # strips across every narrow palm/pandanus blade as the offline CAD does.
        if family=='banana' and level=='near':
            bananaSource=source.replace('rows=8;across=2','rows=10;across=4');bananaScope={'__file__':str(SOURCE),'__name__':'tree_cad_source'};exec(compile(bananaSource,str(SOURCE),'exec'),bananaScope);maker=bananaScope['make_tree']
        else:maker=scope['make_tree']
        tree=maker(spec);groups={}
        if level=='near':cadModels.append(tree);cadSpecs=scope['SPECS'];cadScope=scope
        for part in tree.parts:
            key=(part['kind'],tuple(part['color']))
            group=groups.setdefault(key,dict(v=[],f=[],count=0))
            group['v'].extend(part['v']);group['f'].extend(part['f']+group['count']);group['count']+=len(part['v'])
        data=bytearray();parts=[]
        for (kind,color),group in groups.items():
            v=np.asarray(group['v'],dtype='<f4');f=np.asarray(group['f'],dtype=int)
            normals=scope['normals'](v.astype(float),f)
            while len(data)%4:data.append(0)
            pos=len(data);data.extend(v.tobytes());normal=len(data);data.extend(normals.tobytes());index=len(data);data.extend(f.astype('<u2').tobytes())
            rgb=np.array(color);rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*rgb**(1/2.4)-.055);rgb=np.round(rgb*255).astype(int)
            parts.append(dict(kind=kind,color=int(rgb[0])*65536+int(rgb[1])*256+int(rgb[2]),position=pos,normal=normal,index=index,vertices=len(v),indices=f.size))
        v,f,_=tree.arrays();bounds=dict(min=v.min(0).tolist(),max=v.max(0).tolist())
        record=models.setdefault(family,dict(height=spec['h'],width=spec['w'],depth=spec['d'],cad=spec['id'],levels={}))
        record['levels'][level]=dict(parts=parts,data=base64.b64encode(data).decode(),triangles=len(f),bounds=bounds)
cad=ROOT/'docs/qa/island-trees-2026-10-25/implementation';cad.mkdir(parents=True,exist_ok=True)
audit=cadScope['build_dxf'](cadModels,cadSpecs,cad/'Island_Trees_CAD_Rev_A1.dxf')
(cad/'geometry-a1.json').write_text(json.dumps({'revision':'A1','rootAmendment':'Aerial roots moved inboard onto the first substantial banyan limbs; game sites also apply a radial root limit.','dxfAudit':audit,'families':{k:{'cad':v['cad'],'height':v['height'],'width':v['width'],'depth':v['depth'],'levels':{l:{'triangles':r['triangles'],'bounds':r['bounds']} for l,r in v['levels'].items()}} for k,v in models.items()}},indent=2)+'\n')
# Readable vector elevation generated from the same corrected mesh, before it is baked for World.
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="480" viewBox="0 0 1400 480"><rect width="1400" height="480" fill="#f5f2e9"/><g font-family="sans-serif" fill="#203d39"><text x="20" y="30" font-size="20">ISLAND TREES / A1 IMPLEMENTATION CAD</text><text x="20" y="52" font-size="12">Corrected geometry; native DXF in millimetres. Cherry retained. No new planting positions.</text></g>']
for i,(tree,spec) in enumerate(zip(cadModels,cadSpecs)):
    ox=100+i*195;k=30
    for kind,color in [('bark','#8b6d4d'),('foliage','#94b77b')]:
        for p in cadScope['outlines'](tree,(0,1),kind):svg.append('<polygon fill="'+color+'" stroke="#203d39" stroke-width="0.8" points="'+' '.join(f'{ox+x*k:.2f},{350-y*k:.2f}' for x,y in p)+'"/>')
    svg.append(f'<text x="{ox-82}" y="390" font-family="sans-serif" font-size="12" fill="#203d39">{spec["id"]} {spec["name"]}</text><text x="{ox-82}" y="411" font-family="sans-serif" font-size="11" fill="#60716a">H {spec["h"]:.1f} / W {spec["w"]:.2f} m</text>')
svg.append('</svg>');(cad/'tree-elevations-a1.svg').write_text(''.join(svg))
out=ROOT/'src/world/tree-design-data.js'
out.write_text('// Generated by tools/build-tree-designs.py from the dimensioned CAD studies. Metres.\nexport const TREE_DESIGN_DATA='+json.dumps(dict(revision='A1',models=models),separators=(',',':'))+';\n')
print(json.dumps({name:{lod:v['triangles'] for lod,v in m['levels'].items()} for name,m in models.items()},indent=2));print('Bytes:',out.stat().st_size)
