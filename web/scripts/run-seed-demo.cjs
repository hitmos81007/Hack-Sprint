/* eslint-disable @typescript-eslint/no-require-imports -- Minimal TypeScript CLI loader; no extra runtime dependency. */
try {
  const p = require.resolve("server-only");
  require.cache[p] = { id: p, filename: p, loaded: true, exports: {} };
} catch {}
const ts=require("typescript"),fs=require("node:fs"),path=require("node:path");
require("@next/env").loadEnvConfig(path.resolve(__dirname,"../.."));
require.extensions[".ts"]=(module,filename)=>{const output=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});module._compile(output.outputText,filename);};
require("./seed-demo.ts").main().catch(()=>{console.error("Demo seed failed. Check isolated-project opt-in, migrations, PUBLIC fixture and testnet configuration. No credentials or private keys are printed.");process.exitCode=1;});
