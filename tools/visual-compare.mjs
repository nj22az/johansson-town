import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';

const DEFAULTS=Object.freeze({threshold:.05,includeAA:true,maxDiffPixels:0,maxDiffRatio:0});
const pathOrNull=value=>typeof value==='string'&&value.length?value:null;

function tolerances(options){
 const limits={...DEFAULTS};
 for(const key of Object.keys(DEFAULTS))if(options[key]!==undefined)limits[key]=options[key];
 for(const key of ['threshold','maxDiffRatio'])if(!Number.isFinite(limits[key])||limits[key]<0||limits[key]>1)throw new TypeError(key+' must be a finite number from 0 to 1');
 if(!Number.isSafeInteger(limits.maxDiffPixels)||limits.maxDiffPixels<0)throw new TypeError('maxDiffPixels must be a non-negative safe integer');
 if(typeof limits.includeAA!=='boolean')throw new TypeError('includeAA must be a boolean');
 return limits;
}

/**
 * Compare PNG bytes without reading/writing files or updating a baseline.
 * Both pixel-count and ratio budgets must pass. Defaults allow no changed pixels;
 * includeAA=true counts antialiased edges so small geometry faults are not hidden.
 * threshold is pixelmatch's perceptual colour-distance threshold, from 0 to 1.
 * The returned diffPNG is a transparent red difference mask. The caller owns
 * writing it to diffPath; a path here is metadata, never proof a file was written.
 */
export function comparePng(actualBytes,baselineBytes,options={}){
 const limits=tolerances(options),artifacts={actual:pathOrNull(options.actualPath),baseline:pathOrNull(options.baselinePath),diff:null};
 const error=(code,message,extra={})=>({passed:false,status:'error',error:{code,message,...extra},limits,metrics:null,bounds:null,artifacts,diffGenerated:false});
 if(!(baselineBytes instanceof Uint8Array)||baselineBytes.length===0)return error('BASELINE_MISSING','An existing baseline PNG is required.');
 if(!(actualBytes instanceof Uint8Array)||actualBytes.length===0)return error('CAPTURE_MISSING','A captured PNG is required.');
 let actual,baseline;
 try{baseline=PNG.sync.read(Buffer.from(baselineBytes));}catch{return error('BASELINE_INVALID','The baseline is not a valid PNG.');}
 try{actual=PNG.sync.read(Buffer.from(actualBytes));}catch{return error('CAPTURE_INVALID','The capture is not a valid PNG.');}
 if(actual.width!==baseline.width||actual.height!==baseline.height)return error('DIMENSION_MISMATCH','Capture and baseline dimensions must match.',{actual:{width:actual.width,height:actual.height},baseline:{width:baseline.width,height:baseline.height}});
 const {width,height}=actual,totalPixels=width*height,diff=new PNG({width,height});
 const diffPixels=pixelmatch(baseline.data,actual.data,diff.data,width,height,{threshold:limits.threshold,includeAA:limits.includeAA,diffMask:true,diffColor:[255,0,0],diffColorAlt:[255,0,0]});
 const diffRatio=diffPixels/totalPixels,passed=diffPixels<=limits.maxDiffPixels&&diffRatio<=limits.maxDiffRatio;
 let bounds=null;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(diff.data[(y*width+x)*4+3]){
  if(!bounds)bounds={minX:x,minY:y,maxX:x,maxY:y};
  else {bounds.minX=Math.min(bounds.minX,x);bounds.minY=Math.min(bounds.minY,y);bounds.maxX=Math.max(bounds.maxX,x);bounds.maxY=Math.max(bounds.maxY,y);}
 }
 if(bounds){bounds.width=bounds.maxX-bounds.minX+1;bounds.height=bounds.maxY-bounds.minY+1;}
 const metrics={width,height,totalPixels,diffPixels,diffRatio};
 return {passed,status:passed?'passed':'failed',limits,metrics,bounds,artifacts:{...artifacts,diff:pathOrNull(options.diffPath)},diffGenerated:true,diffPNG:PNG.sync.write(diff)};
}

/** A JSON-ready report without embedding the binary PNG in logs or manifests. */
export function comparisonReport(result){
 const {diffPNG,...report}=result;
 return {...report,diffBytes:diffPNG?.length||0};
}

export {DEFAULTS as VISUAL_TOLERANCES};
