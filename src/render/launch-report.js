/** Small local-only breadcrumb report. Never includes game saves or player content. */
export const LAUNCH_REPORT_KEY='johansson-loading-report-v1';
export function readLaunchReport(storage){try{return JSON.parse(storage?.getItem(LAUNCH_REPORT_KEY)||'null');}catch{return null;}}
export function createLaunchReport({storage,now=()=>Date.now(),events}={}){
 const previous=readLaunchReport(storage),report={version:1,build:'ios-full-cel-20261018',startedAt:now(),previousStage:(Array.isArray(previous?.events)?previous.events.at(-1)?.stage:null)||null,previousAttempts:[...(Array.isArray(previous?.previousAttempts)?previous.previousAttempts:[]),...(previous?[{startedAt:previous.startedAt,stage:(Array.isArray(previous.events)?previous.events.at(-1)?.stage:null)||'Unknown'}]:[])].slice(-4),events:[]};
 function stage(name,metrics){const allowed=new Set(['textures','geometries','programs','drawCalls','triangles','bufferWidth','bufferHeight']);const measured=Object.fromEntries(Object.entries(metrics||{}).filter(([key,value])=>allowed.has(key)&&Number.isFinite(value)));report.events.push({at:now(),stage:String(name).slice(0,240),...(Object.keys(measured).length?{metrics:measured}:{})});if(report.events.length>16)report.events.shift();try{storage?.setItem(LAUNCH_REPORT_KEY,JSON.stringify(report));}catch{}}
 const error=e=>stage('Error: '+(e.message||e.reason?.message||'Unhandled error'));
 const pagehide=()=>stage('Page left normally');
 events?.addEventListener?.('pagehide',pagehide);
 events?.addEventListener?.('error',error);events?.addEventListener?.('unhandledrejection',error);
 stage('Loading game code');
 return {stage,snapshot:()=>JSON.parse(JSON.stringify(report)),dispose(){events?.removeEventListener?.('pagehide',pagehide);events?.removeEventListener?.('error',error);events?.removeEventListener?.('unhandledrejection',error);}};
}
