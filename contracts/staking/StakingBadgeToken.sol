// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StakingBadgeToken is ERC721 {
    struct Badge {
        uint256 id;
        uint256 level;
    }

    mapping (address => Badge) public badgeHolders;
    uint256 public totalBadges;

    constructor() ERC721("Staking Badge", "SBT") {

    }

    function award(address _user, uint256 _level) public payable {
        if(badgeHolders[_user].level < _level) {
            if (badgeHolders[_user].id != 0) {
                _burn(badgeHolders[_user].id);
            }
            totalBadges = totalBadges + 1;
            super._safeMint(_user, totalBadges, "");
            badgeHolders[_user] = Badge(totalBadges, badgeHolders[_user].level + 1);
        }
    }

    function getBadgeFor(address _user) public view returns (uint256, uint256) {
        return (
            badgeHolders[_user].id,
            badgeHolders[_user].level
        );
    }

    function getTotalBadges() public view returns (uint256) {
        return totalBadges;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public override pure {
        revert('Transfer not allowed');
    }

    function safeTransferFrom(
        address,
        address,
        uint256
    ) public override pure {
        revert('Transfer not allowed');
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public override pure {
        revert('Transfer not allowed');
    }
}