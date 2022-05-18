import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

async function main() {
  const [_owner] = await ethers.getSigners()
  const MilkyFactory = await ethers.getContractFactory('MilkyFactory')
  const milkyFactory = await MilkyFactory.deploy(_owner.address)
  await milkyFactory.deployed()

  console.log('MilkyFactory is deployed to:', milkyFactory.address) // 0xe059dd40b54E1bB4c43C554c71F6B94BB6Bf56d4
  console.log('Init code pair hash:', await milkyFactory.INIT_CODE_PAIR_HASH()) // 0x7c22bb549804c47aab3ec8a29b6ddd541c4f019e87e6497cf97cb27d00737be8
  // please run the output of the below log for verification of this contract
  console.log(
    `npx hardhat verify --network bscTest ${milkyFactory.address} "${_owner.address}"`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
