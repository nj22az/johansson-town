"""Reopen the native study and independently inspect its export and fit keys."""
import argparse
import json
import math
import sys
from collections import Counter
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

parser=argparse.ArgumentParser()
parser.add_argument('directory')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
directory=Path(args.directory)
bpy.ops.wm.open_mainfile(filepath=str(directory/'Vy-skirt-study.blend'))
skirt=bpy.data.objects['Skirt — front, back and side panel cage']
band=bpy.data.objects['Waistband — separate fitted construction']
checks={}
checks['native_source_labelled_and_hidden']=all(o.hide_render for o in bpy.data.collections['01 SUPPLIED REFERENCE — static, unrigged'].objects)
checks['distinct_band_and_panel_cages']=len(skirt.data.polygons)==768 and len(band.data.polygons)==192
checks['six_editable_fit_keys']=len(skirt.data.shape_keys.key_blocks)==7
checks['finite_key_coordinates']=all(math.isfinite(v) for obj in [skirt,band] for key in obj.data.shape_keys.key_blocks for p in key.data for v in p.co)
checks['all_quad_cages']=all(len(p.vertices)==4 for obj in [skirt,band] for p in obj.data.polygons)
checks['uv_per_corner']=all(len(obj.data.uv_layers.active.data)==len(obj.data.loops) for obj in [skirt,band])
for name in ['Waist width','Hip width','Seat depth','Front ease','Length','Hem flare']:
    key=skirt.data.shape_keys.key_blocks[name]
    key.value=.75
    bpy.context.view_layer.update()
    checks['band_follows_'+name]=abs(band.data.shape_keys.key_blocks[name].value-.75)<1e-6
    key.value=0
bpy.context.view_layer.update()
native_checks=dict(checks)
measurements=json.loads((directory/'reference-measurements.json').read_text())
reference=bpy.data.objects['SUPPLIED skirt surface crop — bounded colour selection']
ref_tree=BVHTree.FromObject(reference,bpy.context.evaluated_depsgraph_get())
study_tree=BVHTree.FromObject(skirt,bpy.context.evaluated_depsgraph_get())
errors=[]
misses=0
# Independent angular samples were not used to construct the four cardinal
# profiles. This measures rest-surface discrepancy only, not aesthetic quality.
for row in measurements['cardinal_measurements'][2:]:
    for i in range(128):
        angle=(i+.5)*2*math.pi/128
        d=Vector((math.sin(angle),-math.cos(angle),0))
        origin=Vector((0,row['centre_y'],row['z']))+d*.34
        a=ref_tree.ray_cast(origin,-d,.4)[0]
        b=study_tree.ray_cast(origin,-d,.4)[0]
        if a is None or b is None:
            misses+=1
        else:
            errors.append((a-b).length)
errors.sort()
surface={'sample_count':len(errors),'missing_samples':misses,'mean_source_units':sum(errors)/len(errors),
         'p95_source_units':errors[int(.95*(len(errors)-1))],'maximum_source_units':max(errors),
         'scope':'Eight cross-sections below the band, 128 offset angles each. Crop holes/artefacts affect results. No hem/band or animation acceptance.'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(directory/'Vy-skirt-rest.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
checks['export_contains_only_two_authored_parts']=len(objects)==2 and all('rest export' in o.name for o in objects)
triangle_count=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
checks['rest_export_under_8000_triangles']=triangle_count<8000
checks['export_finite']=all(math.isfinite(v) for o in objects for p in o.data.vertices for v in p.co)
checks['export_no_armature_or_animation']=not any(o.type=='ARMATURE' for o in bpy.context.scene.objects) and not bpy.data.actions
# glTF duplicates vertices at UV seams; weld position keys for an actual closed
# shell check rather than treating an intentional UV split as an open edge.
shells=[]
for o in objects:
    positions=[tuple(v for v in p.co) for p in o.data.vertices]
    counts=Counter()
    for p in o.data.polygons:
        ids=list(p.vertices)
        for a,b in zip(ids,ids[1:]+ids[:1]):
            pa,pb=positions[a],positions[b]
            if pa!=pb: counts[tuple(sorted((pa,pb)))]+=1
    shells.append({'object':o.name,'edges':len(counts),'non_two_face_edges':sum(v!=2 for v in counts.values())})
checks['closed_export_shells']=all(s['non_two_face_edges']==0 for s in shells)
report={'checks':checks,'passed':sum(checks.values()),'total':len(checks),'triangles':triangle_count,'shells':shells,'rest_surface_comparison':surface,
        'limits':'Rest-mesh and native-data checks only; no skinning, collision, cloth simulation, pose acceptance or visual approval.'}
(directory/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print('VERIFICATION',json.dumps(report),flush=True)
if not all(checks.values()):
    raise RuntimeError('Study verification failed')
