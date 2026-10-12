import {Pool} from "pg";
import type {PoolConfig} from "pg";
/** No configured URL means no connection, never default OS/PG administrator access. */
export function createConfiguredPool(config:PoolConfig):Pool {
 let configured=false;
 try {const url=new URL(config.connectionString||"");configured=['postgres:','postgresql:'].includes(url.protocol)&&Boolean(url.hostname&&url.pathname.length>1&&url.username);}catch{}
 if(!configured){const user=process.env.PGUSER||process.env.PG_USER||process.env.POSTGRES_USER||process.env.DB_USER;configured=Boolean(user&&config.user===user&&config.host&&config.database&&config.password);}
 const pool=new Pool(config);
 return new Proxy(pool,{get(target,key){const value=Reflect.get(target,key,target);if(key==='query'||key==='connect')return (...args:unknown[])=>{if(!configured)throw new Error("Database connection is not explicitly configured");return Reflect.apply(value,target,args);};return typeof value==='function'?value.bind(target):value;}});
}
