import test from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {comparePng,comparisonReport} from '../tools/visual-compare.mjs';

function png(width=4,height=3,edits=[]){
 const image=new PNG({width,height});image.data.fill(255);
 for(const [x,y,colour=[0,0,0,255]] of edits)image.data.set(colour,(y*width+x)*4);
 return PNG.sync.write(image);
}

test('identical PNGs pass strict comparison and produce an empty difference mask',()=>{
 const bytes=png(),result=comparePng(bytes,bytes);
 assert.equal(result.passed,true);assert.equal(result.status,'passed');assert.equal(result.metrics.diffPixels,0);assert.equal(result.metrics.diffRatio,0);assert.equal(result.bounds,null);
 const diff=PNG.sync.read(result.diffPNG);assert.equal(diff.width,4);assert.ok(diff.data.every(value=>value===0));
});
test('one changed geometry pixel fails default tolerances and locates its diff artifact',()=>{
 const result=comparePng(png(4,3,[[2,1]]),png(),{actualPath:'capture.png',baselinePath:'baseline.png',diffPath:'diff.png'});
 assert.equal(result.passed,false);assert.equal(result.status,'failed');assert.equal(result.metrics.diffPixels,1);assert.equal(result.metrics.diffRatio,1/12);
 assert.deepEqual(result.bounds,{minX:2,minY:1,maxX:2,maxY:1,width:1,height:1});
 assert.deepEqual(result.artifacts,{actual:'capture.png',baseline:'baseline.png',diff:'diff.png'});
 const diff=PNG.sync.read(result.diffPNG);assert.deepEqual([...diff.data.subarray((1*4+2)*4,(1*4+2)*4+4)],[255,0,0,255]);
 const report=comparisonReport(result);assert.equal(report.diffPNG,undefined);assert.equal(report.diffGenerated,true);assert.equal(report.diffBytes,result.diffPNG.length);assert.doesNotThrow(()=>JSON.stringify(report));
});
test('pixel and ratio budgets both apply and retain exact metrics when a difference is allowed',()=>{
 const actual=png(4,3,[[2,1]]),baseline=png();
 assert.equal(comparePng(actual,baseline,{maxDiffPixels:1,maxDiffRatio:.09}).passed,true);
 assert.equal(comparePng(actual,baseline,{maxDiffPixels:1,maxDiffRatio:.08}).passed,false);
 assert.equal(comparePng(actual,baseline,{maxDiffPixels:0,maxDiffRatio:1}).passed,false);
});
test('colour-distance threshold is configurable without weakening the pixel budgets',()=>{
 const actual=png(4,3,[[1,1,[254,254,254,255]]]),baseline=png();
 assert.equal(comparePng(actual,baseline,{threshold:0}).metrics.diffPixels,1);
 assert.equal(comparePng(actual,baseline,{threshold:.05}).metrics.diffPixels,0);
});
test('dimension and missing/invalid baseline errors can never count as a pass',()=>{
 const mismatch=comparePng(png(5,3),png());assert.equal(mismatch.passed,false);assert.equal(mismatch.error.code,'DIMENSION_MISMATCH');assert.deepEqual(mismatch.error.actual,{width:5,height:3});assert.deepEqual(mismatch.error.baseline,{width:4,height:3});assert.equal(mismatch.diffGenerated,false);assert.equal(mismatch.diffPNG,undefined);
 for(const [actual,baseline,code] of [[png(),undefined,'BASELINE_MISSING'],[png(),Buffer.alloc(0),'BASELINE_MISSING'],[png(),Buffer.from('oops'),'BASELINE_INVALID'],[undefined,png(),'CAPTURE_MISSING'],[Buffer.from('oops'),png(),'CAPTURE_INVALID']]){
  const result=comparePng(actual,baseline,{maxDiffPixels:999,maxDiffRatio:1,diffPath:'diff.png'});assert.equal(result.status,'error');assert.equal(result.passed,false);assert.equal(result.error.code,code);assert.equal(result.artifacts.diff,null);assert.equal(result.diffGenerated,false);
 }
});
test('invalid tolerances are rejected instead of producing a misleading result',()=>{
 for(const options of [{threshold:NaN},{threshold:1.1},{maxDiffRatio:-.1},{maxDiffRatio:Infinity},{maxDiffPixels:-1},{maxDiffPixels:1.5},{includeAA:'false'}])assert.throws(()=>comparePng(png(),png(),options),TypeError);
});
test('difference bounding box spans separate changed regions without modifying caller input',()=>{
 const actual=png(4,3,[[0,0],[3,2]]),baseline=png(),copy=Buffer.from(actual),baseCopy=Buffer.from(baseline),result=comparePng(actual,baseline);
 assert.equal(result.metrics.diffPixels,2);assert.deepEqual(result.bounds,{minX:0,minY:0,maxX:3,maxY:2,width:4,height:3});assert.deepEqual(actual,copy);assert.deepEqual(baseline,baseCopy);
});
