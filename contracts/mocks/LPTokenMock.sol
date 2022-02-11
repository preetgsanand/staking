// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract LPTokenMock is ERC20 {
  constructor() ERC20("LPTokenMock", 'LPM') {
    _mint(msg.sender, 100000 * 10 ** 18);
  }
}
