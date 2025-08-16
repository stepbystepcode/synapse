import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署简化版 AgentTaskManager 合约到 Monad 测试链
 * 直接使用原生 MON 代币，无需 MockUSDC
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deploySimpleTaskManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 开始部署简化版 AgentTaskManager 合约到 Monad 测试链...");
  console.log("部署者地址:", deployer);

  // 部署简化版 AgentTaskManager
  console.log("📦 部署 AgentTaskManagerSimple...");
  const agentTaskManagerSimple = await deploy("AgentTaskManagerSimple", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("✅ AgentTaskManagerSimple 部署成功!");
  console.log("合约地址:", agentTaskManagerSimple.address);

  // 获取合约实例进行验证
  const agentTaskManagerSimpleContract = await hre.ethers.getContract<Contract>("AgentTaskManagerSimple", deployer);

  console.log("\n📋 合约信息:");
  console.log("合约所有者:", await agentTaskManagerSimpleContract.owner());
  console.log("任务总数:", await agentTaskManagerSimpleContract.getTaskCount());
  console.log("合约余额:", await hre.ethers.provider.getBalance(agentTaskManagerSimple.address));

  console.log("\n🔗 前端集成信息:");
  console.log("前端需要使用的合约地址:");
  console.log(`AgentTaskManagerSimple: ${agentTaskManagerSimple.address}`);
  
  console.log("\n📝 前端调用示例:");
  console.log("1. 直接调用 AgentTaskManagerSimple.createTask(提示词) { value: 金额 }");
  console.log("2. 其他用户调用 AgentTaskManagerSimple.acceptTask(任务ID)");
  console.log("3. 工作者调用 AgentTaskManagerSimple.completeTask(任务ID, 结果URL)");
  console.log("4. 创建者调用 AgentTaskManagerSimple.approveTask(任务ID)");

  console.log("\n💡 优势:");
  console.log("- 无需 MockUSDC，直接使用原生 MON 代币");
  console.log("- 无需授权步骤，创建任务时直接发送 MON");
  console.log("- 更简单的前端集成");

  console.log("\n🎉 部署完成！");
};

export default deploySimpleTaskManager;

// 标签，用于选择性部署
deploySimpleTaskManager.tags = ["AgentTaskManagerSimple"];
