import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({
  receipt: vi.fn(), network: vi.fn(), code: vi.fn(), destroy: vi.fn(), block: vi.fn(), broadcast: vi.fn(), wait: vi.fn(),
  active: vi.fn(), info: vi.fn(), count: vi.fn(), logs: vi.fn(), owner: vi.fn(), populate: vi.fn(), sign: vi.fn(), call: vi.fn(),
}));
vi.mock("ethers", async (original) => {
  const actual = await original<typeof import("ethers")>();
  return { ...actual,
    JsonRpcProvider: class {
      getNetwork = mock.network; getCode = mock.code; destroy = mock.destroy;
      getTransactionReceipt = mock.receipt; getBlockNumber = mock.block; broadcastTransaction = mock.broadcast;
    },
    Contract: class {
      isActive = mock.active; issuerInfo = mock.info; reportCount = mock.count;
      queryFilter = mock.logs; owner = mock.owner;
      getFunction() { return { populateTransaction: mock.call }; }
    },
    Wallet: class {
      address = "0x1111111111111111111111111111111111111111";
      populateTransaction = mock.populate; signTransaction = mock.sign;
    },
  };
});
import { Interface, ZeroAddress, ZeroHash, keccak256 } from "ethers";
import deployment from "./contract.json";
import { isActive, issuerInfo, reportCount, recentEvents, registerIssuer, revokeIssuer, reportScam, transactionStatus } from "./chain";

const address = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;
beforeEach(() => {
  vi.stubEnv("RPC_URL", "https://rpc.example.test/secret-token");
  vi.stubEnv("CHAIN_ID", "31337");
  vi.stubEnv("REGISTRY_ADDRESS", address);
  // Synthetic, not a funded private key; Wallet is mocked in this unit suite.
  vi.stubEnv("RELAYER_PRIVATE_KEY", `0x${"1".repeat(64)}`);
  mock.network.mockResolvedValue({ chainId: BigInt("31337") });
  mock.code.mockResolvedValue("0x1234"); mock.block.mockResolvedValue(100);
  mock.active.mockResolvedValue(true); mock.info.mockResolvedValue(["Synthetic Bank", "bank", true]);
  mock.count.mockResolvedValue(BigInt("9007199254740993")); mock.owner.mockResolvedValue(address);
  mock.logs.mockResolvedValue([]); mock.call.mockResolvedValue({ to: address });
  mock.populate.mockResolvedValue({}); mock.sign.mockResolvedValue("0x1234");
  mock.wait.mockResolvedValue({ status: 1, blockNumber: 101 });
  mock.broadcast.mockResolvedValue({ wait: mock.wait });
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe("chain helpers", () => {
  it("reconciles pending, confirmed and reverted transaction receipts", async () => {
    mock.receipt.mockResolvedValueOnce(null).mockResolvedValueOnce({ status: 1 }).mockResolvedValueOnce({ status: 0 });
    expect(await transactionStatus(hash)).toBe("pending");
    expect(await transactionStatus(hash)).toBe("confirmed");
    expect(await transactionStatus(hash)).toBe("reverted");
    expect(mock.receipt).toHaveBeenCalledWith(hash);
    await expect(transactionStatus("not a hash")).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("reads active state, issuer metadata and JSON-safe exact counts", async () => {
    expect(await isActive(address)).toBe(true);
    expect(await issuerInfo(address)).toEqual({ address, name: "Synthetic Bank", category: "bank", active: true });
    expect(await reportCount(hash)).toBe("9007199254740993");
    expect(mock.destroy).toHaveBeenCalledTimes(3);
  });
  it("rejects invalid addresses and raw identifiers without RPC calls", async () => {
    await expect(isActive(ZeroAddress)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(reportScam("synthetic@example.test")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(reportScam(ZeroHash)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(registerIssuer(address, "अ".repeat(100), "bank")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(mock.network).not.toHaveBeenCalled();
  });
  it("fails clearly for missing config, wrong chain and absent code", async () => {
    vi.stubEnv("RPC_URL", "");
    await expect(isActive(address)).rejects.toMatchObject({ code: "CONFIG" });
    vi.stubEnv("RPC_URL", "https://rpc.example.test");
    mock.network.mockResolvedValueOnce({ chainId: BigInt("1") });
    await expect(isActive(address)).rejects.toMatchObject({ code: "WRONG_CHAIN" });
    mock.code.mockResolvedValueOnce("0x");
    await expect(isActive(address)).rejects.toMatchObject({ code: "NOT_DEPLOYED" });
  });
  it("bounds and orders event queries and serializes indexed args", async () => {
    const iface = new Interface(deployment.abi);
    const encoded = iface.encodeEventLog(iface.getEvent("ScamReported")!, [hash, address, BigInt("2")]);
    mock.logs.mockResolvedValue([
      { ...encoded, blockNumber: 99, index: 0, transactionHash: hash, removed: false },
      { ...encoded, blockNumber: 100, index: 1, transactionHash: hash, removed: false },
    ]);
    const events = await recentEvents({ blocks: 10, limit: 1 });
    expect(mock.logs).toHaveBeenCalledWith("*", 91, 100);
    expect(events[0]).toMatchObject({ name: "ScamReported", blockNumber: 100, args: { count: "2", idHash: hash, reporter: address } });
    await expect(recentEvents({ blocks: 100000 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("requires owner for issuer writes and returns a confirmed transaction hash", async () => {
    mock.owner.mockResolvedValueOnce("0x2222222222222222222222222222222222222222");
    await expect(registerIssuer(address, "Synthetic", "bank")).rejects.toMatchObject({ code: "NOT_OWNER" });
    expect(mock.sign).not.toHaveBeenCalled();
    expect(await revokeIssuer(address)).toEqual({ transactionHash: keccak256("0x1234"), blockNumber: 101 });
    expect(mock.wait).toHaveBeenCalledWith(1, 20000);
  });
  it("maps duplicate-revert data without leaking provider details", async () => {
    mock.populate.mockRejectedValue({ code: "CALL_EXCEPTION", data: new Interface(deployment.abi).encodeErrorResult("DuplicateReport", []), message: "secret-token" });
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "DUPLICATE_REPORT" });
  });
  it("returns a reconcilable hash on uncertain broadcast or confirmation", async () => {
    mock.broadcast.mockRejectedValueOnce(new Error("secret RPC details"));
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "TRANSACTION_PENDING", transactionHash: keccak256("0x1234") });
    mock.wait.mockRejectedValueOnce({ code: "TIMEOUT" });
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "TRANSACTION_PENDING", transactionHash: keccak256("0x1234") });
  });
  it("preserves definite broadcast failures and their transaction hash", async () => {
    for (const [rpcCode, code] of [
      ["INSUFFICIENT_FUNDS", "INSUFFICIENT_FUNDS"],
      ["NONCE_EXPIRED", "NONCE_CONFLICT"],
      ["REPLACEMENT_UNDERPRICED", "NONCE_CONFLICT"],
    ]) {
      mock.broadcast.mockRejectedValueOnce({ code: rpcCode, message: "secret-token" });
      await expect(reportScam(hash)).rejects.toMatchObject({ code, transactionHash: keccak256("0x1234") });
    }
    mock.broadcast.mockRejectedValueOnce({ code: "CALL_EXCEPTION", data: new Interface(deployment.abi).encodeErrorResult("DuplicateReport", []) });
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "DUPLICATE_REPORT", transactionHash: keccak256("0x1234") });
  });
  it("requires a relayer key for writes but allows reads without it", async () => {
    vi.stubEnv("RELAYER_PRIVATE_KEY", "");
    expect(await isActive(address)).toBe(true);
    await expect(registerIssuer(address, "Synthetic Bank", "bank")).rejects.toMatchObject({ code: "CONFIG" });
    await expect(revokeIssuer(address)).rejects.toMatchObject({ code: "CONFIG" });
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "CONFIG" });
    expect(mock.broadcast).not.toHaveBeenCalled();
  });
  it("sanitizes transport failures and distinguishes failed receipts", async () => {
    mock.network.mockRejectedValueOnce(new Error("secret-token"));
    await expect(isActive(address)).rejects.toMatchObject({ code: "RPC_UNAVAILABLE", message: "The chain RPC is unavailable or did not return a valid response." });
    mock.wait.mockResolvedValueOnce({ status: 0, blockNumber: 101 });
    await expect(reportScam(hash)).rejects.toMatchObject({ code: "TRANSACTION_FAILED" });
  });
});
