const { shouldBehaveLikeStakingContract } = require('./behaviors/StakingContractBehaviour');

const { BigNumber } = web3

const Erc20Token = artifacts.require('LPTokenMock.sol')
const StakingContract = artifacts.require('StakingContract.sol')

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('StakingContract', function (accounts) {
  const lockInDuration = web3.utils.toBN('7776000');

  beforeEach(async function () {
    this.erc20Token = await Erc20Token.new()
    this.stakeContract = await StakingContract.new(this.erc20Token.address, lockInDuration)

    await this.erc20Token.approve(this.stakeContract.address, web3.utils.toWei('100', 'ether'))
  })

  shouldBehaveLikeStakingContract(accounts, lockInDuration)
})
