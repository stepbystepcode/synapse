"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { parseEther } from "viem";
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

// Task state enum
enum TaskState {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Approved = 3,
}

// Task structure type
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

  // Write contract
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

  // Read all tasks
  const { data: allTasks, refetch: refetchTasks } = useScaffoldReadContract({
    contractName: "AgentTaskManagerSimple",
    functionName: "getAllTasks",
    args: [BigInt(0), BigInt(100)], // Read first 100 tasks
  });

  // When task data updates, convert format and set to local state
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
      setMessage("Please connect wallet first");
      return;
    }

    if (!newTaskPrompt.trim()) {
      setMessage("Please enter task prompt");
      return;
    }

    setIsCreatingTask(true);
    setMessage("");

    try {
      const rewardAmount = parseEther(newTaskReward);

      setMessage("Creating task...");
      await createTask({
        functionName: "createTask",
        args: [newTaskPrompt],
        value: rewardAmount,
      });

      setMessage("✅ Task created successfully!");
      setNewTaskPrompt("");
      setNewTaskReward("");

      // Refresh task list
      await refetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      setMessage(`❌ Failed to create task: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleAcceptTask = async (taskId: number) => {
    try {
      setMessage("Accepting task...");
      await acceptTask({
        functionName: "acceptTask",
        args: [BigInt(taskId)],
      });
      setMessage("✅ Task accepted successfully!");

      // Refresh task list
      await refetchTasks();
    } catch (error) {
      console.error("Failed to accept task:", error);
      setMessage(`❌ Failed to accept task: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSubmitResult = async (taskId: number) => {
    if (!resultURI) return;

    try {
      setMessage("Submitting result...");
      await completeTask({
        functionName: "completeTask",
        args: [BigInt(taskId), resultURI],
      });
      setMessage("✅ Result submitted successfully!");

      // Refresh task list
      await refetchTasks();

      setResultURI("");
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to submit result:", error);
      setMessage(`❌ Failed to submit result: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleApproveTask = async (taskId: number) => {
    try {
      setMessage("Approving task...");
      await approveTask({
        functionName: "approveTask",
        args: [BigInt(taskId)],
      });
      setMessage("✅ Task approved and payment successful!");

      // Refresh task list
      await refetchTasks();
    } catch (error) {
      console.error("Failed to approve task:", error);
      setMessage(`❌ Failed to approve task: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const getTaskStateBadge = (state: TaskState) => {
    switch (state) {
      case TaskState.Open:
        return (
          <span className="inline-block px-3 py-1 text-sm font-bold bg-blue-500 text-white border-4 border-black transform rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            OPEN
          </span>
        );
      case TaskState.InProgress:
        return (
          <span className="inline-block px-3 py-1 text-sm font-bold bg-yellow-400 text-black border-4 border-black transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            IN PROGRESS
          </span>
        );
      case TaskState.Completed:
        return (
          <span className="inline-block px-3 py-1 text-sm font-bold bg-gray-400 text-black border-4 border-black transform rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            COMPLETED
          </span>
        );
      case TaskState.Approved:
        return (
          <span className="inline-block px-3 py-1 text-sm font-bold bg-green-500 text-white border-4 border-black transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            PAID
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 text-sm font-bold bg-gray-500 text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            UNKNOWN
          </span>
        );
    }
  };

  const formatReward = (reward: bigint) => {
    return (Number(reward) / 1e18).toFixed(2);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-200 to-red-200 p-4">
        {/* Page title */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block bg-white border-8 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-2 mb-6">
              <h1 className="text-6xl font-black text-black mb-4 tracking-tight">🤖 AI AGENT</h1>
              <h2 className="text-4xl font-black text-red-600 mb-2">TASK MARKET</h2>
              <p className="text-xl font-bold text-gray-700">Publish and accept AI tasks on Monad testnet</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Create task form */}
          <div className="bg-white border-8 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 mb-[80px]">
            <div className="flex items-center mb-6">
              <div className="bg-yellow-400 border-4 border-black p-3 mr-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <PlusIcon className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-3xl font-black text-black">PUBLISH NEW TASK</h2>
            </div>

            <div className="flex items-end gap-6">
              <div className="flex-1">
                <label className="block text-lg font-bold text-black mb-3">TASK DESCRIPTION (PROMPT)</label>
                <div className="border-4 border-black bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] [&>div]:border-0 [&>div]:bg-transparent [&>div]:rounded-none [&>div>input]:border-0 [&>div>input]:bg-transparent [&>div>input]:rounded-none [&>div>input]:focus:outline-none [&>div>input]:focus:ring-0">
                  <InputBase
                    placeholder="e.g., Generate a futuristic city nightscape image"
                    value={newTaskPrompt}
                    onChange={setNewTaskPrompt}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-lg font-bold text-black mb-3">REWARD AMOUNT (MON)</label>
                <div className="border-4 border-black bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] [&>div]:border-0 [&>div]:bg-transparent [&>div]:rounded-none [&>div>input]:border-0 [&>div>input]:bg-transparent [&>div>input]:rounded-none [&>div>input]:focus:outline-none [&>div>input]:focus:ring-0 [&>div>button]:bg-transparent [&>div>button]:border-0 [&>div>button]:hover:bg-transparent">
                  <EtherInput placeholder="0.1" value={newTaskReward} onChange={setNewTaskReward} />
                </div>
              </div>
              <div>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-black text-lg px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleCreateTask}
                  disabled={isCreatingTask || !newTaskPrompt || !newTaskReward || !connectedAddress}
                >
                  {isCreatingTask ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    <PlusIcon className="h-6 w-6 mr-2" />
                  )}
                  {isCreatingTask ? "CREATING..." : "PUBLISH TASK"}
                </button>
              </div>
            </div>
          </div>

          {/* Message display */}
          {message && (
            <div
              className={`p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform rotate-1 ${
                message.includes("successfully")
                  ? "bg-green-400 text-black"
                  : message.includes("Failed")
                    ? "bg-red-400 text-white"
                    : "bg-blue-400 text-white"
              }`}
            >
              <span className="text-lg font-bold">{message}</span>
            </div>
          )}

          {/* Task list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {tasks.map(task => (
              <div
                key={task.id}
                className="bg-white border-8 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-2 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-black">TASK #{task.id}</h3>
                  {getTaskStateBadge(task.state)}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-bold text-black mb-2">TASK DESCRIPTION:</label>
                    <div className="bg-gray-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-sm font-bold">{task.prompt}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 border-2 border-black p-1">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold">CREATOR:</span>
                    </div>
                    <Address address={task.creator} format="short" />
                  </div>

                  {task.worker !== "0x0000000000000000000000000000000000000000" && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-500 border-2 border-black p-1">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold">WORKER:</span>
                      </div>
                      <Address address={task.worker} format="short" />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-400 border-2 border-black p-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-black" />
                      </div>
                      <span className="text-sm font-bold">REWARD:</span>
                    </div>
                    <span className="font-black text-2xl text-red-600">{formatReward(task.reward)} MON</span>
                  </div>

                  {task.resultURI && (
                    <div>
                      <label className="block text-lg font-bold text-black mb-2">RESULT LINK:</label>
                      <div className="bg-blue-100 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <a
                          href={task.resultURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all font-bold"
                        >
                          {task.resultURI}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-6 space-y-3">
                  {task.state === TaskState.Open && task.creator !== connectedAddress && (
                    <button
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-lg px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => handleAcceptTask(task.id)}
                      disabled={!connectedAddress}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                      ACCEPT TASK
                    </button>
                  )}

                  {task.state === TaskState.InProgress && task.worker === connectedAddress && (
                    <button
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black text-lg px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => setSelectedTask(task)}
                      disabled={!connectedAddress}
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2 inline" />
                      SUBMIT RESULT
                    </button>
                  )}

                  {task.state === TaskState.Completed && task.creator === connectedAddress && (
                    <button
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-lg px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={() => handleApproveTask(task.id)}
                      disabled={!connectedAddress}
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                      APPROVE & PAY
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit result modal */}
          {selectedTask && (
            <div className="modal modal-open">
              <div className="modal-box bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
                <h3 className="font-black text-2xl mb-6 text-black">SUBMIT TASK RESULT</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-lg">RESULT LINK (IMAGE URL)</span>
                  </label>
                  <div className="border-4 border-black bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] [&>div]:border-0 [&>div]:bg-transparent [&>div]:rounded-none [&>div>input]:border-0 [&>div>input]:bg-transparent [&>div>input]:rounded-none [&>div>input]:focus:outline-none [&>div>input]:focus:ring-0">
                    <InputBase
                      placeholder="e.g., https://cataas.com/cat/says/Your%20Result"
                      value={resultURI}
                      onChange={setResultURI}
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt font-bold">
                      TIP: You can visit{" "}
                      <a
                        href="https://cataas.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary font-bold"
                      >
                        cataas.com
                      </a>{" "}
                      to get random cat images as examples
                    </span>
                  </label>
                </div>
                <div className="modal-action space-x-4">
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-black font-black px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all"
                    onClick={() => setSelectedTask(null)}
                  >
                    CANCEL
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-black px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={() => handleSubmitResult(selectedTask.id)}
                    disabled={!resultURI}
                  >
                    SUBMIT RESULT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white border-8 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-2 inline-block">
                <PhotoIcon className="h-32 w-32 text-gray-400 mx-auto mb-6" />
                <h3 className="text-3xl font-black text-black mb-4">NO TASKS AVAILABLE</h3>
                <p className="text-xl font-bold text-gray-600">Be the first to publish a task!</p>
              </div>
            </div>
          )}

          {/* Contract information */}
          <div className="bg-white border-8 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <h2 className="text-3xl font-black text-black mb-6">🔗 CONTRACT INFORMATION</h2>
            <div className="space-y-4">
              <div className="bg-gray-100 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold text-lg">
                  <strong>AgentTaskManagerSimple:</strong> 0x6915716d240c64315960688E3Ef05ec07D8E6Db5
                </p>
              </div>
            </div>
            <div className="mt-6 bg-yellow-100 border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-xl mb-4 text-black">💡 SIMPLIFIED ADVANTAGES</h3>
              <ul className="text-lg font-bold space-y-2">
                <li>• Direct use of native MON token, no MockUSDC needed</li>
                <li>• Send MON directly when creating tasks, no approval step required</li>
                <li>• Simpler frontend integration and user experience</li>
                <li>• Reduced gas fees (no need for two transactions)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
