# milkyswap
### 1. Installation
yarn install
### 2. Compile
npx hardhat compile
### 3. Test
npx hardhat test test/milky-router.ts
### 4. Setting Environment Variables
Please rename the .env.example to .env. And fill the informations required.
### 5. Deploy
#### 5.1. MilkyFactory contract
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/1_core.ts --network bscTest
```
After deployed contract, you can copy the output's line of the above command on terminal and run it for verification of this contract.
```shell
npx hardhat verify --network bscTest 0x9bC3...a938 "0xB8ce...2811"
```

#### 5.2. MilkyRouter contract
Please confirm the environment variables MILKYFACTORY_CONTRACT_ADDRESS, WBNB_CONTRACT_ADDRESS in .env file. <br>
Then, run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/2_periphery.ts --network bscTest
```
After deployed contract, you can copy the output's line of the above command on terminal and run it for verification of this contract.
```shell
npx hardhat verify --network bscTest 0x913c...e1Eb8 "0x9bC3...a938" "0x0946...ca81F"
```

#### 5.3. Milky contract
Please confirm the environment variables MILKY_INITIAL_SUPPLY in .env file. <br>
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/3_milky.ts --network bscTest
```
After deployed contract, you can copy the output's line of the above command on terminal and run it for verification of this contract.
```shell
npx hardhat verify --network bscTest 0x48d1...3B9c "1000000"
```

#### 5.4. MasterChef contract
Please confirm the environment variables MILKY_CONTRACT_ADDRESS, ACCOUNT_DEV, MILKY_EMISSION_RATE in .env file. <br>
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/4_farming.ts --network bscTest
```
After deployed contract, you can copy the output's line of the above command on terminal and run it for verification of this contract.
```shell
npx hardhat verify --network bscTest ...
```
#### 5.5. Add farming pool
Please confirm the environment variables MASTERCHEF_CONTRACT_ADDRESS in .env file and pool list in scripts/bscTest/5_add_farming.ts file. <br>
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/5_add_farming.ts --network bscTest
```

#### 5.6. Treasury contract
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/6_treasury.ts --network bscTest
```
After deployed contract, you can copy the output's line of the above command on terminal and run it for verification of this contract.
```shell
npx hardhat verify --network bscTest ...
```

#### 5.7. Transfer ownership
Run the blow command on terminal in the root directory of the project.
```shell
npx hardhat run scripts/bscTest/7_ownership.ts --network bscTest
```

### 6. For frontend (Test)
#### 6.1. MILKY
Please use <code>artifiacts/contracts/Milky.sol/Milky.json</code> and <code>0xCF2f1af5533DBf2F79f35c5B0e0F5B25bD71E601</code> on BSC Testnet.
#### 6.2 MilkyFactory
Please use <code>artifiacts/contracts/core/MilkyFactory.json</code> and <code>0x90Ca14f003d86c84eE620d0D687128a5Fe0D71e7</code> on BSC Testnet.
#### 6.3. MilkyRouter (For add/remove liquidity and swap tokens)
Please use <code>artifiacts/contracts/periphery/MilkyRouter.sol/MilkyRouter.json</code> and <code>0xd601C5CB0D73990BB739dF60582fBd57F5Fe487D</code> on BSC Testnet.<br>
By using below functions, you can test addLiquidity/removeLiquidity and swap functions. You can reference from examples related to Uniswap.
##### function addLiquidityETH (MILKY/BNB)
##### function removeLiquidityETH (MILKY/BNB)
##### function swapExactTokensForETH (MILKY/BNB)
#### 6.4. MasterChef (For farming)
Please use <code>artifiacts/contracts/farming/MasterChef.sol/MasterChef.json</code> and <code>0x4E873b762c1f689F0303EFc2fA160B1aC73a69E7</code> on BSC Testnet.<br>
##### function poolLength
Get the length of pools including staking pool.
##### function poolInfo
Get the Pool's information by index.
##### function pendingMilky
Get the number of pending milky tokens of depositor in a pool
##### function deposit
Deposit LP to the pool
##### function withdraw
Withraw LP from the pool