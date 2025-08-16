import * as dotenv from "dotenv";
dotenv.config();
import { Wallet } from "ethers";
import password from "@inquirer/password";
import { spawn } from "child_process";

/**
 * 便捷的Monad测试网部署脚本
 * 只需要输入一次密码，然后自动部署所有合约
 */
async function main() {
  console.log("🚀 开始部署到 Monad 测试网...");

  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  const plainKey = process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY;

  let deployerPrivateKey: string;

  if (plainKey) {
    // 使用未加密的私钥
    console.log("✅ 使用未加密的私钥");
    deployerPrivateKey = plainKey;
  } else if (encryptedKey) {
    // 使用加密的私钥
    console.log("🔐 检测到加密私钥，请输入密码...");
    const pass = await password({ message: "Enter password to decrypt private key:" });

    try {
      const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
      deployerPrivateKey = wallet.privateKey;
      console.log("✅ 私钥解密成功");
    } catch (error) {
      console.error("❌ 私钥解密失败，请检查密码", error);
      process.exit(1);
    }
  } else {
    console.log("❌ 未找到私钥配置");
    console.log("请运行以下命令之一：");
    console.log("  yarn account:generate  # 生成新账户");
    console.log("  yarn account:import    # 导入现有私钥");
    console.log("或者在 .env 文件中设置 __RUNTIME_DEPLOYER_PRIVATE_KEY");
    process.exit(1);
  }

  // 设置环境变量
  process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = deployerPrivateKey;

  console.log("📦 开始部署合约...");

  // 运行部署命令
  const hardhat = spawn("hardhat", ["deploy", "--network", "monadTestnet"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  hardhat.on("exit", code => {
    if (code === 0) {
      console.log("✅ 部署完成！");
      console.log("🔍 你可以在以下地址查看合约：");
      console.log("  区块浏览器: https://explorer.testnet.monad.xyz/");
      console.log("  前端调试: http://localhost:3000/debug");
    } else {
      console.error("❌ 部署失败");
    }
    process.exit(code || 0);
  });
}

main().catch(error => {
  console.error("❌ 部署脚本执行失败:", error);
  process.exit(1);
});
