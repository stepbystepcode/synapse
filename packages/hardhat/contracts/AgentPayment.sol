// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title AgentPayment
 * @dev 一个简单的代理支付合约
 */
contract AgentPayment {
    // 事件
    event PaymentReceived(address indexed from, uint256 amount, string message);
    event PaymentWithdrawn(address indexed to, uint256 amount);
    
    // 状态变量
    address public owner;
    uint256 public totalPayments;
    mapping(address => uint256) public userPayments;
    
    // 修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // 构造函数
    constructor(address initialOwner) {
        owner = initialOwner;
    }
    
    /**
     * @dev 接收支付
     * @param message 支付消息
     */
    function makePayment(string memory message) external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        totalPayments += msg.value;
        userPayments[msg.sender] += msg.value;
        
        emit PaymentReceived(msg.sender, msg.value, message);
    }
    
    /**
     * @dev 获取合约余额
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 获取用户总支付金额
     */
    function getUserTotalPayment(address user) external view returns (uint256) {
        return userPayments[user];
    }
    
    /**
     * @dev 提取合约中的资金（仅所有者）
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit PaymentWithdrawn(owner, balance);
    }
    
    /**
     * @dev 接收 ETH
     */
    receive() external payable {}
}
