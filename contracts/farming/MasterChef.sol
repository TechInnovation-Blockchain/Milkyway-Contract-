pragma solidity 0.6.12;

import '@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol';

import './SyrupBar.sol';
import '../Milky.sol';

// MasterChef is the master of Milky. He can make Milky and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once MILKY is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 pending;    // How many Milky tokens the user get rewarded.
        uint256 depositTime;
        //
        // We do some fancy math here. Basically, any point in time, the amount of MILKYs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accMilkyPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accMilkyPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. MILKYs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that MILKYs distribution occurs.
        uint256 accMilkyPerShare; // Accumulated MILKYs per share, times 1e12. See below.
    }

    // The MILKY TOKEN!
    Milky public milky;
    // The SYRUP TOKEN!
    SyrupBar public syrup;
    // Dev address.
    address public devaddr;
    // MILKY tokens created per block.
    uint256 public milkyPerBlock;
    // Bonus muliplier for early milky makers.
    uint256 public BONUS_MULTIPLIER = 1;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when MILKY mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        Milky _milky,
        SyrupBar _syrup,
        address _devaddr,
        uint256 _milkyPerBlock,
        uint256 _startBlock
    ) public {
        milky = _milky;
        syrup = _syrup;
        devaddr = _devaddr;
        milkyPerBlock = _milkyPerBlock;
        startBlock = _startBlock;

        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _milky,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accMilkyPerShare: 0
        }));

        totalAllocPoint = 1000;
    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        BONUS_MULTIPLIER = multiplierNumber;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accMilkyPerShare: 0
        }));
        updateStakingPool();
    }

    // Update the given pool's MILKY allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
            updateStakingPool();
        }
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points = points.add(poolInfo[pid].allocPoint);
        }
        if (points != 0) {
            points = points.div(3);
            totalAllocPoint = totalAllocPoint.sub(poolInfo[0].allocPoint).add(points);
            poolInfo[0].allocPoint = points;
        }
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    // View function to see pending MILKYs on frontend.
    function pendingMilky(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accMilkyPerShare = pool.accMilkyPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 milkyReward = multiplier.mul(milkyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accMilkyPerShare = accMilkyPerShare.add(milkyReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accMilkyPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }


    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 milkyReward = multiplier.mul(milkyPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        milky.mintTo(devaddr, milkyReward.div(10));
        milky.mintTo(address(syrup), milkyReward);
        pool.accMilkyPerShare = pool.accMilkyPerShare.add(milkyReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for MILKY allocation.
    function deposit(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'deposit MILKY by staking');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accMilkyPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                if (block.timestamp <= user.depositTime + 90 days) {
                    uint256 released = pending.mul(25).div(100);
                    user.pending = user.pending.add(pending.sub(released));
                    safeMilkyTransfer(msg.sender, released);
                } else {
                    safeMilkyTransfer(msg.sender, user.pending.add(pending));
                    user.pending = 0;
                }
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
            user.depositTime = block.timestamp;
        }
        user.rewardDebt = user.amount.mul(pool.accMilkyPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'withdraw MILKY by unstaking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accMilkyPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            if (block.timestamp <= user.depositTime + 90 days) {
                uint256 released = pending.mul(25).div(100);
                user.pending = user.pending.add(pending.sub(released));
                safeMilkyTransfer(msg.sender, released);
            } else {
                safeMilkyTransfer(msg.sender, user.pending.add(pending));
                user.pending = 0;
            }
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accMilkyPerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Stake MILKY tokens to MasterChef
    function enterStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accMilkyPerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                safeMilkyTransfer(msg.sender, pending);
            }
        }
        if(_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accMilkyPerShare).div(1e12);

        syrup.mint(msg.sender, _amount);
        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw MILKY tokens from STAKING.
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 pending = user.amount.mul(pool.accMilkyPerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            safeMilkyTransfer(msg.sender, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accMilkyPerShare).div(1e12);

        syrup.burn(msg.sender, _amount);
        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        user.pending = 0;
        user.depositTime = 0;
    }

    // Safe milky transfer function, just in case if rounding error causes pool to not have enough MILKYs.
    function safeMilkyTransfer(address _to, uint256 _amount) internal {
        syrup.safeMilkyTransfer(_to, _amount);
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}
