import { z } from "zod";
export const securityHeaders: Record<string,string> = {
  "X-Frame-Options":"DENY", "Referrer-Policy":"no-referrer", "X-Content-Type-Options":"nosniff",
  "Permissions-Policy":"camera=(self), microphone=(self), geolocation=(), payment=()",
  "Cross-Origin-Resource-Policy":"same-origin",
};
export function contentSecurityPolicy(nonce:string, development=false) {
  if(!/^[A-Za-z0-9+/=_-]{16,128}$/.test(nonce)) throw new Error("INVALID_NONCE");
  const connections=["'self'"];
  const config=z.string().url().safeParse(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if(config.success){const url=new URL(config.data);if(url.protocol==="https:"||(development&&url.protocol==="http:")){connections.push(url.origin,url.origin.replace(/^http/,"ws"));}}
  if(development) connections.push("ws://localhost:*","ws://127.0.0.1:*");
  return [`default-src 'self'`,`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development?" 'unsafe-eval'":""}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data: blob:","font-src 'self'","media-src 'self' blob:","worker-src 'self' blob:",`connect-src ${connections.join(" ")}`,"frame-ancestors 'none'","object-src 'none'","base-uri 'self'","form-action 'self'"].join("; ");
}
export function isSameOriginRequest(request:Request){
  const site=request.headers.get("sec-fetch-site");
  if(site&&site!=="same-origin"&&site!=="none")return false;
  const url=new URL(request.url);
  const host=request.headers.get("host");
  if(host){try{const publicURL=new URL(url.protocol+"//"+host);if(publicURL.host!==host.toLowerCase()||publicURL.username||publicURL.password||publicURL.pathname!=="/")return false;url.host=publicURL.host;}catch{return false;}}
  const origin=request.headers.get("origin");
  if(origin){const parsed=z.string().url().safeParse(origin);if(!parsed.success||new URL(parsed.data).origin!==url.origin)return false;}
  if(!["GET","HEAD","OPTIONS"].includes(request.method)&&request.headers.has("cookie")&&!origin&&site!=="same-origin")return false;
  return true;
}

