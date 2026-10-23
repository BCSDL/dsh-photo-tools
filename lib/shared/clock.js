export function dateWindow(kind='all',now=new Date(),timeZone='Europe/London'){
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 if(kind==='all')return {kind,start:null,end:null,timeZone,asOf:now.toISOString()};
 if(!['recent_month','previous_month'].includes(kind))throw Error('window 只支持 all/recent_month/previous_month');
 const[y,m,d]=today.split('-').map(Number),last=new Date(Date.UTC(y,m-1,0)),py=last.getUTCFullYear(),pm=last.getUTCMonth()+1;
 const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 return {kind,start:iso(py,pm,kind==='previous_month'?1:Math.min(d,last.getUTCDate())),
  end:kind==='previous_month'?iso(py,pm,last.getUTCDate()):today,timeZone,asOf:now.toISOString(),semantics:'inclusive local calendar dates'};
}
export function photoRequest(text){
 if(!/照片|图片|截图|photos?|images?|screenshots?/i.test(text))return null;
 const quoted=/["“`]([a-z]:[\\/][^"”`\r\n]+)["”`]/i.exec(text);
 const plain=/([a-z]:[\\/][^\r\n]*?)(?=(?:中|里|内)(?:寻找|查找|挑选|找|选)|\s+(?:中|里|内)?(?:寻找|查找|挑选|找|选)|[，,。；;]|$)/i.exec(text);
 const path=(quoted?.[1]||plain?.[1])?.trim();if(!path)return null;
 return {path,window:/最近\s*(?:1|一|一个)?\s*月|最近\s*(?:1|一|一个)\s*个月|近一个月|last\s+month|past\s+month/i.test(text)?'recent_month':/上个月|上一月|previous month/i.test(text)?'previous_month':'all'};
}
export function sessionZone(agent){
 const events=agent?.session?.snapshotEvents?.()||[];
 return [...events].reverse().find(x=>x.type==='user/message'&&x.data?.source?.kind==='user')?.data?.source?.clientTimeZone||'Europe/London';
}
