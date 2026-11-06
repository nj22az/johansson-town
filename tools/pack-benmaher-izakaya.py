"""Prepare the owner-supplied BenMaher izakaya; requires NumPy and Pillow.

python tools/pack-benmaher-izakaya.py /path/to/izakaya_-_low_poly_building.glb
Preserves all building triangles, PBR channels, neon emission and alpha cutouts.
"""
import copy
import hashlib
import importlib.util
from io import BytesIO
import json
from pathlib import Path
import struct
import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA = '4a8439abe2d73182544f735073dd48521b358f1ec2bd67cd730d4e745c2debf9'
spec = importlib.util.spec_from_file_location('room_packer', ROOT/'tools/pack-supplied-rooms.py')
room_packer = importlib.util.module_from_spec(spec)
sys.dont_write_bytecode = True
spec.loader.exec_module(room_packer)


def pack(path):
    original = path.read_bytes()
    assert hashlib.sha256(original).hexdigest() == SOURCE_SHA, 'Use the supplied BenMaher model; the fit is specific to it'
    length = struct.unpack_from('<I', original, 12)[0]
    source = json.loads(original[20:20+length])
    binary = original[28+length:]
    result = {'asset': {**source['asset'], 'generator': 'Johansson Town BenMaher packer'},
              'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [],
              'materials': [], 'textures': [], 'images': [], 'samplers': copy.deepcopy(source['samplers']),
              'accessors': [], 'bufferViews': []}
    output = bytearray()

    def view(data, target=None):
        output.extend(b'\0'*(-len(output) % 4))
        record = {'buffer': 0, 'byteOffset': len(output), 'byteLength': len(data)}
        if target:
            record['target'] = target
        result['bufferViews'].append(record)
        output.extend(data)
        return len(result['bufferViews'])-1

    def read(index):
        a = source['accessors'][index]
        v = source['bufferViews'][a['bufferView']]
        dtype = np.dtype(room_packer.DTYPES[a['componentType']])
        width = room_packer.WIDTHS[a['type']]
        return np.ndarray((a['count'], width), dtype=dtype, buffer=binary,
                          offset=v.get('byteOffset', 0)+a.get('byteOffset', 0),
                          strides=(v.get('byteStride', width*dtype.itemsize), dtype.itemsize)).copy()

    images = []
    image_receipts = []
    for image in source['images']:
        v = source['bufferViews'][image['bufferView']]
        raw = binary[v.get('byteOffset', 0):v.get('byteOffset', 0)+v['byteLength']]
        images.append(Image.open(BytesIO(raw)))
        image_receipts.append({'sourceSHA256': hashlib.sha256(raw).hexdigest(), 'sourceSize': list(images[-1].size)})

    def texture(image, limit, alpha=False):
        im = image.convert('RGBA' if alpha else 'RGB')
        im.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        stream = BytesIO()
        if alpha:
            im.save(stream, format='PNG', optimize=True)
        else:
            im.save(stream, format='JPEG', quality=89, subsampling=0, optimize=True)
        raw = stream.getvalue()
        result['images'].append({'bufferView': view(raw), 'mimeType': 'image/png' if alpha else 'image/jpeg'})
        result['textures'].append({'source': len(result['images'])-1, 'sampler': source['textures'][0].get('sampler', 0)})
        return len(result['textures'])-1

    # Source texture slots: base colour, packed AO/roughness/metalness, emission, normal.
    for i, image in enumerate(images):
        texture(image, 2048 if i == 0 else 1024)
    material = copy.deepcopy(source['materials'][0])
    material['alphaMode'] = 'OPAQUE'
    material['doubleSided'] = False
    material['name'] = 'BenMaher building PBR'
    material['emissiveFactor'] = [.65, .65, .65]
    result['materials'].append(material)
    # Front door (source +X) becomes local +Z; the town rotates it to face the lane.
    scale = .009
    fit = np.array([[0, 0, -scale, -180.2277*scale],
                    [0, scale, 0, 0], [scale, 0, 0, 4.05-287.97575*scale], [0, 0, 0, 1]])
    groups = [{'name': 'BenMaher izakaya', 'material': 0, 'attrs': [], 'indices': [], 'count': 0}]
    parts = []

    def visit(index, parent):
        node = source['nodes'][index]
        matrix = parent @ room_packer.node_matrix(node)
        if 'mesh' in node and node.get('name') != 'Floor__0':
            for primitive in source['meshes'][node['mesh']]['primitives']:
                assert primitive.get('mode', 4) == 4
                attrs = {k: read(v).astype('<f4') for k, v in primitive['attributes'].items() if k != 'TANGENT'}
                attrs['POSITION'] = (np.c_[attrs['POSITION'], np.ones(len(attrs['POSITION']))] @ matrix.T)[:, :3].astype('<f4')
                normals = attrs['NORMAL'] @ np.linalg.inv(matrix[:3, :3])
                attrs['NORMAL'] = (normals/np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-12)).astype('<f4')
                indices = read(primitive['indices']).astype('<u4')
                p = attrs['POSITION']
                parts.append({'name': node['name'], 'min': p.min(axis=0).tolist(), 'max': p.max(axis=0).tolist(), 'triangles': len(indices)//3})
                group = groups[0]
                if node['name'] in ['Wires__0', 'Cloth__0']:
                    # Small RGBA crops keep these cutouts sharp without a second full atlas.
                    uv = attrs['TEXCOORD_0']
                    dimensions = np.array(images[0].size)
                    low = np.maximum(0, np.floor(uv.min(axis=0)*dimensions).astype(int)-3)
                    high = np.minimum(dimensions, np.ceil(uv.max(axis=0)*dimensions).astype(int)+3)
                    cropped = images[0].crop((*low, *high))
                    cutout = copy.deepcopy(material)
                    cutout.update(name=node['name'], alphaMode='MASK', alphaCutoff=.4, doubleSided=True)
                    cutout['pbrMetallicRoughness']['baseColorTexture'] = {'index': texture(cropped, 768, alpha=True), 'texCoord': 1}
                    attrs['TEXCOORD_1'] = ((uv*dimensions-low)/(high-low)).astype('<f4')
                    result['materials'].append(cutout)
                    group = {'name': node['name'], 'material': len(result['materials'])-1, 'attrs': [], 'indices': [], 'count': 0}
                    groups.append(group)
                group['attrs'].append(attrs)
                group['indices'].append(indices+group['count'])
                group['count'] += len(p)
        for child in node.get('children', []):
            visit(child, matrix)

    for index in source['scenes'][source.get('scene', 0)]['nodes']:
        visit(index, fit)

    def accessor(values, name):
        values = np.ascontiguousarray(values)
        a = {'bufferView': view(values.tobytes(), 34963 if name == 'indices' else 34962),
             'componentType': 5123 if name == 'indices' else 5126, 'count': len(values),
             'type': {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4'}[values.shape[1]]}
        if name == 'POSITION':
            a.update(min=values.min(axis=0).tolist(), max=values.max(axis=0).tolist())
        result['accessors'].append(a)
        return len(result['accessors'])-1

    for group in groups:
        attributes = {k: accessor(np.concatenate([a[k] for a in group['attrs']]), k) for k in group['attrs'][0]}
        assert group['count'] < 65536
        indices = accessor(np.concatenate(group['indices']).astype('<u2'), 'indices')
        result['meshes'].append({'primitives': [{'attributes': attributes, 'indices': indices, 'material': group['material']}]})
        result['nodes'].append({'name': group['name'], 'mesh': len(result['meshes'])-1})
        result['scenes'][0]['nodes'].append(len(result['nodes'])-1)

    result['buffers'] = [{'byteLength': len(output)}]
    header = json.dumps(result, separators=(',', ':')).encode()
    header += b' '*(-len(header) % 4)
    output.extend(b'\0'*(-len(output) % 4))
    packed = struct.pack('<III', 0x46546c67, 2, 28+len(header)+len(output)) + struct.pack('<II', len(header), 0x4e4f534a) + header + struct.pack('<II', len(output), 0x004e4942) + output
    folder = ROOT/'assets/models/izakaya'
    destination = folder/'minato-benmaher-exterior.glb'
    destination.write_bytes(packed)
    manifest = {'file': destination.name, 'sourceFile': path.name, 'sourceSHA256': SOURCE_SHA,
                'sourceBytes': len(original), 'sourceMetadata': source['asset']['extras'],
                'sha256': hashlib.sha256(packed).hexdigest(), 'bytes': len(packed),
                'triangles': sum(p['triangles'] for p in parts), 'draws': len(groups),
                'bounds': {'min': np.min([p['min'] for p in parts], axis=0).tolist(), 'max': np.max([p['max'] for p in parts], axis=0).tolist()},
                'fit': {'scale': scale, 'rotationY': -np.pi/2, 'doorCentre': [0, 1.66, 4.05]},
                'changes': ['Removed the two-triangle presentation ground plane', 'Retained all 2446 building triangles',
                            'Merged opaque geometry; alpha-tested wire and cloth crops retain cutouts',
                            'Re-encoded base colour at 2048px and PBR/emission maps at 1024px',
                            'Retained original neon colours at 65% emission strength', 'Fitted door to the existing Minato entrance'],
                'sourceImages': image_receipts, 'parts': parts}
    (folder/'benmaher-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps({k: manifest[k] for k in ['file', 'bytes', 'triangles', 'draws', 'bounds']}))


if __name__ == '__main__':
    pack(Path(sys.argv[1]))
