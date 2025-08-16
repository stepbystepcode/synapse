import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署 AgentPayment 合约到 Monad 测试链
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAgentPayment: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 开始部署 AgentPayment 合约到 Monad 测试链...");
  console.log("部署者地址:", deployer);

  await deploy("AgentPayment", {
    from: deployer,
    // 合约构造函数参数 - 将部署者设为合约所有者
    args: [deployer],
    log: true,
    // 在本地网络上自动挖矿以加快部署速度
    autoMine: true,
  });

  // 获取部署的合约实例
  const agentPayment = await hre.ethers.getContract<Contract>("AgentPayment", deployer);

  console.log("✅ AgentPayment 合约部署成功!");
  console.log("合约地址:", await agentPayment.getAddress());
  console.log("合约所有者:", await agentPayment.owner());
  console.log("合约余额:", await agentPayment.getBalance());
};

export default deployAgentPayment;

// 标签，用于选择性部署
deployAgentPayment.tags = ["AgentPayment"];
