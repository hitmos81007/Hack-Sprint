import { describe,it,expect,vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";
vi.mock("server-only",()=>({}));
import { contentSecurityPolicy,isSameOriginRequest } from "./security";
import { body,emptyQuery,failure,ApiError } from "./api";
import { middleware } from "../middleware";
const req=(headers:Record<string,string>={},method="POST")=>new Request("https://example.test/api/verify",{method,headers});
describe("HTTP security",()=>{
 it("accepts same-origin and anonymous CLI requests, rejects cross-site and ambiguous cookie writes",()=>{
  expect(isSameOriginRequest(req({origin:"https://example.test","sec-fetch-site":"same-origin"}))).toBe(true);
  expect(isSameOriginRequest(req())).toBe(true);
  expect(isSameOriginRequest(new Request("http://localhost:3010/api/verify",{method:"POST",headers:{host:"127.0.0.1:3010",origin:"http://127.0.0.1:3010"}}))).toBe(true);
  expect(isSameOriginRequest(req({host:"evil.test/path",origin:"https://evil.test"}))).toBe(false);
  for(const headers of ([{origin:"https://evil.test"},{origin:"null"},{"sec-fetch-site":"cross-site"},{"sec-fetch-site":"same-site"},{cookie:"session=test"}] as Record<string,string>[]))expect(isSameOriginRequest(req(headers))).toBe(false);
 });
 it("sets headers and rejects cross-origin APIs before auth or database work",async()=>{
  const response=await middleware(new NextRequest("https://example.test/api/verify",{method:"POST",headers:{origin:"https://evil.test"}}));
  expect(response.status).toBe(403);expect(await response.json()).toEqual({error:{code:"ORIGIN_FORBIDDEN"}});
  expect(response.headers.get("X-Frame-Options")).toBe("DENY");expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  expect((await middleware(new NextRequest("https://example.test/api/health",{method:"OPTIONS"}))).status).toBe(405);
 });
 it("production scripts require nonce and omit unsafe evaluation",()=>{
  const csp=contentSecurityPolicy("a".repeat(32));expect(csp).toContain("'nonce-"+"a".repeat(32)+"'");expect(csp).not.toContain("unsafe-eval");expect(csp.split(";").find(x=>x.includes("script-src"))).not.toContain("unsafe-inline");expect(()=>contentSecurityPolicy("'; evil")).toThrow();
 });
});
describe("request validation and error boundary",()=>{
 it("rejects unexpected query parameters, unknown JSON fields and invalid content types",async()=>{
  expect(()=>emptyQuery(new Request("https://example.test/?role=root"))).toThrow();
  const schema=z.object({name:z.string()}).strict();
  await expect(body(new Request("https://example.test/",{method:"POST",headers:{"content-type":"application/jsonbad"},body:'{}'}),schema)).rejects.toMatchObject({code:"JSON_REQUIRED"});
  await expect(body(new Request("https://example.test/",{method:"POST",headers:{"content-type":"application/json"},body:'{"name":"ok","role":"root"}'}),schema)).rejects.toMatchObject({code:"INVALID_INPUT"});
 });
 it("bounds streamed bodies even without Content-Length and rejects invalid UTF-8",async()=>{
  const schema=z.object({}).strict();
  await expect(body(new Request("https://example.test/",{method:"POST",headers:{"content-type":"application/json"},body:' '.repeat(100)}),schema,10)).rejects.toMatchObject({code:"INPUT_TOO_LARGE"});
  await expect(body(new Request("https://example.test/",{method:"POST",headers:{"content-type":"application/json"},body:new Uint8Array([255])}),schema)).rejects.toMatchObject({code:"INVALID_INPUT"});
 });
 it("never returns exception messages or stacks",async()=>{
  const response=failure(new Error("secret sentinel stack"));expect(await response.json()).toEqual({error:{code:"SERVICE_UNAVAILABLE"}});
  expect(await failure(new ApiError(400,"INVALID_INPUT")).json()).toEqual({error:{code:"INVALID_INPUT"}});
 });
});


