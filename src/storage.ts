export interface NumberStorage { read():number; write(value:number):void }
export function bestHeightStorage(storage:Pick<Storage,'getItem'|'setItem'>|null,key='ragdoll-best-height'):NumberStorage{
  let fallback=0;return{read(){try{const value=Number(storage?.getItem(key));return Number.isFinite(value)&&value>0?value:fallback;}catch{return fallback;}},write(value){fallback=Math.max(fallback,value);try{storage?.setItem(key,String(fallback));}catch{/* private/blocked storage: memory remains valid */}}};
}
