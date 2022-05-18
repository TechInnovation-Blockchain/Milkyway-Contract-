import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'

async function main() {
  const MilkyRouter = await ethers.getContractFactory('MilkyRouter')
  const milkyRouter = await MilkyRouter.deploy(
    process.env.MILKYFACTORY_CONTRACT_ADDRESS
      ? process.env.MILKYFACTORY_CONTRACT_ADDRESS
      : '',
    process.env.WBNB_CONTRACT_ADDRESS ? process.env.WBNB_CONTRACT_ADDRESS : ''
  )
  await milkyRouter.deployed()

  console.log('MilkyRouter is deployed to:', milkyRouter.address) // 0x16F993EdFB1BcAA25A638D98f0d077D2A7F98cAF
  // please run the output of the below log for verification of this contract
  console.log(
    `npx hardhat verify --network bscTest ${milkyRouter.address} "${process.env.MILKYFACTORY_CONTRACT_ADDRESS}" "${process.env.WBNB_CONTRACT_ADDRESS}"`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
