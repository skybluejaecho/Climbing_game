import {describe,expect,it} from 'vitest';
import {bestHeightStorage} from './storage';
describe('best height storage boundary',()=>{it('persists through the narrow adapter and survives storage errors',()=>{const values=new Map<string,string>(),good=bestHeightStorage({getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v)}} as Storage);good.write(42);expect(good.read()).toBe(42);const blocked=bestHeightStorage({getItem(){throw Error()},setItem(){throw Error()}} as unknown as Storage);blocked.write(17);expect(blocked.read()).toBe(17);});});
