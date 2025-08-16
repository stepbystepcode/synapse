"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

export default function TaskSimplePage() {
  const { address } = useAccount();
  const [prompt, setPrompt] = useState("");
  const [reward, setReward] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 读取合约数据
  const { data: taskCount } = useScaffoldReadContract({
    contractName: "AgentTaskManagerSimple",
    functionName: "getTaskCount",
  });

  // 写入合约
  const { writeContractAsync: createTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManagerSimple",
  });

  const { writeContractAsync: acceptTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManagerSimple",
  });

  const { writeContractAsync: completeTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManagerSimple",
  });

  const { writeContractAsync: approveTask } = useScaffoldWriteContract({
    contractName: "AgentTaskManagerSimple",
  });

  const handleCreateTask = async () => {
    if (!address) {
      setMessage("请先连接钱包");
      return;
    }

    if (!prompt.trim()) {
      setMessage("请输入任务提示词");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const rewardAmount = parseEther(reward);
      
      setMessage("创建任务中...");
      await createTask({
        functionName: "createTask",
        args: [prompt],
        value: rewardAmount,
      });

      setMessage("✅ 任务创建成功！");
      setPrompt("");
      setReward("0.01");
    } catch (error) {
      console.error("创建任务失败:", error);
      setMessage(`❌ 创建任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: number) => {
    try {
      setMessage("接受任务中...");
      await acceptTask({
        functionName: "acceptTask",
        args: [BigInt(taskId)],
      });
      setMessage("✅ 任务接受成功！");
    } catch (error) {
      console.error("接受任务失败:", error);
      setMessage(`❌ 接受任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      setMessage("完成任务中...");
      await completeTask({
        functionName: "completeTask",
        args: [BigInt(taskId), "https://example.com/result"],
      });
      setMessage("✅ 任务完成！");
    } catch (error) {
      console.error("完成任务失败:", error);
      setMessage(`❌ 完成任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const handleApproveTask = async (taskId: number) => {
    try {
      setMessage("审核任务中...");
      await approveTask({
        functionName: "approveTask",
        args: [BigInt(taskId)],
      });
      setMessage("✅ 任务审核并支付成功！");
    } catch (error) {
      console.error("审核任务失败:", error);
      setMessage(`❌ 审核任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🚀 简化版任务管理器</h1>

      {/* 状态信息 */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">📊 当前状态</h2>
        <div className="space-y-2">
          <p><strong>钱包地址:</strong> {address || "未连接"}</p>
          <p><strong>任务总数:</strong> {taskCount?.toString() || "0"}</p>
        </div>
      </div>

      {/* 创建任务表单 */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">📝 创建新任务</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">任务提示词</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入任务描述..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">奖励金额 (MON)</label>
            <input
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0.001"
              step="0.001"
            />
          </div>

          <button
            onClick={handleCreateTask}
            disabled={loading || !address}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "处理中..." : "创建任务"}
          </button>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">⚡ 快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleAcceptTask(0)}
            disabled={!address}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            接受任务 #0
          </button>
          <button
            onClick={() => handleCompleteTask(0)}
            disabled={!address}
            className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:bg-gray-400"
          >
            完成任务 #0
          </button>
          <button
            onClick={() => handleApproveTask(0)}
            disabled={!address}
            className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            审核任务 #0
          </button>
        </div>
      </div>

      {/* 消息显示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes("成功") ? "bg-green-100 text-green-800" : 
          message.includes("失败") ? "bg-red-100 text-red-800" : 
          "bg-blue-100 text-blue-800"
        }`}>
          {message}
        </div>
      )}

      {/* 合约地址信息 */}
      <div className="bg-base-200 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔗 合约地址</h2>
        <div className="space-y-2">
          <p><strong>AgentTaskManagerSimple:</strong> 0x6915716d240c64315960688E3Ef05ec07D8E6Db5</p>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 简化优势</h3>
          <ul className="text-sm space-y-1">
            <li>• 直接使用原生 MON 代币，无需 MockUSDC</li>
            <li>• 创建任务时直接发送 MON，无需授权步骤</li>
            <li>• 更简单的前端集成和用户体验</li>
            <li>• 减少 Gas 费用（无需两次交易）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
