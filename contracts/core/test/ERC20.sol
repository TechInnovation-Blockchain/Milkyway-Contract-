pragma solidity >=0.5.16;

import '../MilkyERC20.sol';

contract ERC20 is MilkyERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
