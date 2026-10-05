import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Contract, ContractFactory, JsonRpcProvider, Wallet, id, parseEther } from "ethers";
vi.mock("server-only", () => ({}));
import deployment from "./contract.json";
import { anchorEvidence, evidenceAnchor, isActive, issuerInfo, registerIssuer, revokeIssuer, reportScam, reportCount, recentEvents, transactionStatus } from "./chain";

// Explicit opt-in, local-only. Never sends transactions to Amoy or a configured remote RPC.
describe.runIf(process.env.RUN_CHAIN_INTEGRATION === "1")("localhost chain integration", () => {
  let provider: JsonRpcProvider;
  const issuer = Wallet.createRandom().address;
  beforeAll(async () => {
    provider = new JsonRpcProvider("http://127.0.0.1:8545", undefined, { cacheTimeout: -1 });
    expect((await provider.getNetwork()).chainId).toBe(BigInt("31337"));
    // Verify the actual deployment export, before using an isolated test contract.
    expect(deployment.chainId).toBe(31337);
    expect(await provider.getCode(deployment.address)).not.toBe("0x");
    const deployed = new Contract(deployment.address, deployment.abi, provider);
    expect(await deployed.owner()).toBe(deployment.owner);
    const wallet = Wallet.createRandom().connect(provider);
    const funder = await provider.getSigner(0);
    await (await funder.sendTransaction({ to: wallet.address, value: parseEther("1") })).wait();
    const artifact = JSON.parse(await readFile(resolve(process.cwd(), "../contracts/artifacts/contracts/TrustRegistry.sol/TrustRegistry.json"), "utf8"));
    const registry = await new ContractFactory(artifact.abi, artifact.bytecode, wallet).deploy();
    await registry.waitForDeployment();
    vi.stubEnv("RPC_URL", "http://127.0.0.1:8545");
    vi.stubEnv("CHAIN_ID", "31337");
    vi.stubEnv("REGISTRY_ADDRESS", await registry.getAddress());
    // Ephemeral test key exists only in this test process, never in a file/log.
    vi.stubEnv("RELAYER_PRIVATE_KEY", wallet.privateKey);
  }, 30000);
  afterAll(() => { provider?.destroy(); vi.unstubAllEnvs(); });
  it("registers, reads, revokes, anchors, rejects duplicates and reads events over real RPC", async () => {
    expect(await isActive(issuer)).toBe(false);
    await registerIssuer(issuer, "Synthetic Integration Bank", "bank");
    expect(await issuerInfo(issuer)).toMatchObject({ name: "Synthetic Integration Bank", category: "bank", active: true });
    await revokeIssuer(issuer);
    expect(await isActive(issuer)).toBe(false);
    const hash = id("synthetic-integration-peppered-identifier");
    const tx = await reportScam(hash);
    expect(tx.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(await reportCount(hash)).toBe("1");
    expect(await transactionStatus(tx.transactionHash)).toBe("confirmed");
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "DUPLICATE_REPORT" });
    const manifestHash=id("synthetic-manifest-localhost");expect(await evidenceAnchor(manifestHash)).toBeNull();const evidenceTx=await anchorEvidence(manifestHash);const evidence=await evidenceAnchor(manifestHash);expect(evidence).toMatchObject({transactionHash:evidenceTx.transactionHash,blockNumber:evidenceTx.blockNumber,chainId:31337});expect(Number.isFinite(Date.parse(evidence!.timestamp))).toBe(true);
    const events = await recentEvents();
    expect(events.map((event) => event.name)).toEqual(["EvidenceAnchored", "ScamReported", "IssuerRevoked", "IssuerRegistered"]);
  }, 60000);
});
