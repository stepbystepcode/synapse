import { ethers } from "hardhat";

async function main() {
  console.log("🧪 测试 Monad 测试网部署...");

  // 获取部署的合约
  const yourContract = await ethers.getContract("YourContract");
  const agentPayment = await ethers.getContract("AgentPayment");

  console.log("📋 合约地址:");
  console.log("YourContract:", await yourContract.getAddress());
  console.log("AgentPayment:", await agentPayment.getAddress());

  // 测试 YourContract
  // console.log("\n🔍 测试 YourContract:");
  // console.log("初始问候语:", await yourContract.greeting());
  // console.log("所有者:", await yourContract.owner());
  // console.log("总计数器:", await yourContract.totalCounter());

  // // 测试 AgentPayment
  // console.log("\n🔍 测试 AgentPayment:");
  // console.log("所有者:", await agentPayment.owner());
  // console.log("合约余额:", await agentPayment.getBalance());
  // console.log("总支付数:", await agentPayment.totalPayments());

  console.log("\n✅ 所有测试完成!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  });
