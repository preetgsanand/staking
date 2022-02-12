// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

abstract contract StakingInterface {
  event Staked(
    uint256 indexed id,
    address indexed user,
    uint256 amount,
    uint256 total,
    bytes data
  );

  event Unstaked(
    uint256 indexed id,
    address indexed user,
    uint256 amount,
    uint256 total,
    bytes data
  );

  function stake(uint256 amount, bytes memory data) public virtual;
  function stakeFor(address user, uint256 amount, bytes memory data) public virtual;
  function unstake(uint256 id, bytes memory data) public virtual;
  function getStake(uint256 id) public virtual view returns (uint256, uint256, address);

  function totalStaked() public virtual view returns (uint256);
  function totalStakes() public virtual view returns (uint256);
  function totalStakedFor(address addr) public virtual view returns (uint256);

  function token() public virtual view returns (address);
}
