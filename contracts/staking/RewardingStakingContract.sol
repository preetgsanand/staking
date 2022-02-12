// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./StakingContract.sol";
import "./StakingBadgeToken.sol";


contract RewardingStakingContract is StakingContract {

    // init --------------------------------
    StakingBadgeToken stakingBadgeToken;

    constructor(ERC20 _stakingToken, uint256 _defaultLockInDuration, StakingBadgeToken _stakingBadgeToken)
        StakingContract(_stakingToken, _defaultLockInDuration) {
        stakingBadgeToken = _stakingBadgeToken;
    }

    // overrides ----------------------------

    function stake(uint256 _amount, bytes memory _data) public override {
        super.stake(
            _amount,
            _data);

        updateBadge(msg.sender);
    }

    function stakeFor(address _user, uint256 _amount, bytes memory _data) public override {
        super.stakeFor(
            _user,
            _amount,
            _data);

        updateBadge(_user);
    }

    // accessors ----------------------------

    function updateBadge(address _user) internal {
        uint256 totalStaked = totalStaked();
        uint256 totalStakedByUser = totalStakedFor(_user);
        uint256 minimumLevelDefiner = totalStaked / 10;
        uint256 levelDefiner = totalStaked / 3;

        if (totalStakedByUser > levelDefiner * 2) {
            stakingBadgeToken.award(_user, 3);
        } else if (totalStakedByUser > levelDefiner * 1) {
            stakingBadgeToken.award(_user, 2);
        } else if (totalStakedByUser > minimumLevelDefiner) {
            stakingBadgeToken.award(_user, 1);
        }
    }

    function getBadge() public view returns (uint256, uint256)  {
        return stakingBadgeToken.getBadgeFor(msg.sender);
    }
}