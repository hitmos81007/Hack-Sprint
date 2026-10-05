import "@nomicfoundation/hardhat-ethers";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import type { HardhatUserConfig } from "hardhat/config";

loadEnv({ path: resolve(__dirname, "../.env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    amoy: {
      url: process.env.RPC_URL || "https://polygon-amoy.drpc.org",
      chainId: 80002,
      accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
    },
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545", chainId: 31337,
      ...(process.env.RELAYER_PRIVATE_KEY ? { accounts: [process.env.RELAYER_PRIVATE_KEY] } : {}),
    },
    ...(process.env.RPC_URL ? {
      configured: {
        url: process.env.RPC_URL,
        chainId: Number(process.env.CHAIN_ID || 31337),
        accounts: process.env.RELAYER_PRIVATE_KEY ? [process.env.RELAYER_PRIVATE_KEY] : [],
      },
    } : {}),
  },
};

export default config;

