import { artifacts, ethers, network } from "hardhat";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";

// Only our own messages are safe to display; RPC errors may contain credentials.
class DeploymentError extends Error {}

async function main() {
  if (!["localhost", "amoy"].includes(network.name)) throw new DeploymentError("Use --network localhost or --network amoy.");
  if (network.name === "amoy" && (!process.env.RPC_URL || !process.env.RELAYER_PRIVATE_KEY)) {
    throw new DeploymentError("Amoy deployment requires RPC_URL and RELAYER_PRIVATE_KEY in the root .env.");
  }
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const expected = network.name === "amoy" ? 80002 : 31337;
  if (chainId !== expected) throw new DeploymentError("RPC chain ID does not match the selected deployment network.");
  if (process.env.CHAIN_ID && Number(process.env.CHAIN_ID) !== chainId) throw new DeploymentError("CHAIN_ID does not match the RPC.");
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new DeploymentError("No deployment signer configured.");
  if (await ethers.provider.getBalance(deployer.address) === 0n) throw new DeploymentError("The deployment signer needs testnet gas funds.");
  const registry = await ethers.deployContract("TrustRegistry", { signer: deployer });
  await registry.waitForDeployment();
  const receipt = await registry.deploymentTransaction()!.wait(1);
  if (!receipt || receipt.status !== 1) throw new DeploymentError("Deployment was not confirmed.");
  const address = await registry.getAddress();
  const { abi } = await artifacts.readArtifact("TrustRegistry");
  const output = resolve(__dirname, "../../web/lib/contract.json");
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(`${output}.tmp`, JSON.stringify({ address, chainId, deploymentBlock: receipt.blockNumber,
    deploymentTransaction: receipt.hash, owner: deployer.address, abi }, null, 2) + "\n", "utf8");
  await rename(`${output}.tmp`, output);
  console.log(`REGISTRY_ADDRESS=${address}\nCHAIN_ID=${chainId}\nExported address and ABI to web/lib/contract.json`);
}

main().catch((error: unknown) => {
  console.error(error instanceof DeploymentError ? error.message :
    "Deployment failed. Check the selected network, RPC/CHAIN_ID, testnet signer balance and output-file permissions.");
  process.exitCode = 1;
});
