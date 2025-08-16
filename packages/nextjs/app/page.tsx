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

  // // Read contract data
  // const { data: taskCount } = useScaffoldReadContract({
  //   contractName: "AgentTaskManagerSimple",
  //   functionName: "getTaskCount",
  // });

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

  // Test contract status function
  // const testContractStatus = async () => {
  //   try {
  //     setMessage("Testing contract status...");

  //     // Check task count and task list
  //     if (taskCount && Number(taskCount) > 0) {
  //       setMessage(`✅ Contract status normal, currently has ${taskCount.toString()} tasks`);
  //       console.log("Task count:", taskCount.toString());
  //       console.log("Current task list:", tasks);

  //       // Try to check if contract is paused
  //       if (tasks.length > 0) {
  //         const firstTask = tasks[0];
  //         if (firstTask.state === TaskState.Open && firstTask.creator !== connectedAddress) {
  //           setMessage(`✅ Contract status normal, task #${firstTask.id} can be accepted`);
  //         } else {
  //           setMessage(`⚠️ Task #${firstTask.id} status: ${["Open", "In Progress", "Completed", "Approved"][firstTask.state]}`);
  //         }
  //       }
  //     } else if (taskCount === BigInt(0)) {
  //       setMessage("✅ Contract status normal, but no tasks currently");
  //     } else {
  //       setMessage("⚠️ Unable to read task count, contract may have issues");
  //     }
  //   } catch (error) {
  //     setMessage(`❌ Contract status test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  //   }
  // };

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
        return <span className="badge badge-info">Open</span>;
      case TaskState.InProgress:
        return <span className="badge badge-warning">In Progress</span>;
      case TaskState.Completed:
        return <span className="badge badge-secondary">Completed</span>;
      case TaskState.Approved:
        return <span className="badge badge-success">Paid</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const formatReward = (reward: bigint) => {
    return (Number(reward) / 1e18).toFixed(2);
  };

  return (
    <>
      <div className="min-h-screen bg-base-200">
        {/* Page title */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">🤖 AI Agent Task Market</h1>
            <p className="text-xl text-base-content/70">Publish and accept AI tasks on Monad testnet</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Status information
          <div className="bg-base-100 p-6 rounded-lg mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">📊 Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-content/70">Wallet Address:</p>
                <Address address={connectedAddress} />
              </div>
              <div>
                <p className="text-sm text-base-content/70">Total Tasks:</p>
                <p className="font-bold text-lg">{taskCount?.toString() || "0"}</p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => refetchTasks()}
              >
                🔄 Refresh Task List
              </button>
              <button 
                className="btn btn-outline btn-sm"
                onClick={testContractStatus}
              >
                🔍 Test Contract Status
              </button>

            </div>
          </div> */}

          {/* Create task form */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <PlusIcon className="h-6 w-6 text-primary" />
                Publish New Task
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Task Description (Prompt)</span>
                  </label>
                  <InputBase
                    placeholder="e.g., Generate a futuristic city nightscape image"
                    value={newTaskPrompt}
                    onChange={setNewTaskPrompt}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Reward Amount (MON)</span>
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
                  {isCreatingTask ? "Creating..." : "Publish Task"}
                </button>
              </div>
            </div>
          </div>

          {/* Message display */}
          {message && (
            <div
              className={`alert mb-6 ${
                message.includes("successfully")
                  ? "alert-success"
                  : message.includes("Failed")
                    ? "alert-error"
                    : "alert-info"
              }`}
            >
              <span>{message}</span>
            </div>
          )}

          {/* Task list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="card-title text-lg">Task #{task.id}</h3>
                    {getTaskStateBadge(task.state)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">Task Description:</span>
                      </label>
                      <p className="text-sm bg-base-200 p-3 rounded-lg">{task.prompt}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">Creator:</span>
                      </div>
                      <Address address={task.creator} format="short" />
                    </div>

                    {task.worker !== "0x0000000000000000000000000000000000000000" && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-success" />
                          <span className="text-sm">Worker:</span>
                        </div>
                        <Address address={task.worker} format="short" />
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-4 w-4 text-warning" />
                        <span className="text-sm">Reward:</span>
                      </div>
                      <span className="font-bold text-lg text-primary">{formatReward(task.reward)} MON</span>
                    </div>

                    {task.resultURI && (
                      <div>
                        <label className="label">
                          <span className="label-text font-semibold">Result Link:</span>
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

                  {/* Action buttons */}
                  <div className="card-actions justify-end mt-4">
                    {task.state === TaskState.Open && task.creator !== connectedAddress && (
                      <div className="space-y-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAcceptTask(task.id)}
                          disabled={!connectedAddress}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Accept Task
                        </button>
                      </div>
                    )}

                    {task.state === TaskState.InProgress && task.worker === connectedAddress && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => setSelectedTask(task)}
                        disabled={!connectedAddress}
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        Submit Result
                      </button>
                    )}

                    {task.state === TaskState.Completed && task.creator === connectedAddress && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproveTask(task.id)}
                        disabled={!connectedAddress}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve & Pay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit result modal */}
          {selectedTask && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Submit Task Result</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Result Link (Image URL)</span>
                  </label>
                  <InputBase
                    placeholder="e.g., https://cataas.com/cat/says/Your%20Result"
                    value={resultURI}
                    onChange={setResultURI}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Tip: You can visit{" "}
                      <a
                        href="https://cataas.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        cataas.com
                      </a>{" "}
                      to get random cat images as examples
                    </span>
                  </label>
                </div>
                <div className="modal-action">
                  <button className="btn btn-ghost" onClick={() => setSelectedTask(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmitResult(selectedTask.id)}
                    disabled={!resultURI}
                  >
                    Submit Result
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <PhotoIcon className="h-24 w-24 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tasks Available</h3>
              <p className="text-base-content/70">Be the first to publish a task!</p>
            </div>
          )}

          {/* Contract information */}
          <div className="bg-base-100 p-6 rounded-lg mt-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">🔗 Contract Information</h2>
            <div className="space-y-2">
              <p>
                <strong>AgentTaskManagerSimple:</strong> 0x6915716d240c64315960688E3Ef05ec07D8E6Db5
              </p>
            </div>
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Simplified Advantages</h3>
              <ul className="text-sm space-y-1">
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
