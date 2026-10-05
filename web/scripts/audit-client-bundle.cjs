/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CommonJS audit CLI */
/* Scan only assets delivered to browsers; server chunks legitimately reference server secrets. */
const fs=require("node:fs"),path=require("node:path");
const names=["SUPABASE_SERVICE_ROLE_KEY","RELAYER_PRIVATE_KEY","VERDICT_SIGNING_KEY","REGISTRY_PEPPER","RATE_LIMIT_PEPPER","LLM_API_KEY","OPENAI_API_KEY","ANTHROPIC_API_KEY","GEMINI_API_KEY","GUARDIAN_WEBHOOK_SECRET","TELEGRAM_BOT_TOKEN","DEMO_SHARED_PASSWORD"];
require("@next/env").loadEnvConfig(path.resolve(process.cwd(),".."));
const root=path.resolve(process.cwd(),".next/static");
if(!fs.existsSync(root))throw new Error("Build before running the client-bundle audit");
const needles=names.flatMap(name=>{const value=process.env[name];return [{label:name,text:name},...(value&&value.length>=8?[...new Set([value,encodeURIComponent(value),Buffer.from(value).toString("base64")])].map(text=>({label:name+" value",text})):[])];});
let files=0,failures=0;
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(fs.statSync(file).isDirectory())scan(file);else{files++;const data=fs.readFileSync(file).toString("utf8");for(const needle of needles)if(data.includes(needle.text)){failures++;console.error("Secret marker found:",needle.label,path.relative(root,file));}}}}
scan(root);
for(const name of names)if(process.env["NEXT_PUBLIC_"+name]){failures++;console.error("Forbidden public secret variable:","NEXT_PUBLIC_"+name);}
console.log(`Client bundle audit: ${files} files; ${failures} findings. Secret values are never printed.`);
if(failures)process.exitCode=1;


