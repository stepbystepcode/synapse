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

  // 模拟任务数据
  const mockTasks: Task[] = [
    {
      id: 1,
      creator: "0x1234567890123456789012345678901234567890",
      worker: "0x0000000000000000000000000000000000000000",
      prompt: "生成一张未来科技风格的城市夜景图片",
      resultURI: "",
      reward: BigInt("1000000000000000000"),
      state: TaskState.Open,
    },
    {
      id: 2,
      creator: "0x0987654321098765432109876543210987654321",
      worker: "0x1111111111111111111111111111111111111111",
      prompt: "设计一个简约风格的logo，主题是环保和可持续发展",
      resultURI: "https://cataas.com/cat/says/Logo%20Design",
      reward: BigInt("2000000000000000000"),
      state: TaskState.InProgress,
    },
  ];

  useEffect(() => {
    setTasks(mockTasks);
  }, []);

  const handleCreateTask = async () => {
    if (!newTaskPrompt || !newTaskReward) return;

    setIsCreatingTask(true);

    const newTask: Task = {
      id: tasks.length + 1,
      creator: connectedAddress || "0x0000000000000000000000000000000000000000",
      worker: "0x0000000000000000000000000000000000000000",
      prompt: newTaskPrompt,
      resultURI: "",
      reward: BigInt(newTaskReward),
      state: TaskState.Open,
    };

    setTasks([...tasks, newTask]);
    setNewTaskPrompt("");
    setNewTaskReward("");
    setIsCreatingTask(false);
  };

  const handleAcceptTask = async (taskId: number) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              worker: connectedAddress || "0x0000000000000000000000000000000000000000",
              state: TaskState.InProgress,
            }
          : task,
      ),
    );
  };

  const handleSubmitResult = async (taskId: number) => {
    if (!resultURI) return;

    setTasks(tasks.map(task => (task.id === taskId ? { ...task, resultURI, state: TaskState.Completed } : task)));

    setResultURI("");
    setSelectedTask(null);
  };

  const handleApproveTask = async (taskId: number) => {
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, state: TaskState.Approved } : task)));
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
        {/* 头部 */}
        <div className="bg-base-100 shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary">🤖 AI Agent 任务市场</h1>
                <p className="text-base-content/70 mt-2">在 Monad 测试网上发布和接受 AI 任务</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-center">
                  <p className="text-sm text-base-content/70">连接地址:</p>
                  <Address address={connectedAddress} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
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
                  disabled={isCreatingTask || !newTaskPrompt || !newTaskReward}
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
                      <button className="btn btn-success btn-sm" onClick={() => handleAcceptTask(task.id)}>
                        <CheckCircleIcon className="h-4 w-4" />
                        接受任务
                      </button>
                    )}

                    {task.state === TaskState.InProgress && task.worker === connectedAddress && (
                      <button className="btn btn-warning btn-sm" onClick={() => setSelectedTask(task)}>
                        <DocumentTextIcon className="h-4 w-4" />
                        提交成果
                      </button>
                    )}

                    {task.state === TaskState.Completed && task.creator === connectedAddress && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleApproveTask(task.id)}>
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
        </div>
      </div>
    </>
  );
};

export default Home;
