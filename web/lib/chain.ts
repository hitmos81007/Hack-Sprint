import "server-only";
import { Contract, FetchRequest, Interface, JsonRpcProvider, Wallet, getAddress, isAddress, isError, keccak256, toUtf8Bytes, ZeroAddress, ZeroHash } from "ethers";
import { z } from "zod";
import deployment from "./contract.json";

const abi = new Interface(deployment.abi);
const messages = {
  CONFIG: "Configure RPC_URL, CHAIN_ID and a deployed REGISTRY_ADDRESS.",
  INVALID_INPUT: "Provide a valid address, nonzero bytes32 hash, or bounded institution metadata.",
  WRONG_CHAIN: "RPC chain does not match CHAIN_ID.",
  NOT_DEPLOYED: "No registry contract exists at the configured address on this chain.",
  NOT_OWNER: "The configured relayer is not the registry owner.",
  ALREADY_ACTIVE: "This issuer is already active.",
  NOT_ACTIVE: "This issuer is not active.",
  DUPLICATE_REPORT: "This sending wallet has already reported this hash.",
  INSUFFICIENT_FUNDS: "The testnet relayer has insufficient gas funds.",
  NONCE_CONFLICT: "Relayer nonce conflict. Reconcile pending transactions before retrying.",
  RPC_UNAVAILABLE: "The chain RPC is unavailable or did not return a valid response.",
  TRANSACTION_FAILED: "The transaction reverted on-chain.",
  TRANSACTION_PENDING: "Transaction confirmation is uncertain. Check the transaction hash before retrying.",
} as const;
export type ChainErrorCode = keyof typeof messages;
export class ChainError extends Error {
  constructor(public readonly code: ChainErrorCode, public readonly transactionHash?: string) {
    super(messages[code]);
    this.name = "ChainError";
  }
}

const addressSchema = z.string().refine((value) => isAddress(value) && value.toLowerCase() !== ZeroAddress).transform(getAddress);
const hashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/).refine((value) => value !== ZeroHash);
function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ChainError("INVALID_INPUT");
  return result.data;
}
function normalizeError(error: unknown): ChainError {
  if (error instanceof ChainError) return error;
  if (isError(error, "INSUFFICIENT_FUNDS")) return new ChainError("INSUFFICIENT_FUNDS");
  if (isError(error, "NONCE_EXPIRED") || isError(error, "REPLACEMENT_UNDERPRICED")) return new ChainError("NONCE_CONFLICT");
  if (isError(error, "CALL_EXCEPTION")) {
    let name = error.revert?.name;
    try { if (!name && error.data) name = abi.parseError(error.data)?.name; } catch { /* malformed RPC data */ }
    const codes: Record<string, ChainErrorCode> = {
      Unauthorized: "NOT_OWNER", IssuerAlreadyActive: "ALREADY_ACTIVE", IssuerNotActive: "NOT_ACTIVE",
      DuplicateReport: "DUPLICATE_REPORT", InvalidIssuer: "INVALID_INPUT", InvalidMetadata: "INVALID_INPUT", InvalidHash: "INVALID_INPUT",
    };
    return new ChainError(name && codes[name] ? codes[name] : "TRANSACTION_FAILED");
  }
  return new ChainError("RPC_UNAVAILABLE");
}

async function withRegistry<T>(operation: (registry: Contract, provider: JsonRpcProvider) => Promise<T>): Promise<T> {
  const config = z.object({
    rpc: z.string().url().refine((url) => /^https?:\/\//i.test(url)),
    chain: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    address: addressSchema,
  }).safeParse({ rpc: process.env.RPC_URL, chain: process.env.CHAIN_ID, address: process.env.REGISTRY_ADDRESS || deployment.address });
  if (!config.success) throw new ChainError("CONFIG");
  // A generated address is meaningful only on its recorded chain.
  if (!process.env.REGISTRY_ADDRESS && config.data.chain !== deployment.chainId) throw new ChainError("WRONG_CHAIN");
  const request = new FetchRequest(config.data.rpc);
  request.timeout = 8000;
  const provider = new JsonRpcProvider(request, undefined, { batchMaxCount: 1, cacheTimeout: -1 });
  try {
    if ((await provider.getNetwork()).chainId !== BigInt(config.data.chain)) throw new ChainError("WRONG_CHAIN");
    if (await provider.getCode(config.data.address) === "0x") throw new ChainError("NOT_DEPLOYED");
    return await operation(new Contract(config.data.address, deployment.abi, provider), provider);
  } catch (error) { throw normalizeError(error); }
  finally { provider.destroy(); }
}

export async function isActive(issuer: string): Promise<boolean> {
  const address = input(addressSchema, issuer);
  return withRegistry(async (registry) => Boolean(await registry.isActive(address)));
}
export async function issuerInfo(issuer: string) {
  const address = input(addressSchema, issuer);
  return withRegistry(async (registry) => {
    const info = await registry.issuerInfo(address);
    return { address, name: String(info[0]), category: String(info[1]), active: Boolean(info[2]) };
  });
}
// Decimal strings avoid bigint JSON errors and unsafe JavaScript-number casts.
export async function reportCount(idHash: string): Promise<string> {
  const hash = input(hashSchema, idHash);
  return withRegistry(async (registry) => (await registry.reportCount(hash)).toString());
}

export type RegistryEvent = {
  name: string; blockNumber: number; transactionHash: string; logIndex: number;
  args: Record<string, string>;
};
export async function recentEvents(options: { blocks?: number; limit?: number } = {}): Promise<RegistryEvent[]> {
  const settings = input(z.object({ blocks: z.number().int().min(1).max(2000).default(1000), limit: z.number().int().min(1).max(100).default(20) }), options);
  return withRegistry(async (registry, provider) => {
    const latest = await provider.getBlockNumber();
    const logs = await registry.queryFilter("*", Math.max(0, latest - settings.blocks + 1), latest);
    return logs.filter((log) => !log.removed).sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
      .slice(0, settings.limit).flatMap((log) => {
        const parsed = abi.parseLog(log);
        if (!parsed) return [];
        return [{ name: parsed.name, blockNumber: log.blockNumber, transactionHash: log.transactionHash, logIndex: log.index,
          args: Object.fromEntries(parsed.fragment.inputs.map((field, i) => [field.name, String(parsed.args[i])])) }];
      });
  });
}

async function write(method: string, args: string[], ownerOnly: boolean) {
  const key = z.string().regex(/^0x[0-9a-fA-F]{64}$/).safeParse(process.env.RELAYER_PRIVATE_KEY);
  if (!key.success) throw new ChainError("CONFIG");
  return withRegistry(async (registry, provider) => {
    let wallet: Wallet;
    try { wallet = new Wallet(key.data, provider); } catch { throw new ChainError("CONFIG"); }
    if (ownerOnly && getAddress(await registry.owner()) !== wallet.address) throw new ChainError("NOT_OWNER");
    const call = await registry.getFunction(method).populateTransaction(...args);
    const populated = await wallet.populateTransaction(call);
    const signed = await wallet.signTransaction(populated);
    // Compute the hash before broadcast: even a lost RPC response must not lead
    // callers to blindly submit a second transaction. Never return signed bytes.
    const transactionHash = keccak256(signed);
    try {
      const tx = await provider.broadcastTransaction(signed);
      const receipt = await tx.wait(1, 20000);
      if (!receipt) throw new ChainError("TRANSACTION_PENDING", transactionHash);
      if (receipt.status !== 1) throw new ChainError("TRANSACTION_FAILED", transactionHash);
      return { transactionHash, blockNumber: receipt.blockNumber };
    } catch (error) {
      if (error instanceof ChainError) throw error;
      if (isError(error, "CALL_EXCEPTION") || isError(error, "INSUFFICIENT_FUNDS") ||
          isError(error, "NONCE_EXPIRED") || isError(error, "REPLACEMENT_UNDERPRICED")) {
        throw new ChainError(normalizeError(error).code, transactionHash);
      }
      throw new ChainError("TRANSACTION_PENDING", transactionHash);
    }
  });
}

// Server-only primitives. Routes MUST requireRole(...) and validate request
// bodies before calling; these helpers do not authorize a Supabase user.
export async function registerIssuer(issuer: string, name: string, category: string) {
  const address = input(addressSchema, issuer);
  const text = (max: number) => z.string().trim().min(1).refine((value) => toUtf8Bytes(value).length <= max);
  return write("registerIssuer", [address, input(text(256), name), input(text(64), category)], true);
}
export async function revokeIssuer(issuer: string) {
  return write("revokeIssuer", [input(addressSchema, issuer)], true);
}
export async function reportScam(idHash: string, reportKey?:string) {
  if(reportKey)return write("anchorReport",[input(hashSchema,idHash),input(hashSchema,reportKey)],true);
  return write("reportScam", [input(hashSchema, idHash)], false);
}

// Root onboarding retries reconcile the original transaction instead of resending it.
export async function transactionStatus(transactionHash: string): Promise<"pending" | "confirmed" | "reverted"> {
  const hash = input(hashSchema, transactionHash);
  return withRegistry(async (_registry, provider) => {
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt) return "pending";
    return receipt.status === 1 ? "confirmed" : "reverted";
  });
}

export async function anchorEvidence(manifestHash:string){return write("anchorEvidence",[input(hashSchema,manifestHash)],true);}
export async function evidenceAnchor(manifestHash:string){const hash=input(hashSchema,manifestHash);return withRegistry(async(registry,provider)=>{const timestamp=BigInt(await registry.evidenceTimestamp(hash));if(timestamp===BigInt(0))return null;const block=Number(await registry.evidenceBlock(hash));const logs=await registry.queryFilter(registry.filters.EvidenceAnchored(hash),block,block);const log=logs.find(x=>!x.removed);if(!log)throw new ChainError("RPC_UNAVAILABLE");return {transactionHash:log.transactionHash,blockNumber:block,timestamp:new Date(Number(timestamp)*1000).toISOString(),chainId:Number((await provider.getNetwork()).chainId),registryAddress:await registry.getAddress()};});}

export async function registryContext(){return withRegistry(async(registry,provider)=>({chainId:Number((await provider.getNetwork()).chainId),registryAddress:await registry.getAddress()}));}
export async function relayedReportCount(idHash:string):Promise<string>{const hash=input(hashSchema,idHash);return withRegistry(async registry=>(await registry.relayedReportCount(hash)).toString());}
export async function reportAnchor(reportKey:string){const key=input(hashSchema,reportKey);return withRegistry(async registry=>{const hash=String(await registry.reportAnchorHash(key));if(hash===ZeroHash)return null;const block=Number(await registry.reportAnchorBlock(key));const logs=await registry.queryFilter(registry.filters.RelayedScamReported(hash,key),block,block);const log=logs.find(x=>!x.removed);if(!log)throw new ChainError("RPC_UNAVAILABLE");return {idHash:hash,transactionHash:log.transactionHash,blockNumber:block};});}
