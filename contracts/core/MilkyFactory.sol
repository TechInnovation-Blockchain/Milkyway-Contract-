pragma solidity >=0.5.16;

import './interfaces/IMilkyFactory.sol';
import './MilkyPair.sol';

contract MilkyFactory is IMilkyFactory {
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(MilkyPair).creationCode));

    address override public feeTo;
    address override public feeToSetter;

    mapping(address => mapping(address => address)) override public getPair;
    address[] override public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() override external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) override external returns (address pair) {
        require(tokenA != tokenB, 'Milky: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'Milky: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'Milky: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(MilkyPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IMilkyPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) override external {
        require(msg.sender == feeToSetter, 'Milky: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) override external {
        require(msg.sender == feeToSetter, 'Milky: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
