import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createSteamedBunGeometry} from '../src/world/interiors/steamed-bun.js';
import {createResidentProp} from '../src/people/resident-props.js';

test('the same palm-sized pleated bao is used on shelves, trays and in hands',()=>{
 const bun=createSteamedBunGeometry(),held=createResidentProp('bun');bun.computeBoundingBox();held.geometry.computeBoundingBox();
 assert.ok(bun.boundingBox.getSize(new T.Vector3()).x<.112);assert.ok(bun.boundingBox.getSize(new T.Vector3()).y<.075);
 assert.deepEqual(bun.boundingBox,held.geometry.boundingBox);assert.ok(held.geometry.attributes.position.count>500,'Folded crown, rather than a round placeholder');
});
