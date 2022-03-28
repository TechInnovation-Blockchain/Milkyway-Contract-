import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import * as dotenv from 'dotenv'

async function main() {
  const [_owner] = await ethers.getSigners()
  const masterChef = await ethers.getContractAt(
    'MasterChef',
    process.env.MASTERCHEF_CONTRACT_ADDRESS
      ? process.env.MASTERCHEF_CONTRACT_ADDRESS
      : ''
  )

  // You can get LP token's address after add liquidity
  // test pools for MILKY/BNB
  const POOLS = [
    { lpToken: '0xe6ED8F0eF32a4958Ae77f1D76584147F0190F366', allocPoint: 2000 },
    { lpToken: '0xe6ED8F0eF32a4958Ae77f1D76584147F0190F366', allocPoint: 1000 },
    { lpToken: '0xe6ED8F0eF32a4958Ae77f1D76584147F0190F366', allocPoint: 500 },
    { lpToken: '0xe6ED8F0eF32a4958Ae77f1D76584147F0190F366', allocPoint: 100 },
  ]

  const poolLength = (await masterChef.poolLength()).toNumber()

  console.log('POOL Length', poolLength)
  // Please run one by on by commentting and uncommentting each line
  await masterChef.add(POOLS[0].allocPoint, POOLS[0].lpToken, true)
  // await masterChef.add(POOLS[1].allocPoint, POOLS[1].lpToken, true)
  // await masterChef.add(POOLS[2].allocPoint, POOLS[2].lpToken, true)
  // await masterChef.add(POOLS[3].allocPoint, POOLS[3].lpToken, true)

  // for (let i = 0; i < POOLS.length; i++) {
  //   console.log(POOLS[i])
  //   await masterChef.set(i + 1, POOLS[i].allocPoint, false)
  //   console.log(await masterChef.poolInfo(i + 1))
  // }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
