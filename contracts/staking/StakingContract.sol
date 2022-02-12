// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./StakingInterface.sol";

contract StakingContract is StakingInterface {
  // Assumed LP Token Standard
  // Token used for staking
  ERC20 stakingToken;

  // The default duration of stake lock-in (in seconds)
  uint256 public defaultLockInDuration;

  // Mapping to store cumulative stakes
  mapping (address => StakeContract) public stakeHolders;

  // Stakes made by address
  // unlockedTimestamp - when the stake unlocks (in seconds since Unix epoch)
  // actualAmount - the amount of tokens in the stake
  // stakedFor - the address the stake was staked for
  struct Stake {
    uint256 unlockedTimestamp;
    uint256 actualAmount;
    address stakedFor;
  }

  // Struct for all stake metadata at a particular address
  // totalStakedFor - the number of tokens staked for this address
  // personalStakeIndex - the index in the personalStakes array.
  // personalStakes - append only array of stakes made by this address
  // exists - whether or not there are stakes that involve this address
  struct StakeContract {
    uint256 totalStakedFor;
    uint256 personalStakeIndex;
    Stake[] personalStakes;
    bool exists;
  }

  // init --------------------------------

  constructor(ERC20 _stakingToken, uint256 _defaultLockInDuration) {
    stakingToken = _stakingToken;
    defaultLockInDuration = _defaultLockInDuration;
  }

  // helpers ------------------------------

  modifier canStake(address _address, uint256 _amount) {
    require(
      stakingToken.transferFrom(_address, address(this), _amount),
      "Stake required");
    _;
  }

  function totalStakesFor(address _address) internal view returns (uint256) {
    return stakeHolders[_address].personalStakes.length;
  }

  function createStake(
    address _address,
    uint256 _amount,
    uint256 _lockInDuration,
    bytes memory _data
  )
  internal
  canStake(msg.sender, _amount)
  {
    if (!stakeHolders[msg.sender].exists) {
      stakeHolders[msg.sender].exists = true;
    }

    stakeHolders[_address].totalStakedFor = stakeHolders[_address].totalStakedFor + _amount;
    stakeHolders[msg.sender].personalStakes.push(
      Stake(
        block.timestamp + _lockInDuration,
        _amount,
        _address)
    );

    emit Staked(
      totalStakesFor(_address),
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }

  function withdrawStake(
    uint256 _id,
    bytes memory _data
  )
  internal
  {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[_id - 1];

    // Check that the current stake has unlocked & matches the unstake amount
    require(
      personalStake.unlockedTimestamp <= block.timestamp,
      "The current stake hasn't unlocked yet");

    // Transfer the staked tokens from this contract back to the sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed beforehand.
    require(
      stakingToken.transfer(msg.sender, personalStake.actualAmount),
      "Unable to withdraw stake");

    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor].totalStakedFor - personalStake.actualAmount;

    emit Unstaked(
      _id,
      personalStake.stakedFor,
      personalStake.actualAmount,
      totalStakedFor(personalStake.stakedFor),
      _data);

    personalStake.actualAmount = 0;
  }

  // interface overrides -----------------------------------

  function stake(uint256 _amount, bytes memory _data) public virtual override {
    createStake(
      msg.sender,
      _amount,
      defaultLockInDuration,
      _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes memory _data) public virtual override {
    createStake(
      _user,
      _amount,
      defaultLockInDuration,
      _data);
  }

  function getStake(uint256 _id) public override view returns (uint256, uint256, address) {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[_id - 1];

    return (
      personalStake.unlockedTimestamp,
      personalStake.actualAmount,
      personalStake.stakedFor
    );
  }

  function unstake(uint256 _id, bytes memory _data) public override {
    withdrawStake(
      _id,
      _data);
  }

  function totalStakedFor(address _address) public override view returns (uint256) {
    return stakeHolders[_address].totalStakedFor;
  }

  function totalStakes() public override view returns (uint256) {
    return stakeHolders[msg.sender].personalStakes.length;
  }

  function totalStaked() public override view returns (uint256) {
    return stakingToken.balanceOf(address(this));
  }

  function token() public override view returns (address) {
    return address(stakingToken);
  }
}
