import z from '@deepseek-ai/schemastery';import {homedir} from 'node:os';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
import {PythonWorker} from './shared/python-worker.js';import {registerPhotoTools} from './photo-tools.js';
export const name='photo-tools';export const inject=['tools','attachments'];
export const Config=z.object({pythonExecutable:z.string().default(''),dataDirectory:z.string().default('')});
export function apply(ctx,config){
 const runtime=join(homedir(),'.local-ai-tools','photo-tools');
 const resolved={...config,pythonExecutable:config.pythonExecutable||join(runtime,process.platform==='win32'?'Scripts/python.exe':'bin/python'),dataDirectory:config.dataDirectory||join(process.env.DSH_HOME||join(homedir(),'.dsh'),'photo-tools')};
 const worker=new PythonWorker(resolved,fileURLToPath(new URL('../backend/worker.py',import.meta.url)));
 registerPhotoTools(ctx,worker);ctx.on('dispose',()=>worker.close());
 ctx.inject(['systemPrompt'],scope=>scope.effect(()=>scope.systemPrompt.section({name:'photo-tools',order:945,interpolate:false,text:'图片评选用 photo_catalog scan 完整枚举并计算日期，sheet 分页交付实际缩略图，review 保存可见评语，inspect 核对最终候选，result 返回覆盖范围。只看过部分就明确候选范围，不能假称全库最佳。工具不会修改原图；日期默认来自文件名。'}),'photo guidance'));
}
