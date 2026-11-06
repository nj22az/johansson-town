"""Fit the two user-supplied rooms without re-exporting their original textures.

Requires NumPy. Usage: python tools/pack-supplied-rooms.py --office OFFICE.glb --ramen RAMEN.glb
Input hashes guard the documented orientation, material repairs and collision fit.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import struct

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'office': ('40d33b4523b5d4bd18c5a3496dc0d0947df72198ce3d15789e27c0976887a4a7', 1, math.pi, .01),
    'ramen': ('50d3b047317db89944b52142251de61b13e06ce45433d1966d2de901205c797a', 5, math.pi / 2, .0045),
}
DTYPES = {5120: 'i1', 5121: 'u1', 5122: '<i2', 5123: '<u2', 5125: '<u4', 5126: '<f4'}
WIDTHS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def node_matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix']).reshape(4, 4).T
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    result = np.eye(4)
    result[:3, :3] = [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                      [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                      [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]]
    result[:3, :3] @= np.diag(node.get('scale', [1, 1, 1]))
    result[:3, 3] = node.get('translation', [0, 0, 0])
    return result


def pack(kind, source):
    original = source.read_bytes()
    expected, scale, angle, floor = SOURCES[kind]
    if hashlib.sha256(original).hexdigest() != expected:
        raise ValueError(f'{kind}: input differs from the supplied model')
    length = struct.unpack_from('<I', original, 12)[0]
    src = json.loads(original[20:20+length])
    binary = original[28+length:]

    def read_accessor(index):
        a = src['accessors'][index]
        v = src['bufferViews'][a['bufferView']]
        dtype = np.dtype(DTYPES[a['componentType']])
        width = WIDTHS[a['type']]
        return np.ndarray((a['count'], width), dtype=dtype, buffer=binary,
                          offset=v.get('byteOffset', 0)+a.get('byteOffset', 0),
                          strides=(v.get('byteStride', width*dtype.itemsize), dtype.itemsize)).copy()

    result = {'asset': {**copy.deepcopy(src['asset']), 'generator': 'Johansson Town supplied-room packer'},
              'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [],
              'accessors': [], 'bufferViews': [], 'images': [],
              'textures': copy.deepcopy(src.get('textures', [])),
              'samplers': copy.deepcopy(src.get('samplers', [])),
              'extensionsUsed': ['KHR_materials_unlit']}
    if 'KHR_texture_transform' in src.get('extensionsUsed', []):
        result['extensionsUsed'].append('KHR_texture_transform')
    output = bytearray()

    def view(data, target=None):
        output.extend(b'\0' * (-len(output) % 4))
        record = {'buffer': 0, 'byteOffset': len(output), 'byteLength': len(data)}
        if target:
            record['target'] = target
        result['bufferViews'].append(record)
        output.extend(data)
        return len(result['bufferViews'])-1

    def accessor(values, attribute):
        values = np.ascontiguousarray(values)
        record = {'bufferView': view(values.tobytes(), 34963 if attribute == 'indices' else 34962),
                  'componentType': 5126 if values.dtype.kind == 'f' else (5123 if values.dtype.itemsize == 2 else 5125),
                  'count': len(values), 'type': {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4'}[values.shape[1]]}
        if attribute == 'POSITION':
            record.update(min=values.min(axis=0).tolist(), max=values.max(axis=0).tolist())
        result['accessors'].append(record)
        return len(result['accessors'])-1

    for image in src.get('images', []):
        v = src['bufferViews'][image['bufferView']]
        payload = binary[v.get('byteOffset', 0):v.get('byteOffset', 0)+v['byteLength']]
        result['images'].append({**image, 'bufferView': view(payload)})

    fit = np.array([[math.cos(angle)*scale, 0, math.sin(angle)*scale, 0],
                    [0, scale, 0, floor], [-math.sin(angle)*scale, 0, math.cos(angle)*scale, 0], [0, 0, 0, 1]])
    groups, seen, removed = {}, set(), 0

    def visit(index, parent):
        nonlocal removed
        node = src['nodes'][index]
        world = parent @ node_matrix(node)
        if 'mesh' in node:
            for primitive in src['meshes'][node['mesh']]['primitives']:
                assert primitive.get('mode', 4) == 4
                attrs = {name: read_accessor(a).astype('<f4') for name, a in primitive['attributes'].items()}
                attrs['POSITION'] = (np.c_[attrs['POSITION'], np.ones(len(attrs['POSITION']))] @ world.T)[:, :3].astype('<f4')
                if 'NORMAL' in attrs:
                    normals = attrs['NORMAL'] @ np.linalg.inv(world[:3, :3])
                    attrs['NORMAL'] = (normals / np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-12)).astype('<f4')
                indices = read_accessor(primitive['indices']).astype('<u4')
                material = copy.deepcopy(src['materials'][primitive['material']])
                name = material.pop('name', kind)
                extensions = material.pop('extensions', {})
                legacy = extensions.get('KHR_materials_pbrSpecularGlossiness')
                if legacy:
                    pbr = {'baseColorFactor': legacy.get('diffuseFactor', [1, 1, 1, 1])}
                    if 'diffuseTexture' in legacy:
                        pbr['baseColorTexture'] = legacy['diffuseTexture']
                    material['pbrMetallicRoughness'] = pbr
                material.setdefault('pbrMetallicRoughness', {}).update(metallicFactor=0, roughnessFactor=1)
                # These retro textures and vertex colours already contain their lighting.
                material['extensions'] = {'KHR_materials_unlit': {}}
                material.pop('emissiveFactor', None)
                material.pop('emissiveTexture', None)
                if 'COLOR_0' in attrs and attrs['COLOR_0'].shape[1] == 4 and attrs['COLOR_0'][:, 3].min() < .999:
                    material['alphaMode'] = 'BLEND'
                material_key = json.dumps(material, sort_keys=True)
                digest = hashlib.sha256(material_key.encode())
                for attribute, values in sorted(attrs.items()):
                    digest.update(attribute.encode())
                    digest.update(np.round(values, 6).tobytes())
                digest.update(indices.tobytes())
                if digest.digest() in seen:
                    removed += 1
                    continue
                seen.add(digest.digest())
                key = (material_key, tuple(sorted(attrs)))
                if key not in groups:
                    groups[key] = {'material': {**material, 'name': name}, 'attrs': [], 'indices': [], 'vertices': 0}
                group = groups[key]
                group['attrs'].append(attrs)
                group['indices'].append(indices+group['vertices'])
                group['vertices'] += len(attrs['POSITION'])
        for child in node.get('children', []):
            visit(child, world)

    for index in src['scenes'][src.get('scene', 0)]['nodes']:
        visit(index, fit)
    positions, triangles = [], 0
    for group in groups.values():
        attrs = {k: np.concatenate([a[k] for a in group['attrs']]) for k in group['attrs'][0]}
        indices = np.concatenate(group['indices']).astype('<u2' if group['vertices'] < 65536 else '<u4')
        positions.append(attrs['POSITION'])
        triangles += len(indices)//3
        result['materials'].append(group['material'])
        result['meshes'].append({'primitives': [{'attributes': {k: accessor(v, k) for k, v in attrs.items()},
                                                'indices': accessor(indices, 'indices'), 'material': len(result['materials'])-1}]})
        result['scenes'][0]['nodes'].append(len(result['nodes']))
        result['nodes'].append({'name': f'{kind}:{group["material"]["name"]}', 'mesh': len(result['meshes'])-1})
    result['buffers'] = [{'byteLength': len(output)}]
    header = json.dumps(result, separators=(',', ':')).encode()
    header += b' ' * (-len(header) % 4)
    output.extend(b'\0' * (-len(output) % 4))
    packed = struct.pack('<III', 0x46546c67, 2, 28+len(header)+len(output)) + struct.pack('<II', len(header), 0x4e4f534a) + header + struct.pack('<II', len(output), 0x004e4942) + output
    folder = ROOT/'assets/models'/kind
    folder.mkdir(parents=True, exist_ok=True)
    filename = 'office-interior.glb' if kind == 'office' else 'ramen-restaurant.glb'
    (folder/filename).write_bytes(packed)
    positions = np.concatenate(positions)
    manifest = {'file': filename, 'sourceFile': source.name, 'sourceSHA256': expected,
                'sourceMetadata': src['asset'].get('extras', {}), 'sha256': hashlib.sha256(packed).hexdigest(),
                'bytes': len(packed), 'triangles': triangles, 'draws': len(groups), 'removedDuplicatePrimitives': removed,
                'bounds': {'min': positions.min(axis=0).tolist(), 'max': positions.max(axis=0).tolist()},
                'fit': {'scale': scale, 'rotationY': angle, 'floorOffset': floor},
                'changes': ['Baked source hierarchy and room orientation into vertices',
                            'Merged primitives sharing material and vertex attributes',
                            'Preserved embedded textures, UV transforms and vertex colours',
                            'Unlit materials preserve baked lighting; vertex alpha restores office shadow overlays',
                            'Converted legacy specular/glossiness diffuse textures to core glTF base colour']}
    (folder/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps({k: manifest[k] for k in ['file', 'bytes', 'triangles', 'draws', 'removedDuplicatePrimitives', 'bounds']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for kind in SOURCES:
        parser.add_argument('--'+kind, type=Path)
    args = parser.parse_args()
    for kind in SOURCES:
        if getattr(args, kind):
            pack(kind, getattr(args, kind))
