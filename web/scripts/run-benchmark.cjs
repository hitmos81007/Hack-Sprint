/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS compiler hook for the benchmark. */
// Use the existing TypeScript compiler; no additional runtime dependency is needed.
try {
  const p = require.resolve("server-only");
  require.cache[p] = { id: p, filename: p, loaded: true, exports: {} };
} catch {}
const ts = require("typescript");
const fs = require("node:fs");
require.extensions[".ts"] = (module, filename) => {
 const source = fs.readFileSync(filename, "utf8");
 const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}});
 module._compile(output.outputText, filename);
};
require("./benchmark.ts").main().catch(() => {console.error("Benchmark failed; check provider/model configuration.");process.exitCode=1;});
