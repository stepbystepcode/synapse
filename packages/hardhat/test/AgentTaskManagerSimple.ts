import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@ethersproject/contracts/node_modules/@nomiclabs/hardhat-ethers/signers";

describe("AgentTaskManagerSimple", function () {
  let agentTaskManagerSimple: Contract;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let worker: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, worker, user3] = await ethers.getSigners();

    const AgentTaskManagerSimple = await ethers.getContractFactory("AgentTaskManagerSimple");
    agentTaskManagerSimple = await AgentTaskManagerSimple.deploy();
  });

  describe("部署", function () {
    it("应该正确部署", async function () {
      expect(await agentTaskManagerSimple.owner()).to.equal(owner.address);
      expect(await agentTaskManagerSimple.getTaskCount()).to.equal(0);
    });
  });

  describe("创建任务", function () {
    it("应该成功创建任务", async function () {
      const taskPrompt = "测试任务";
      const taskReward = ethers.parseEther("0.1"); // 0.1 MON

      await expect(agentTaskManagerSimple.connect(creator).createTask(taskPrompt, { value: taskReward }))
        .to.emit(agentTaskManagerSimple, "TaskCreated")
        .withArgs(0, creator.address, taskPrompt, taskReward);

      const task = await agentTaskManagerSimple.getTask(0);
      expect(task.prompt).to.equal(taskPrompt);
      expect(task.reward).to.equal(taskReward);
      expect(task.creator).to.equal(creator.address);
      expect(task.state).to.equal(0); // Open
    });

    it("应该拒绝空提示词", async function () {
      await expect(
        agentTaskManagerSimple.connect(creator).createTask("", { value: ethers.parseEther("0.1") }),
      ).to.be.revertedWithCustomError(agentTaskManagerSimple, "InvalidPrompt");
    });

    it("应该拒绝零奖励", async function () {
      await expect(
        agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: 0 }),
      ).to.be.revertedWithCustomError(agentTaskManagerSimple, "InvalidReward");
    });
  });

  describe("接受任务", function () {
    beforeEach(async function () {
      await agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: ethers.parseEther("0.1") });
    });

    it("应该成功接受任务", async function () {
      await expect(agentTaskManagerSimple.connect(worker).acceptTask(0))
        .to.emit(agentTaskManagerSimple, "TaskAccepted")
        .withArgs(0, worker.address);

      const task = await agentTaskManagerSimple.getTask(0);
      expect(task.worker).to.equal(worker.address);
      expect(task.state).to.equal(1); // InProgress
    });

    it("应该拒绝创建者接受自己的任务", async function () {
      await expect(agentTaskManagerSimple.connect(creator).acceptTask(0)).to.be.revertedWithCustomError(
        agentTaskManagerSimple,
        "TaskNotOpen",
      );
    });

    it("应该拒绝接受不存在的任务", async function () {
      await expect(agentTaskManagerSimple.connect(worker).acceptTask(999)).to.be.revertedWithCustomError(
        agentTaskManagerSimple,
        "TaskNotFound",
      );
    });
  });

  describe("完成任务", function () {
    beforeEach(async function () {
      await agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: ethers.parseEther("0.1") });
      await agentTaskManagerSimple.connect(worker).acceptTask(0);
    });

    it("应该成功完成任务", async function () {
      const resultURI = "https://example.com/result";

      await expect(agentTaskManagerSimple.connect(worker).completeTask(0, resultURI))
        .to.emit(agentTaskManagerSimple, "TaskCompleted")
        .withArgs(0, worker.address, resultURI);

      const task = await agentTaskManagerSimple.getTask(0);
      expect(task.resultURI).to.equal(resultURI);
      expect(task.state).to.equal(2); // Completed
      expect(task.completedAt).to.be.gt(0);
    });

    it("应该拒绝非工作者完成任务", async function () {
      await expect(
        agentTaskManagerSimple.connect(user3).completeTask(0, "https://example.com/result"),
      ).to.be.revertedWithCustomError(agentTaskManagerSimple, "NotTaskWorker");
    });
  });

  describe("审核任务", function () {
    beforeEach(async function () {
      await agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: ethers.parseEther("0.1") });
      await agentTaskManagerSimple.connect(worker).acceptTask(0);
      await agentTaskManagerSimple.connect(worker).completeTask(0, "https://example.com/result");
    });

    it("应该成功审核并支付任务", async function () {
      const workerBalanceBefore = await ethers.provider.getBalance(worker.address);

      await expect(agentTaskManagerSimple.connect(creator).approveTask(0))
        .to.emit(agentTaskManagerSimple, "TaskApproved")
        .withArgs(0, creator.address, worker.address, ethers.parseEther("0.1"));

      const task = await agentTaskManagerSimple.getTask(0);
      expect(task.state).to.equal(3); // Approved

      const workerBalanceAfter = await ethers.provider.getBalance(worker.address);
      expect(workerBalanceAfter).to.be.gt(workerBalanceBefore);
    });

    it("应该拒绝非创建者审核任务", async function () {
      await expect(agentTaskManagerSimple.connect(user3).approveTask(0)).to.be.revertedWithCustomError(
        agentTaskManagerSimple,
        "NotTaskCreator",
      );
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await agentTaskManagerSimple.connect(creator).createTask("任务1", { value: ethers.parseEther("0.1") });
      await agentTaskManagerSimple.connect(creator).createTask("任务2", { value: ethers.parseEther("0.2") });
    });

    it("应该正确返回任务总数", async function () {
      const count = await agentTaskManagerSimple.getTaskCount();
      expect(count).to.equal(2);
    });

    it("应该正确返回创建者的任务", async function () {
      const creatorTasks = await agentTaskManagerSimple.getTasksByCreator(creator.address);
      expect(creatorTasks).to.deep.equal([0, 1]);
    });

    it("应该正确返回所有任务", async function () {
      const allTasks = await agentTaskManagerSimple.getAllTasks(0, 10);
      expect(allTasks.length).to.equal(2);
      expect(allTasks[0].prompt).to.equal("任务1");
      expect(allTasks[1].prompt).to.equal("任务2");
    });
  });

  describe("权限检查", function () {
    beforeEach(async function () {
      await agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: ethers.parseEther("0.1") });
    });

    it("应该正确检查任务创建者", async function () {
      const isCreator = await agentTaskManagerSimple.isTaskCreator(0, creator.address);
      const isNotCreator = await agentTaskManagerSimple.isTaskCreator(0, worker.address);
      expect(isCreator).to.be.true;
      expect(isNotCreator).to.be.false;
    });

    it("应该正确检查是否可以接受任务", async function () {
      const canAccept = await agentTaskManagerSimple.canAcceptTask(0, worker.address);
      const cannotAccept = await agentTaskManagerSimple.canAcceptTask(0, creator.address);
      expect(canAccept).to.be.true;
      expect(cannotAccept).to.be.false;
    });
  });

  describe("完整工作流程", function () {
    it("应该完成完整的任务流程", async function () {
      // 1. 创建任务
      await agentTaskManagerSimple.connect(creator).createTask("完整测试任务", { value: ethers.parseEther("0.1") });

      // 2. 接受任务
      await agentTaskManagerSimple.connect(worker).acceptTask(0);

      // 3. 完成任务
      await agentTaskManagerSimple.connect(worker).completeTask(0, "https://example.com/result");

      // 4. 审核并支付
      await agentTaskManagerSimple.connect(creator).approveTask(0);

      // 验证最终状态
      const task = await agentTaskManagerSimple.getTask(0);
      expect(task.state).to.equal(3); // Approved
      expect(task.creator).to.equal(creator.address);
      expect(task.worker).to.equal(worker.address);
    });
  });

  describe("紧急提取", function () {
    it("应该允许所有者提取合约余额", async function () {
      // 先创建一些任务
      await agentTaskManagerSimple.connect(creator).createTask("测试任务", { value: ethers.parseEther("0.1") });

      const contractBalance = await ethers.provider.getBalance(await agentTaskManagerSimple.getAddress());
      expect(contractBalance).to.equal(ethers.parseEther("0.1"));

      await agentTaskManagerSimple.connect(owner).emergencyWithdraw();

      const newContractBalance = await ethers.provider.getBalance(await agentTaskManagerSimple.getAddress());
      expect(newContractBalance).to.equal(0);
    });

    it("应该拒绝非所有者提取", async function () {
      await expect(agentTaskManagerSimple.connect(creator).emergencyWithdraw()).to.be.revertedWithCustomError(
        agentTaskManagerSimple,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
