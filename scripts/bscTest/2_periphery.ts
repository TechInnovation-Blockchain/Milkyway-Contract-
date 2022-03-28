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

  console.log('MilkyRouter is deployed to:', milkyRouter.address) // 0xd601C5CB0D73990BB739dF60582fBd57F5Fe487D
  // please run the output of the below log for verification of this contract
  console.log(
    `npx hardhat verify --network bscTest ${milkyRouter.address} "${process.env.MILKYFACTORY_CONTRACT_ADDRESS}" "${process.env.WBNB_CONTRACT_ADDRESS}"`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
