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

  function getPersonalStakes(
    address _address
  )
  view
  public
  returns(uint256[] memory, uint256[] memory, address[] memory)
  {
    StakeContract storage stakeContract = stakeHolders[_address];

    uint256 arraySize = stakeContract.personalStakes.length - stakeContract.personalStakeIndex;
    uint256[] memory unlockedTimestamps = new uint256[](arraySize);
    uint256[] memory actualAmounts = new uint256[](arraySize);
    address[] memory stakedFor = new address[](arraySize);

    for (uint256 i = stakeContract.personalStakeIndex; i < stakeContract.personalStakes.length; i++) {
      uint256 index = i - stakeContract.personalStakeIndex;
      unlockedTimestamps[index] = stakeContract.personalStakes[i].unlockedTimestamp;
      actualAmounts[index] = stakeContract.personalStakes[i].actualAmount;
      stakedFor[index] = stakeContract.personalStakes[i].stakedFor;
    }

    return (
    unlockedTimestamps,
    actualAmounts,
    stakedFor
    );
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
      _address,
      _amount,
      totalStakedFor(_address),
      _data);
  }

  function withdrawStake(
    uint256 _amount,
    bytes memory _data
  )
  internal
  {
    Stake storage personalStake = stakeHolders[msg.sender].personalStakes[stakeHolders[msg.sender].personalStakeIndex];

    // Check that the current stake has unlocked & matches the unstake amount
    require(
      personalStake.unlockedTimestamp <= block.timestamp,
      "The current stake hasn't unlocked yet");

    require(
      personalStake.actualAmount == _amount,
      "The unstake amount does not match the current stake");

    // Transfer the staked tokens from this contract back to the sender
    // Notice that we are using transfer instead of transferFrom here, so
    //  no approval is needed beforehand.
    require(
      stakingToken.transfer(msg.sender, _amount),
      "Unable to withdraw stake");

    stakeHolders[personalStake.stakedFor].totalStakedFor = stakeHolders[personalStake.stakedFor].totalStakedFor - personalStake.actualAmount;

    personalStake.actualAmount = 0;
    stakeHolders[msg.sender].personalStakeIndex++;

    emit Unstaked(
      personalStake.stakedFor,
      _amount,
      totalStakedFor(personalStake.stakedFor),
      _data);
  }

  // accessors -----------------------------------

  function getPersonalStakeUnlockedTimestamps(address _address) external view returns (uint256[] memory) {
    uint256[] memory timestamps;
    (timestamps,,) = getPersonalStakes(_address);

    return timestamps;
  }

  function getPersonalStakeActualAmounts(address _address) external view returns (uint256[] memory) {
    uint256[] memory actualAmounts;
    (,actualAmounts,) = getPersonalStakes(_address);

    return actualAmounts;
  }

  function getPersonalStakeForAddresses(address _address) external view returns (address[] memory) {
    address[] memory stakedFor;
    (,,stakedFor) = getPersonalStakes(_address);

    return stakedFor;
  }

  function stake(uint256 _amount, bytes memory _data) public override {
    createStake(
      msg.sender,
      _amount,
      defaultLockInDuration,
      _data);
  }

  function stakeFor(address _user, uint256 _amount, bytes memory _data) public override {
    createStake(
      _user,
      _amount,
      defaultLockInDuration,
      _data);
  }

  function unstake(uint256 _amount, bytes memory _data) public override {
    withdrawStake(
      _amount,
      _data);
  }

  function totalStakedFor(address _address) public override view returns (uint256) {
    return stakeHolders[_address].totalStakedFor;
  }

  function totalStaked() public override view returns (uint256) {
    return stakingToken.balanceOf(address(this));
  }

  function token() public override view returns (address) {
    return address(stakingToken);
  }
}
