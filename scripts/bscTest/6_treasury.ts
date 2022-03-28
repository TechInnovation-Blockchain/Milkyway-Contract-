import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

async function main() {
  const [_owner] = await ethers.getSigners()
  const Treasury = await ethers.getContractFactory('Treasury')
  const treasury = await Treasury.deploy()
  await treasury.deployed()

  const milkyFactory = await ethers.getContractAt(
    'MilkyFactory',
    process.env.MILKYFACTORY_CONTRACT_ADDRESS
      ? process.env.MILKYFACTORY_CONTRACT_ADDRESS
      : ''
  )
  await milkyFactory.setFeeTo(treasury.address)

  console.log('Treasury is deployed to:', treasury.address) // 0x318F8396f78c029234fA6d106c9cA06E6A47fbAC
  // please run the output of the below log for verification of this contract
  console.log(`npx hardhat verify --network bscTest ${treasury.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
