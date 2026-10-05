import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseConfig } from "./lib/supabase/config";
import { assertRole, AuthError, rolesForPath } from "./lib/auth-policy";
import { readIdentity } from "./lib/session";
import { contentSecurityPolicy,isSameOriginRequest,securityHeaders } from "./lib/security";
export async function middleware(request: NextRequest) {
  const nonce=btoa(crypto.randomUUID());
  const policy=contentSecurityPolicy(nonce,process.env.NODE_ENV==="development");
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set("x-nonce",nonce);requestHeaders.set("Content-Security-Policy",policy);
  function secure(value:NextResponse){
    Object.entries(securityHeaders).forEach(([key,header])=>value.headers.set(key,header));
    value.headers.set("Content-Security-Policy",policy);
    if(request.nextUrl.protocol==="https:")value.headers.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
    return value;
  }
  let response=NextResponse.next({request:{headers:requestHeaders}});
  if(request.nextUrl.pathname.startsWith("/api/")){
    if(!isSameOriginRequest(request))return secure(NextResponse.json({error:{code:"ORIGIN_FORBIDDEN"}},{status:403,headers:{"Cache-Control":"private, no-store"}}));
    if(request.method==="OPTIONS")return secure(NextResponse.json({error:{code:"METHOD_NOT_ALLOWED"}},{status:405}));
    return secure(response);
  }
  const required=rolesForPath(request.nextUrl.pathname);
  const config=publicSupabaseConfig();
  const redirectToLogin=(reason?:string)=>{
    const url=request.nextUrl.clone();url.pathname="/login";url.search=reason?`?error=${reason}`:"";
    const redirect=NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control","private, no-store");return secure(redirect);
  };
  if(!config)return required?redirectToLogin("unavailable"):secure(response);
  try{
    const client=createServerClient(config.url,config.key,{cookies:{
      getAll:()=>request.cookies.getAll(),
      setAll(values,headers){
        values.forEach(({name,value})=>request.cookies.set(name,value));
        requestHeaders.set("cookie",request.headers.get("cookie")??"");
        const previous=response.cookies.getAll();response=NextResponse.next({request:{headers:requestHeaders}});
        previous.forEach(cookie=>response.cookies.set(cookie));
        values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
        Object.entries(headers).forEach(([key,value])=>response.headers.set(key,value));
        response.headers.set("Cache-Control","private, no-store");
      },
    }});
    if(required)assertRole(await readIdentity(client),required);else await client.auth.getUser();
    response.headers.set("Cache-Control","private, no-store");return secure(response);
  }catch(error){
    if(!required)return secure(response);
    return redirectToLogin(error instanceof AuthError&&error.status===401?undefined:error instanceof AuthError&&error.status===403?"forbidden":"unavailable");
  }
}
export const config={matcher:["/api/:path*","/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
