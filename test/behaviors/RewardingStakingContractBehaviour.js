const { assertRevert } = require('./helpers/assertRevert');

const { BigNumber } = web3

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const shouldBehaveLikeRewardingStakingContract = (accounts) => {
  const creator = accounts[0]
  const otherUser = accounts[1]

  describe('like a StakingContract', function () {

    describe('stake', function () {
      describe('when a single stake is created', function () {
        const stakeAmount = web3.utils.toBN('1')

        beforeEach(async function () {
          await this.stakeContract.stake(stakeAmount, 0x0)
        })

        it('should award first level badge to user', async function () {
          const badgeId = await this.stakingBadgeToken.getTotalBadges()
          const badge = await this.stakeContract.getBadge();
          const badgeOwner = await this.stakingBadgeToken.ownerOf(badgeId);

          expect(badge[0]).to.eql(web3.utils.toBN(1));
          expect(badge[1]).to.eql(web3.utils.toBN(1));
          expect(badgeOwner).to.equal(creator);
        })

        it('should award second level badge to user on continuous staking', async function () {
          await this.stakeContract.stake(stakeAmount, 0x0)

          const badgeId = await this.stakingBadgeToken.getTotalBadges()
          const badge = await this.stakeContract.getBadge();

          const badgeOwner = await this.stakingBadgeToken.ownerOf(badgeId);

          expect(badge[0]).to.eql(web3.utils.toBN(2));
          expect(badge[1]).to.eql(web3.utils.toBN(2));
          expect(badgeOwner).to.equal(creator);

          await assertRevert(
            this.stakingBadgeToken.ownerOf(web3.utils.toBN(1))
          );
        })

        it('should not be able to transfer ntt', async function () {
          const badgeId = await this.stakingBadgeToken.getTotalBadges()

          await assertRevert(
            this.stakingBadgeToken.transferFrom(creator, otherUser, web3.utils.toBN(badgeId))
          );
        })
      })
    })
  })
}

module.exports = {
  shouldBehaveLikeRewardingStakingContract
}