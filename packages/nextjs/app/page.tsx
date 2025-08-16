"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { 
  CheckCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Address, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

// 任务状态枚举
enum TaskState {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Approved = 3,
}

// 任务结构体类型
interface Task {
  id: number;
  creator: string;
  worker: string;
  prompt: string;
  resultURI: string;
  reward: bigint;
  state: TaskState;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskPrompt, setNewTaskPrompt] = useState("");
  const [newTaskReward, setNewTaskReward] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [resultURI, setResultURI] = useState("");
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

  // 读取所有任务
  const { data: allTasks, refetch: refetchTasks } = useScaffoldReadContract({
    contractName: "AgentTaskManagerSimple",
    functionName: "getAllTasks",
    args: [BigInt(0), BigInt(100)], // 读取前100个任务
  });

  // 当任务数据更新时，转换格式并设置到本地状态
  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      const formattedTasks: Task[] = allTasks.map((task: any, index: number) => ({
        id: index,
        creator: task.creator,
        worker: task.worker,
        prompt: task.prompt,
        resultURI: task.resultURI,
        reward: task.reward,
        state: task.state,
      }));
      setTasks(formattedTasks);
    } else {
      setTasks([]);
    }
  }, [allTasks]);

  const handleCreateTask = async () => {
    if (!connectedAddress) {
      setMessage("请先连接钱包");
      return;
    }

    if (!newTaskPrompt.trim()) {
      setMessage("请输入任务提示词");
      return;
    }

    setIsCreatingTask(true);
    setMessage("");

    try {
      const rewardAmount = parseEther(newTaskReward);
      
      setMessage("创建任务中...");
      await createTask({
        functionName: "createTask",
        args: [newTaskPrompt],
        value: rewardAmount,
      });

      setMessage("✅ 任务创建成功！");
      setNewTaskPrompt("");
      setNewTaskReward("");
      
      // 刷新任务列表
      await refetchTasks();
    } catch (error) {
      console.error("创建任务失败:", error);
      setMessage(`❌ 创建任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsCreatingTask(false);
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
      
      // 刷新任务列表
      await refetchTasks();
    } catch (error) {
      console.error("接受任务失败:", error);
      setMessage(`❌ 接受任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const handleSubmitResult = async (taskId: number) => {
    if (!resultURI) return;
    
    try {
      setMessage("提交成果中...");
      await completeTask({
        functionName: "completeTask",
        args: [BigInt(taskId), resultURI],
      });
      setMessage("✅ 成果提交成功！");
      
      // 刷新任务列表
      await refetchTasks();
      
      setResultURI("");
      setSelectedTask(null);
    } catch (error) {
      console.error("提交成果失败:", error);
      setMessage(`❌ 提交成果失败: ${error instanceof Error ? error.message : "未知错误"}`);
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
      
      // 刷新任务列表
      await refetchTasks();
    } catch (error) {
      console.error("审核任务失败:", error);
      setMessage(`❌ 审核任务失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const getTaskStateBadge = (state: TaskState) => {
    switch (state) {
      case TaskState.Open:
        return <span className="badge badge-info">开放中</span>;
      case TaskState.InProgress:
        return <span className="badge badge-warning">进行中</span>;
      case TaskState.Completed:
        return <span className="badge badge-secondary">已完成</span>;
      case TaskState.Approved:
        return <span className="badge badge-success">已支付</span>;
      default:
        return <span className="badge">未知</span>;
    }
  };

  const formatReward = (reward: bigint) => {
    return (Number(reward) / 1e18).toFixed(2);
  };

  return (
    <>
      <div className="min-h-screen bg-base-200">
        {/* 页面标题 */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">🤖 AI Agent 任务市场</h1>
            <p className="text-xl text-base-content/70">在 Monad 测试网上发布和接受 AI 任务</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* 状态信息 */}
          <div className="bg-base-100 p-6 rounded-lg mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">📊 当前状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/70">钱包地址:</p>
                <Address address={connectedAddress} />
              </div>
              <div>
                <p className="text-sm text-base-content/70">任务总数:</p>
                <p className="font-bold text-lg">{taskCount?.toString() || "0"}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => refetchTasks()}
              >
                🔄 刷新任务列表
              </button>
            </div>
          </div>

          {/* 创建任务表单 */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <PlusIcon className="h-6 w-6 text-primary" />
                发布新任务
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">任务描述 (Prompt)</span>
                  </label>
                  <InputBase
                    placeholder="例如：生成一张未来科技风格的城市夜景图片"
                    value={newTaskPrompt}
                    onChange={setNewTaskPrompt}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">奖励金额 (MON)</span>
                  </label>
                  <EtherInput placeholder="0.1" value={newTaskReward} onChange={setNewTaskReward} />
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateTask}
                  disabled={isCreatingTask || !newTaskPrompt || !newTaskReward || !connectedAddress}
                >
                  {isCreatingTask ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <PlusIcon className="h-5 w-5" />
                  )}
                  {isCreatingTask ? "创建中..." : "发布任务"}
                </button>
              </div>
            </div>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className={`alert mb-6 ${
              message.includes("成功") ? "alert-success" : 
              message.includes("失败") ? "alert-error" : 
              "alert-info"
            }`}>
              <span>{message}</span>
            </div>
          )}

          {/* 任务列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="card-title text-lg">任务 #{task.id}</h3>
                    {getTaskStateBadge(task.state)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">任务描述:</span>
                      </label>
                      <p className="text-sm bg-base-200 p-3 rounded-lg">{task.prompt}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">发布者:</span>
                      </div>
                      <Address address={task.creator} format="short" />
                    </div>

                    {task.worker !== "0x0000000000000000000000000000000000000000" && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-success" />
                          <span className="text-sm">执行者:</span>
                        </div>
                        <Address address={task.worker} format="short" />
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4 text-warning" />
                        <span className="text-sm">奖励:</span>
                      </div>
                      <span className="font-bold text-lg text-primary">{formatReward(task.reward)} MON</span>
                    </div>

                    {task.resultURI && (
                      <div>
                        <label className="label">
                          <span className="label-text font-semibold">成果链接:</span>
                        </label>
                        <a
                          href={task.resultURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {task.resultURI}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="card-actions justify-end mt-4">
                    {task.state === TaskState.Open && task.creator !== connectedAddress && (
                      <button 
                        className="btn btn-success btn-sm" 
                        onClick={() => handleAcceptTask(task.id)}
                        disabled={!connectedAddress}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        接受任务
                      </button>
                    )}

                    {task.state === TaskState.InProgress && task.worker === connectedAddress && (
                      <button 
                        className="btn btn-warning btn-sm" 
                        onClick={() => setSelectedTask(task)}
                        disabled={!connectedAddress}
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        提交成果
                      </button>
                    )}

                    {task.state === TaskState.Completed && task.creator === connectedAddress && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleApproveTask(task.id)}
                        disabled={!connectedAddress}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        审核并支付
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 提交成果模态框 */}
          {selectedTask && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">提交任务成果</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">成果链接 (图片URL)</span>
                  </label>
                  <InputBase
                    placeholder="例如：https://cataas.com/cat/says/Your%20Result"
                    value={resultURI}
                    onChange={setResultURI}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      提示：可以访问{" "}
                      <a
                        href="https://cataas.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        cataas.com
                      </a>{" "}
                      获取随机猫咪图片作为示例
                    </span>
                  </label>
                </div>
                <div className="modal-action">
                  <button className="btn btn-ghost" onClick={() => setSelectedTask(null)}>
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmitResult(selectedTask.id)}
                    disabled={!resultURI}
                  >
                    提交成果
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <PhotoIcon className="h-24 w-24 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">暂无任务</h3>
              <p className="text-base-content/70">成为第一个发布任务的人吧！</p>
            </div>
          )}

          {/* 合约信息 */}
          <div className="bg-base-100 p-6 rounded-lg mt-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">🔗 合约信息</h2>
            <div className="space-y-2">
              <p><strong>AgentTaskManagerSimple:</strong> 0x6915716d240c64315960688E3Ef05ec07D8E6Db5</p>
            </div>
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
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
      </div>
    </>
  );
};

export default Home;
