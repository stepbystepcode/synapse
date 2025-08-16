// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTaskManagerSimple
 * @dev 简化版AI代理任务管理器，直接使用原生MON代币
 */
contract AgentTaskManagerSimple is ReentrancyGuard, Ownable {
    enum TaskState { Open, InProgress, Completed, Approved }
    
    struct Task {
        string prompt;
        uint256 reward;
        address creator;
        address worker;
        TaskState state;
        string resultURI;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    Task[] public tasks;
    mapping(address => uint256[]) public creatorTasks;
    mapping(address => uint256[]) public workerTasks;
    
    // 事件
    event TaskCreated(uint256 indexed taskId, address indexed creator, string prompt, uint256 reward);
    event TaskAccepted(uint256 indexed taskId, address indexed worker);
    event TaskCompleted(uint256 indexed taskId, address indexed worker, string resultURI);
    event TaskApproved(uint256 indexed taskId, address indexed creator, address indexed worker, uint256 reward);
    
    // 错误
    error InvalidPrompt();
    error InvalidReward();
    error TaskNotFound();
    error TaskNotOpen();
    error TaskNotInProgress();
    error TaskNotCompleted();
    error NotTaskCreator();
    error NotTaskWorker();
    error TransferFailed();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev 创建任务
     * @param _prompt 任务提示词
     */
    function createTask(string memory _prompt) external payable nonReentrant {
        if (bytes(_prompt).length == 0) revert InvalidPrompt();
        if (msg.value == 0) revert InvalidReward();
        
        uint256 taskId = tasks.length;
        tasks.push(Task({
            prompt: _prompt,
            reward: msg.value,
            creator: msg.sender,
            worker: address(0),
            state: TaskState.Open,
            resultURI: "",
            createdAt: block.timestamp,
            completedAt: 0
        }));
        
        creatorTasks[msg.sender].push(taskId);
        
        emit TaskCreated(taskId, msg.sender, _prompt, msg.value);
    }
    
    /**
     * @dev 接受任务
     * @param _taskId 任务ID
     */
    function acceptTask(uint256 _taskId) external nonReentrant {
        if (_taskId >= tasks.length) revert TaskNotFound();
        
        Task storage task = tasks[_taskId];
        if (task.state != TaskState.Open) revert TaskNotOpen();
        if (task.creator == msg.sender) revert TaskNotOpen(); // 创建者不能接受自己的任务
        
        task.worker = msg.sender;
        task.state = TaskState.InProgress;
        workerTasks[msg.sender].push(_taskId);
        
        emit TaskAccepted(_taskId, msg.sender);
    }
    
    /**
     * @dev 完成任务
     * @param _taskId 任务ID
     * @param _resultURI 结果URI
     */
    function completeTask(uint256 _taskId, string memory _resultURI) external nonReentrant {
        if (_taskId >= tasks.length) revert TaskNotFound();
        
        Task storage task = tasks[_taskId];
        if (task.worker != msg.sender) revert NotTaskWorker();
        if (task.state != TaskState.InProgress) revert TaskNotInProgress();
        
        task.resultURI = _resultURI;
        task.state = TaskState.Completed;
        task.completedAt = block.timestamp;
        
        emit TaskCompleted(_taskId, msg.sender, _resultURI);
    }
    
    /**
     * @dev 审核并支付任务
     * @param _taskId 任务ID
     */
    function approveTask(uint256 _taskId) external nonReentrant {
        if (_taskId >= tasks.length) revert TaskNotFound();
        
        Task storage task = tasks[_taskId];
        if (task.creator != msg.sender) revert NotTaskCreator();
        if (task.state != TaskState.Completed) revert TaskNotCompleted();
        
        task.state = TaskState.Approved;
        
        // 转账给工作者
        (bool success, ) = task.worker.call{value: task.reward}("");
        if (!success) revert TransferFailed();
        
        emit TaskApproved(_taskId, msg.sender, task.worker, task.reward);
    }
    
    /**
     * @dev 获取任务信息
     * @param _taskId 任务ID
     */
    function getTask(uint256 _taskId) external view returns (Task memory) {
        if (_taskId >= tasks.length) revert TaskNotFound();
        return tasks[_taskId];
    }
    
    /**
     * @dev 获取任务总数
     */
    function getTaskCount() external view returns (uint256) {
        return tasks.length;
    }
    
    /**
     * @dev 获取创建者的任务列表
     * @param _creator 创建者地址
     */
    function getTasksByCreator(address _creator) external view returns (uint256[] memory) {
        return creatorTasks[_creator];
    }
    
    /**
     * @dev 获取工作者的任务列表
     * @param _worker 工作者地址
     */
    function getTasksByWorker(address _worker) external view returns (uint256[] memory) {
        return workerTasks[_worker];
    }
    
    /**
     * @dev 获取所有任务
     * @param _start 开始索引
     * @param _count 数量
     */
    function getAllTasks(uint256 _start, uint256 _count) external view returns (Task[] memory) {
        uint256 end = _start + _count;
        if (end > tasks.length) {
            end = tasks.length;
        }
        if (_start >= tasks.length) {
            return new Task[](0);
        }
        
        Task[] memory result = new Task[](end - _start);
        for (uint256 i = _start; i < end; i++) {
            result[i - _start] = tasks[i];
        }
        return result;
    }
    
    /**
     * @dev 检查是否为任务创建者
     */
    function isTaskCreator(uint256 _taskId, address _user) external view returns (bool) {
        if (_taskId >= tasks.length) return false;
        return tasks[_taskId].creator == _user;
    }
    
    /**
     * @dev 检查是否为任务工作者
     */
    function isTaskWorker(uint256 _taskId, address _user) external view returns (bool) {
        if (_taskId >= tasks.length) return false;
        return tasks[_taskId].worker == _user;
    }
    
    /**
     * @dev 检查是否可以接受任务
     */
    function canAcceptTask(uint256 _taskId, address _user) external view returns (bool) {
        if (_taskId >= tasks.length) return false;
        Task storage task = tasks[_taskId];
        return task.state == TaskState.Open && task.creator != _user;
    }
    
    /**
     * @dev 检查是否可以完成任务
     */
    function canCompleteTask(uint256 _taskId, address _user) external view returns (bool) {
        if (_taskId >= tasks.length) return false;
        Task storage task = tasks[_taskId];
        return task.state == TaskState.InProgress && task.worker == _user;
    }
    
    /**
     * @dev 检查是否可以审核任务
     */
    function canApproveTask(uint256 _taskId, address _user) external view returns (bool) {
        if (_taskId >= tasks.length) return false;
        Task storage task = tasks[_taskId];
        return task.state == TaskState.Completed && task.creator == _user;
    }
    
    /**
     * @dev 紧急提取（仅合约所有者）
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev 接收ETH
     */
    receive() external payable {}
}
