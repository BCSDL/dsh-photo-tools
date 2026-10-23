import {defineTool} from '@deepseek-ai/dsh-tools';
import fs from 'node:fs/promises';
import {isAbsolute,resolve,basename} from 'node:path';
import {dateWindow,sessionZone} from './shared/clock.js';
export {dateWindow,photoRequest,sessionZone} from './shared/clock.js';
export function registerPhotoTools(ctx,worker){
 ctx.effect(()=>ctx.tools.register(defineTool({name:'photo_catalog',
  description:'Read-only complete image inventory and visual review. scan {path,window:"recent_month"|"previous_month"|"all",recursive:false,dateBasis:"filename"}; never infer dates yourself. list {catalog,offset,limit}; sheet {catalog,offset} returns 12 actual thumbnails; inspect {catalog,ids:[1..3 real IDs]} returns larger actual images. review {catalog,reviews:[{id,score:0..10,reason:"specific visible evidence"}]} only after sheet/inspect. result {catalog,limit:3} returns persisted ranking, coverage and honest selectionLabel. All selection needs actual images, not filenames or bytes. Only claim a complete selection if eligibleForCompleteSelection=true; otherwise explicitly limit claims to reviewed candidates. No deletion/moving originals. Current date is sampled by the tool, not supplied by the model.',
  parameters:{operation:{type:'string',required:true},path:{type:'string'},catalog:{type:'string'},window:{type:'string'},recursive:{type:'boolean'},dateBasis:{type:'string'},offset:{type:'integer'},limit:{type:'integer'},ids:{type:'array',items:{type:'string'}},reviews:{type:'array',items:{type:'object',additionalProperties:false,properties:{id:{type:'string',required:true},score:{type:'number',required:true},reason:{type:'string',required:true}}}}},
  output:{schema:{type:'string'},render:(_args,value)=>JSON.parse(value).content},
  async execute(args,exec){
   exec.signal.throwIfAborted();if(!['scan','list','sheet','inspect','review','result'].includes(args.operation))throw Error('使用 scan/list/sheet/inspect/review/result');
   const cwd=exec.agent?.session?.header?.cwd||process.cwd(),input={...args,scope:resolve(cwd)};
   if(args.operation==='scan'){
    if(!args.path)throw Error('scan 需要实际目录 path');input.path=isAbsolute(args.path)?args.path:resolve(cwd,args.path);
    if(!['filename','mtime'].includes(args.dateBasis||'filename'))throw Error('dateBasis 只能是 filename 或 mtime；mtime 不代表拍摄时间');
    input.window=dateWindow(args.window||'all',new Date(),sessionZone(exec.agent));input.now=input.window.asOf;
   }
   const result=await worker.call('photo_evidence',{...input,action:args.operation},exec.signal);exec.signal.throwIfAborted();
   const images=[];
   if(result.imagePaths?.length){
    const store=ctx.get('attachments');if(!store)throw Error('缺少图片附件服务，未登记已看图');
    for(const path of result.imagePaths){const attachment=await store.saveImage({data:await fs.readFile(path),mediaType:'image/jpeg',name:basename(path)});images.push({type:'image',attachment});}
    exec.signal.throwIfAborted();await worker.call('photo_evidence',{action:'delivered',catalog:args.catalog,scope:resolve(cwd),ids:result.items.map(x=>x.id),viewKind:args.operation},exec.signal);
    result.imagesReturned=images.length;
   }
   return JSON.stringify({content:[{type:'text',text:JSON.stringify(result)},...images]});
  }
 })),'photo inventory and evidence');
}
