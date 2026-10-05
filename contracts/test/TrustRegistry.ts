import assert from "node:assert/strict";
import { ethers } from "hardhat";

describe("TrustRegistry", function () {
  it("records the deploying account as the root authority", async function () {
    const [authority] = await ethers.getSigners();
    const registry = await ethers.deployContract("TrustRegistry");
    await registry.waitForDeployment();
    assert.equal(await registry.rootAuthority(), authority.address);
    assert.notEqual(await ethers.provider.getCode(await registry.getAddress()), "0x");
  });

  async function setup() {
    const [owner, issuer, reporter, other] = await ethers.getSigners();
    const registry = await ethers.deployContract("TrustRegistry");
    await registry.waitForDeployment();
    return { registry, owner, issuer, reporter, other };
  }
  it("anchors a nonzero manifest only through the owner, once, with block time",async()=>{
    const {registry,owner,other}=await setup();const hash=ethers.id("synthetic-evidence-manifest");
    await assert.rejects(registry.connect(other).getFunction("anchorEvidence")(hash),/Unauthorized/);
    await assert.rejects(registry.anchorEvidence(ethers.ZeroHash),/InvalidHash/);
    const receipt=await(await registry.anchorEvidence(hash)).wait();const block=await ethers.provider.getBlock(receipt!.blockNumber);
    assert.equal(await registry.evidenceTimestamp(hash),BigInt(block!.timestamp));assert.equal(await registry.evidenceBlock(hash),BigInt(block!.number));
    const logs=await registry.queryFilter(registry.filters.EvidenceAnchored(hash));assert.deepEqual(Array.from(registry.interface.parseLog(logs[0])!.args),[hash,owner.address,BigInt(block!.timestamp)]);
    await assert.rejects(registry.anchorEvidence(hash),/EvidenceAlreadyAnchored/);
  });
  it("restricts registration and revocation to the owner", async () => {
    const { registry, owner, issuer, other } = await setup();
    assert.equal(await registry.owner(), owner.address);
    await assert.rejects(registry.connect(other).getFunction("registerIssuer")(issuer.address, "Synthetic Bank", "bank"), /Unauthorized/);
    await registry.registerIssuer(issuer.address, "Synthetic Bank", "bank");
    await assert.rejects(registry.connect(other).getFunction("revokeIssuer")(issuer.address), /Unauthorized/);
    assert.equal(await registry.isActive(issuer.address), true);
  });
  it("registers, revokes, retains metadata and permits owner reactivation", async () => {
    const { registry, issuer } = await setup();
    assert.equal(await registry.isActive(issuer.address), false);
    assert.deepEqual(Array.from(await registry.issuerInfo(issuer.address)), ["", "", false]);
    await registry.registerIssuer(issuer.address, "Synthetic Bank", "bank");
    assert.deepEqual(Array.from(await registry.issuerInfo(issuer.address)), ["Synthetic Bank", "bank", true]);
    await assert.rejects(registry.registerIssuer(issuer.address, "Duplicate", "bank"), /IssuerAlreadyActive/);
    await registry.revokeIssuer(issuer.address);
    assert.deepEqual(Array.from(await registry.issuerInfo(issuer.address)), ["Synthetic Bank", "bank", false]);
    await assert.rejects(registry.revokeIssuer(issuer.address), /IssuerNotActive/);
    await registry.registerIssuer(issuer.address, "Synthetic Reapproved", "courier");
    assert.equal(await registry.isActive(issuer.address), true);
  });
  it("rejects zero issuer, missing/oversized metadata and unknown revocations", async () => {
    const { registry, issuer } = await setup();
    await assert.rejects(registry.registerIssuer(ethers.ZeroAddress, "Synthetic", "bank"), /InvalidIssuer/);
    for (const [name, category] of [["", "bank"], ["Synthetic", ""], ["x".repeat(257), "bank"], ["Synthetic", "x".repeat(65)]]) {
      await assert.rejects(registry.registerIssuer(issuer.address, name, category), /InvalidMetadata/);
    }
    await assert.rejects(registry.revokeIssuer(issuer.address), /IssuerNotActive/);
  });
  it("rejects duplicate reports while counting distinct sending wallets and hashes", async () => {
    const { registry, reporter, other } = await setup();
    const hash = ethers.id("synthetic-peppered-identifier");
    const second = ethers.id("another-synthetic-hash");
    assert.equal(await registry.reportCount(hash), 0n);
    await registry.connect(reporter).getFunction("reportScam")(hash);
    assert.equal(await registry.hasReported(hash, reporter.address), true);
    await assert.rejects(registry.connect(reporter).getFunction("reportScam")(hash), /DuplicateReport/);
    assert.equal(await registry.reportCount(hash), 1n);
    await registry.connect(other).getFunction("reportScam")(hash);
    await registry.connect(reporter).getFunction("reportScam")(second);
    assert.equal(await registry.reportCount(hash), 2n);
    assert.equal(await registry.reportCount(second), 1n);
    await assert.rejects(registry.reportScam(ethers.ZeroHash), /InvalidHash/);
  });
  it("emits indexed registration, revocation and report events with exact arguments", async () => {
    const { registry, issuer, reporter } = await setup();
    const hash = ethers.id("synthetic-event-hash");
    await registry.registerIssuer(issuer.address, "Synthetic Bank", "bank");
    await registry.revokeIssuer(issuer.address);
    await registry.connect(reporter).getFunction("reportScam")(hash);
    const registered = await registry.queryFilter(registry.filters.IssuerRegistered(issuer.address));
    const revoked = await registry.queryFilter(registry.filters.IssuerRevoked(issuer.address));
    const reported = await registry.queryFilter(registry.filters.ScamReported(hash, reporter.address));
    assert.equal(registered.length, 1);
    assert.equal(revoked.length, 1);
    assert.equal(reported.length, 1);
    assert.deepEqual(Array.from(registry.interface.parseLog(registered[0])!.args), [issuer.address, "Synthetic Bank", "bank"]);
    assert.deepEqual(Array.from(registry.interface.parseLog(revoked[0])!.args), [issuer.address]);
    assert.deepEqual(Array.from(registry.interface.parseLog(reported[0])!.args), [hash, reporter.address, 1n]);
  });
  it("anchors each opaque application report once through the owner and isolates public-wallet counts",async()=>{
    const {registry,other}=await setup();const hash=ethers.id("synthetic-registry-application");const a=ethers.id("synthetic-report-a"),b=ethers.id("synthetic-report-b");
    await assert.rejects(registry.connect(other).getFunction("anchorReport")(hash,a),/Unauthorized/);
    await assert.rejects(registry.anchorReport(ethers.ZeroHash,a),/InvalidHash/);
    await assert.rejects(registry.anchorReport(hash,ethers.ZeroHash),/InvalidHash/);
    const receipt=await(await registry.anchorReport(hash,a)).wait();
    await registry.anchorReport(hash,a);await registry.anchorReport(hash,b);
    assert.equal(await registry.reportCount(hash),2n);assert.equal(await registry.relayedReportCount(hash),2n);
    assert.equal(await registry.reportAnchorHash(a),hash);assert.equal(await registry.reportAnchorBlock(a),BigInt(receipt!.blockNumber));
    await assert.rejects(registry.anchorReport(ethers.id("different-synthetic-id"),a),/DuplicateReport/);
    const logs=await registry.queryFilter(registry.filters.RelayedScamReported(hash));assert.equal(logs.length,2);
    assert.deepEqual(Array.from(registry.interface.parseLog(logs[1])!.args),[hash,b,2n]);
    await registry.connect(other).getFunction("reportScam")(hash);
    assert.equal(await registry.reportCount(hash),3n);assert.equal(await registry.relayedReportCount(hash),2n);
  });

});
