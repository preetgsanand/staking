const { assertRevert } = require('./helpers/assertRevert');
const { increaseTime } = require('./helpers/increaseTime');

const { BigNumber } = web3

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const shouldBehaveLikeStakingContract = (accounts, lockInDuration) => {
  const creator = accounts[0]
  const otherUser = accounts[1]

  describe('like a StakingContract', function () {

    describe('totalStaked', function () {
      it('should be 0 by default', async function () {
        const totalStaked = await this.stakeContract.totalStaked()
        expect(totalStaked).to.eql(web3.utils.toBN('0'));
      })
    })

    describe('totalStakedFor', function () {
      it('should be 0 by default', async function () {
        const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
        expect(totalStakedFor).to.eql(web3.utils.toBN('0'));
      })
    })

    describe('token', function () {
      it('should return the address of the ERC20 token used for staking', async function () {
        const tokenAddress = await this.stakeContract.token()
        expect(tokenAddress).to.equal(this.erc20Token.address)
      })
    })

    describe('defaultLockInDuration', function () {
      it('should be the value passed in the constructor', async function () {
        const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
        expect(tokenLockInDuration).to.eql(lockInDuration)
      })
    })

    describe('when a user stakes tokens', function () {
      beforeEach(async function () {
        await this.stakeContract.stake(web3.utils.toBN('1'), 0x0)
      })

      describe('totalStaked', function () {
        it('should increase', async function () {
          const totalStaked = await this.stakeContract.totalStaked()
          expect(totalStaked).to.eql(web3.utils.toBN('1'))
        })

        it('should be equivalent to balanceOf on the token contract', async function () {
          const totalStaked = await this.stakeContract.totalStaked()
          const balanceOf = await this.erc20Token.balanceOf(this.stakeContract.address)
          expect(totalStaked).to.eql(balanceOf)
        })

        it('should increase when another user stakes tokens', async function () {
          await this.erc20Token.transfer(otherUser, web3.utils.toBN('50'))

          await this.erc20Token.approve(
            this.stakeContract.address,
            web3.utils.toBN('100'),
            { from: otherUser }
          )

          await this.stakeContract.stake(web3.utils.toBN('1'), 0x0, { from: otherUser })

          const totalStaked = await this.stakeContract.totalStaked()
          expect(totalStaked).to.eql(web3.utils.toBN('2'))
        })
      })

      describe('totalStakedFor', function () {
        it('should increase', async function () {
          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          expect(totalStakedFor).to.eql(web3.utils.toBN('1'))
        })

        it('should increase when another user stakes tokens on their behalf', async function () {
          await this.erc20Token.transfer(otherUser, web3.utils.toBN('50'))

          await this.erc20Token.approve(
            this.stakeContract.address,
              web3.utils.toBN('100'),
            { from: otherUser }
          )

          await this.stakeContract.stakeFor(
            creator,
              web3.utils.toBN('1'),
            0x0,
            { from: otherUser }
          )

          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          expect(totalStakedFor).to.eql(web3.utils.toBN('2'))
        })
      })

      describe('and then unstakes tokens', function () {
        beforeEach(async function () {
          // Changing the timestamp of the next block so the stake is unlocked
          const tokenLockInDuration = await this.stakeContract.defaultLockInDuration()
          await increaseTime(tokenLockInDuration.toNumber())

          await this.stakeContract.unstake(web3.utils.toBN('1'), 0x0)
        })

        describe('totalStaked', function () {
          it('should decrease', async function () {
            const totalStaked = await this.stakeContract.totalStaked()
            expect(totalStaked).to.eql(web3.utils.toBN('0'))
          })
        })

        describe('totalStakedFor', function () {
          it('should decrease', async function () {
            const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
            expect(totalStakedFor).to.eql(web3.utils.toBN('0'))
          })
        })
      })
    })

    describe('stake', function () {
      describe('when a single stake is created', function () {
        const stakeAmount = web3.utils.toBN('1')
        let blockTimestamp
        let tx

        beforeEach(async function () {
          tx = await this.stakeContract.stake(stakeAmount, 0x0)
          const { blockNumber } = tx.logs[0]
          let block = await web3.eth.getBlock(blockNumber);
          blockTimestamp = block.timestamp;
        })

        it('should create a new personal stake with the correct properties', async function () {
          const personalStakeUnlockedTimestamps = await this.stakeContract.getPersonalStakeUnlockedTimestamps(creator)
          expect(personalStakeUnlockedTimestamps.length).to.equal(1);
          const totalTimestamp = web3.utils.toBN(blockTimestamp).add(web3.utils.toBN(lockInDuration));
          expect(personalStakeUnlockedTimestamps[0].toString()).to.equal(totalTimestamp.toString());

          const personalStakeForAddresses = await this.stakeContract.getPersonalStakeForAddresses(creator)
          expect(personalStakeForAddresses.length).to.equal(1)
          expect(personalStakeForAddresses[0]).to.equal(creator);

          const personalStakeAmounts = await this.stakeContract.getPersonalStakeActualAmounts(creator)
          expect(personalStakeAmounts.length).to.equal(1);
          expect(personalStakeAmounts[0]).to.eql(stakeAmount);
        })

        it('should emit a Staked event', async function () {
          const { logs } = tx

          expect(logs.length).to.equal(1)
          expect(logs[0].event).to.equal('Staked')
          expect(logs[0].args.user).to.equal(creator)
          expect(logs[0].args.amount).to.eql(stakeAmount)
          expect(logs[0].args.total).to.eql(stakeAmount)
          expect(logs[0].args.data).to.equal('0x00')
        })
      })

      describe('when multiple stakes are created', function () {
        it('should allow a user to create multiple stakes', async function () {
          await this.stakeContract.stake(web3.utils.toBN('1'), 0x0)
        })
      })
    })

    describe('stakeFor', function () {
      describe('when a user stakes on behalf of another user', function () {
        const stakeAmount = web3.utils.toBN('1')
        let originalTotalStakedFor
        let tx

        beforeEach(async function () {
          originalTotalStakedFor = await this.stakeContract.totalStakedFor(creator)
          tx = await this.stakeContract.stakeFor(otherUser, stakeAmount, 0x0)
        })

        it('should create a personal stake for the staker', async function () {
          const personalStakeForAddresses = await this.stakeContract.getPersonalStakeForAddresses(creator)
          expect(personalStakeForAddresses.length).to.equal(1);
          expect(personalStakeForAddresses[0]).to.equal(otherUser);
        })

        it('should not change the number of tokens staked for the user', async function () {
          const totalStakedFor = await this.stakeContract.totalStakedFor(creator)
          expect(totalStakedFor).to.eql(originalTotalStakedFor);
        })

        it('should increase the number of tokens staked for the other user', async function () {
          const totalStakedForOtherUser = await this.stakeContract.totalStakedFor(otherUser)
          expect(totalStakedForOtherUser).to.eql(stakeAmount);
        })

        it('should emit a Staked event', async function () {
          const { logs } = tx

          expect(logs.length).to.equal(1);
          expect(logs[0].event).to.equal('Staked');
          expect(logs[0].args.user).to.equal(otherUser);
          expect(logs[0].args.amount).to.eql(stakeAmount);
          expect(logs[0].args.total).to.eql(stakeAmount);
          expect(logs[0].args.data).to.equal('0x00');
        })
      })
    })

    describe('unstake', function () {
      beforeEach(async function () {
        await this.stakeContract.stake(web3.utils.toBN('10'), 0x0)
      })

      describe('when the stake is locked', function () {
        it('should revert', async function () {
          await assertRevert(
            this.stakeContract.unstake(web3.utils.toBN('10'), 0x0)
          )
        })
      })

      describe('when the unstake amount is incorrect', function () {
        it('should revert', async function () {
          await assertRevert(
            this.stakeContract.unstake(web3.utils.toBN('1'), 0x0)
          )
        })
      })

      describe('when called correctly', function () {
        const unstakeAmount = web3.utils.toBN('10');
        let tx;
        let originalBalance;

        beforeEach(async function () {
          const tokenLockInDuration = await this.stakeContract.defaultLockInDuration();
          await increaseTime(tokenLockInDuration.toNumber());

          originalBalance = await this.erc20Token.balanceOf(creator);

          tx = await this.stakeContract.unstake(unstakeAmount, 0x0);
        })

        it('should emit an Unstaked event', async function () {
          const { logs } = tx

          expect(logs.length).to.equal(1);
          expect(logs[0].event).to.equal('Unstaked');
          expect(logs[0].args.user).to.equal(creator);
          expect(logs[0].args.amount).to.eql(unstakeAmount);
          expect(logs[0].args.total).to.eql(web3.utils.toBN('0'));
          expect(logs[0].args.data).to.equal('0x00');
        })

        it('should decrement the number of the personal stakes', async function () {
          const personalStakeUnlockedTimestamps = await this.stakeContract.getPersonalStakeUnlockedTimestamps(creator)
          expect(personalStakeUnlockedTimestamps.length).to.equal(0);
        })

        it('should return the tokens back to the user', async function () {
          const newBalance = await this.erc20Token.balanceOf(creator)
          const balance = originalBalance.add(web3.utils.toBN('10'));
          expect(newBalance.toString()).to.eql(balance.toString());
        })
      })
    })
  })
}

module.exports = {
  shouldBehaveLikeStakingContract
}