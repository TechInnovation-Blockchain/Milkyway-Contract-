pragma solidity >=0.5.16;

import '@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol';

import './core/interfaces/IMilkyPair.sol';
import './periphery/interfaces/IMilkyRouter02.sol';
import './core/interfaces/IMilkyFactory.sol';

contract Treasury is Ownable {
    using SafeMath for uint256;

    IMilkyRouter02 milkyRouter = IMilkyRouter02(0x913c4bB4521a1e5E9ED0C6A06A1D57fB4a3e1Eb8);

    address constant MILKY = 0x48d1d216213Eb2544b5968FdED6d7D2be1833B9c;
    address constant WSG = 0xA58950F05FeA2277d2608748412bf9F802eA4901;
    address constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    address constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address constant USDT = 0x55d398326f99059fF775485246999027B3197955;

    mapping(address => mapping(address => address[])) swapRoutes;

    mapping(address => uint256) lpTotalOut;
    mapping(address => mapping(address => uint256)) lpOutPerAction;

    constructor() public {
        // MILKY <- ANY TOKEN
        swapRoutes[MILKY][BUSD] = [WBNB];
        swapRoutes[MILKY][WSG] = [WBNB];
        swapRoutes[MILKY][USDT] = [BUSD, WBNB];
        // WSG <- ANY TOKEN
        swapRoutes[WSG][USDT] = [BUSD, WBNB];
        swapRoutes[WSG][BUSD] = [WBNB];
        // WBNB <- ANY TOKEN
        swapRoutes[WBNB][USDT] = [BUSD];
    }

    function setMilkyRouter(IMilkyRouter02 _router) public onlyOwner {
        milkyRouter = _router;
    }

    function setSwapRoutes(address from, address to, address[] memory routes) public onlyOwner {
        swapRoutes[to][from] = routes;
    }

    function _swapFor(address token, uint256 amount, address to) internal returns(uint) {
        address[] memory path = new address[](2);
        address[] storage route = swapRoutes[to][token];
        path[0] = token;
        for (uint i; i < route.length; i++) {
            path[1] = route[i];
            IBEP20(path[0]).approve(address(milkyRouter), amount);
            uint[] memory result = milkyRouter.swapExactTokensForTokens(amount, 0, path, address(this), type(uint256).max);
            amount = result[1];
            path[0] = path[1];
        }
        path[1] = to;
        IBEP20(path[0]).approve(address(milkyRouter), amount);
        uint[] memory result = milkyRouter.swapExactTokensForTokens(amount, 0, path, address(this), type(uint256).max);
        return result[1];
    }

    function _withdraw(uint256 percent, address to) internal returns (uint256) {
        uint256 total = 0;
        IMilkyFactory milkyFactory = IMilkyFactory(milkyRouter.factory());
        uint256 pairsLength = milkyFactory.allPairsLength();
        address _to = to == address(0) ? WBNB : to;
        for (uint i = 0; i < pairsLength; i++) {
            IMilkyPair pair = IMilkyPair(milkyFactory.allPairs(i));
            uint256 totalInput = lpTotalOut[address(pair)].add(pair.balanceOf(address(this)));
            if (totalInput > 0) {
                uint256 amount = totalInput.mul(percent).div(10000).min(lpOutPerAction[to][address(pair)]);
                lpTotalOut[address(pair)] = amount.add(lpTotalOut[address(pair)]);
                lpOutPerAction[to][address(pair)] = amount.add(lpOutPerAction[to][address(pair)]);
                address token0 = pair.token0();
                address token1 = pair.token1();
                pair.approve(address(milkyRouter), amount);
                (uint256 amountA, uint256 amountB) = milkyRouter.removeLiquidity(token0, token1, amount, 0, 0, address(this), type(uint256).max);
                if (token0 != _to) {
                    total = total.add(_swapFor(token0, amountA, _to));
                } else {
                    total = total.add(amountA);
                }
                if (token1 != _to) {
                    total = total.add(_swapFor(token1, amountB, _to));
                } else {
                    total = total.add(amountB);
                }
            }
        }
        return total;
    }

    event BuyBackBurn(address indexed token, uint256 amount);

    function buyBurnMilky(address burner) public onlyOwner {
        uint256 total = _withdraw(6250, MILKY);
        IBEP20(MILKY).transfer(burner, total);
        emit BuyBackBurn(MILKY, total);
    }

    function buyBurnWsg(address burner) public onlyOwner {
        uint256 total = _withdraw(2500, WSG);
        IBEP20(WSG).transfer(burner, total);
        emit BuyBackBurn(WSG, total);
    }

    function withdraw() public onlyOwner {
        uint256 total = _withdraw(1250, WBNB);
        IBEP20(WBNB).transfer(msg.sender, total);
    }

    function recover(address token, uint256 amount) public onlyOwner {
        IBEP20(token).transfer(msg.sender, amount);
    }
}