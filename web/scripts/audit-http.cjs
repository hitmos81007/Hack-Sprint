/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node HTTP audit CLI */
const assert=require("node:assert/strict");
(async()=>{
 const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3010";
 const first=await fetch(base+"/demo"),html=await first.text(),csp=first.headers.get("content-security-policy");
 assert.equal(first.status,200);assert.equal(first.headers.get("x-frame-options"),"DENY");assert.equal(first.headers.get("referrer-policy"),"no-referrer");assert.equal(first.headers.get("x-content-type-options"),"nosniff");assert.equal(first.headers.get("x-powered-by"),null);
 const nonce=csp.match(/'nonce-([^']+)'/)[1],scripts=[...html.matchAll(/<script\b([^>]*)>/g)];assert(scripts.length>0);for(const script of scripts)assert(script[1].includes('nonce="'+nonce+'"'));
 assert.notEqual((await fetch(base+"/demo")).headers.get("content-security-policy"),csp);
 const blocked=await fetch(base+"/api/verify",{method:"POST",headers:{Origin:"https://evil.invalid","Content-Type":"application/json"},body:"{}"});assert.equal(blocked.status,403);assert.deepEqual(await blocked.json(),{error:{code:"ORIGIN_FORBIDDEN"}});assert.equal(blocked.headers.get("access-control-allow-origin"),null);
 const options=await fetch(base+"/api/challenge",{method:"OPTIONS",headers:{Origin:new URL(base).origin}});assert.equal(options.status,405);
 const badQuery=await fetch(base+"/api/health?debug=1");assert.equal(badQuery.status,400);assert.deepEqual(await badQuery.json(),{error:{code:"INVALID_INPUT"}});
 const asset=html.match(/src="([^\"]*\/_next\/static\/[^\"]+)"/)[1],chunk=await fetch(new URL(asset,base));assert.equal(chunk.headers.get("x-frame-options"),"DENY");assert.equal(chunk.headers.get("referrer-policy"),"no-referrer");
 console.log(JSON.stringify({page:first.status,nonceScriptCount:scripts.length,freshNonce:true,crossOrigin:blocked.status,preflight:options.status,invalidQuery:badQuery.status,staticHeaders:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
