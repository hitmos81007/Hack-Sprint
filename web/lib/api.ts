import "server-only";
import { AuthError } from "./auth-policy";
import { authErrorResponse } from "./auth";
import { ChainError } from "./chain";
import { z } from "zod";
export class ApiError extends Error {
  constructor(public status:number,public code:string,public transactionHash?:string){super(code);}
}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});}
export function emptyQuery(request?:Request){
  if(request&&!z.object({}).strict().safeParse(Object.fromEntries(new URL(request.url).searchParams)).success)throw new ApiError(400,"INVALID_INPUT");
}
export async function body<T>(request:Request,schema:z.ZodType<T>,maxLength=16000):Promise<T>{
  emptyQuery(request);
  if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json")throw new ApiError(415,"JSON_REQUIRED");
  const length=request.headers.get("content-length");
  if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxLength))throw new ApiError(413,"INPUT_TOO_LARGE");
  const reader=request.body?.getReader();if(!reader)throw new ApiError(400,"INVALID_INPUT");
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>maxLength){await reader.cancel();throw new ApiError(413,"INPUT_TOO_LARGE");}chunks.push(chunk.value);}}
  catch(error){if(error instanceof ApiError)throw error;throw new ApiError(400,"INVALID_INPUT");}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return schema.parse(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)));}catch{throw new ApiError(400,"INVALID_INPUT");}
}
export function failure(error:unknown){
  if(error instanceof AuthError)return authErrorResponse(error);
  if(error instanceof ApiError)return json({error:{code:error.code,...(error.transactionHash?{transactionHash:error.transactionHash}:{})}},error.status);
  if(error instanceof ChainError)return json({error:{code:error.code,...(error.transactionHash?{transactionHash:error.transactionHash}:{})}},503);
  return json({error:{code:"SERVICE_UNAVAILABLE"}},503);
}
export function dbError(error:{code?:string}|null){if(!error)return;if(error.code==="23505")throw new ApiError(409,"ALREADY_EXISTS");if(error.code==="P0001")throw new ApiError(409,"CONFLICT");throw new ApiError(503,"DATABASE_UNAVAILABLE");}
export function uuid(value:string){const result=z.string().uuid().safeParse(value);if(!result.success)throw new ApiError(400,"INVALID_INPUT");return result.data;}
