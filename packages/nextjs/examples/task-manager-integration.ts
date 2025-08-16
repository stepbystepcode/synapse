/**
 * 前端集成示例
 * 展示如何调用部署在 Monad 测试网上的 AgentTaskManager 合约
 */

import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { parseUnits } from "viem";

// 部署后的合约地址（Monad 测试网）
const MOCK_USDC_ADDRESS = "0xff03EBae8D20c291BDbA40058A51477D8FB253c2";
const AGENT_TASK_MANAGER_ADDRESS = "0x94efCCa515154b1147a971dAF546373007D6932C";

/**
 * 创建任务的完整流程
 */
export const useCreateTask = () => {
  // 1. 授权 MockUSDC
  const { writeContractAsync: approveUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC", // 需要在 externalContracts.ts 中配置
  });

  // 2. 创建任务
  const { writeContractAsync: createTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManager", // 需要在 externalContracts.ts 中配置
  });
 
  const handleCreateTask = async (prompt: string, rewardAmount: string) => {
    try {
      // 步骤1: 授权 USDC
      const rewardInWei = parseUnits(rewardAmount, 6); // USDC 使用 6 位小数
      
      await approveUSDC({
        functionName: "approve",
        args: [AGENT_TASK_MANAGER_ADDRESS, rewardInWei],
      });

      // 步骤2: 创建任务
      await createTask({
        functionName: "createTask",
        args: [prompt, rewardInWei],
      });

      console.log("✅ 任务创建成功！");
    } catch (error) {
      console.error("❌ 创建任务失败:", error);
    }
  };

  return { handleCreateTask };
};

/**
 * 接受任务
 */
export const useAcceptTask = () => {
  const { writeContractAsync: acceptTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManager",
  });

  const handleAcceptTask = async (taskId: number) => {
    try {
      await acceptTask({
        functionName: "acceptTask",
        args: [BigInt(taskId)],
      });
      console.log("✅ 任务接受成功！");
    } catch (error) {
      console.error("❌ 接受任务失败:", error);
    }
  };

  return { handleAcceptTask };
};

/**
 * 完成任务
 */
export const useCompleteTask = () => {
  const { writeContractAsync: completeTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManager",
  });

  const handleCompleteTask = async (taskId: number, resultURI: string) => {
    try {
      await completeTask({
        functionName: "completeTask",
        args: [BigInt(taskId), resultURI],
      });
      console.log("✅ 任务完成！");
    } catch (error) {
      console.error("❌ 完成任务失败:", error);
    }
  };

  return { handleCompleteTask };
};

/**
 * 审核并支付任务
 */
export const useApproveTask = () => {
  const { writeContractAsync: approveTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManager",
  });

  const handleApproveTask = async (taskId: number) => {
    try {
      await approveTask({
        functionName: "approveTask",
        args: [BigInt(taskId)],
      });
      console.log("✅ 任务审核并支付成功！");
    } catch (error) {
      console.error("❌ 审核任务失败:", error);
    }
  };

  return { handleApproveTask };
};

/**
 * 查询任务列表
 */
export const useTaskList = () => {
  const { data: taskCount } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "getTaskCount",
  });

  const { data: tasks } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "getAllTasks",
    args: [0, 10], // 获取前10个任务
  });

  return { taskCount, tasks };
};

/**
 * 查询单个任务详情
 */
export const useTaskDetail = (taskId: number) => {
  const { data: task } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "getTask",
    args: [taskId],
  });

  return { task };
};

/**
 * 权限检查
 */
export const useTaskPermissions = (taskId: number, userAddress: string) => {
  const { data: isCreator } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "isTaskCreator",
    args: [taskId, userAddress],
  });

  const { data: isWorker } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "isTaskWorker",
    args: [taskId, userAddress],
  });

  const { data: canAccept } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "canAcceptTask",
    args: [taskId, userAddress],
  });

  const { data: canComplete } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "canCompleteTask",
    args: [taskId, userAddress],
  });

  const { data: canApprove } = useScaffoldReadContract({
    contractName: "AgentTaskManager",
    functionName: "canApproveTask",
    args: [taskId, userAddress],
  });

  return {
    isCreator,
    isWorker,
    canAccept,
    canComplete,
    canApprove,
  };
};
