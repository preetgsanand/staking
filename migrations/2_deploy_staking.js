const Erc20Token = artifacts.require('LPTokenMock.sol')
const StakingBadgeToken = artifacts.require('StakingBadgeToken.sol')
const RewardingStakingContract = artifacts.require('RewardingStakingContract.sol')

module.exports = async (deployer) => {
  const lockInDuration = web3.utils.toBN('7776000');
  const erc20Token = await Erc20Token.new()

  console.log("Deployed ERC20 Contract at: ", erc20Token.address);

  const stakingBadgeToken = await StakingBadgeToken.new()

  console.log("Deployed Staking Badge Token at: ", stakingBadgeToken.address);

  const stakeContract = await RewardingStakingContract.new(
      erc20Token.address,
      lockInDuration,
      stakingBadgeToken.address
  );

  console.log("Deployed Staking Contract at: ", stakeContract.address);
};
