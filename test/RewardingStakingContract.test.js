const { shouldBehaveLikeStakingContract } = require('./behaviors/StakingContractBehaviour');
const { shouldBehaveLikeRewardingStakingContract } = require('./behaviors/RewardingStakingContractBehaviour');

const { BigNumber } = web3

const Erc20Token = artifacts.require('LPTokenMock.sol')
const StakingBadgeToken = artifacts.require('StakingBadgeToken.sol')
const RewardingStakingContract = artifacts.require('RewardingStakingContract.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('RewardingStakingContract', function (accounts) {
  const lockInDuration = web3.utils.toBN('7776000');

  beforeEach(async function () {
    this.erc20Token = await Erc20Token.new()
    this.stakingBadgeToken = await StakingBadgeToken.new()
    this.stakeContract = await RewardingStakingContract.new(this.erc20Token.address,
        lockInDuration,
        this.stakingBadgeToken.address);

    await this.erc20Token.approve(this.stakeContract.address, web3.utils.toWei('100', 'ether'))
  })

  shouldBehaveLikeStakingContract(accounts, lockInDuration)
  shouldBehaveLikeRewardingStakingContract(accounts, lockInDuration)
})
