import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'
import * as dotenv from 'dotenv'

const BN = BigNumber.from

async function main() {
  const [_owner] = await ethers.getSigners()
  const milkyToken = await ethers.getContractAt(
    'Milky',
    process.env.MILKY_CONTRACT_ADDRESS ? process.env.MILKY_CONTRACT_ADDRESS : ''
  )

  const syrupBar = await ethers.getContractAt(
    'SyrupBar',
    process.env.SYRUPBAR_CONTRACT_ADDRESS
      ? process.env.SYRUPBAR_CONTRACT_ADDRESS
      : ''
  )

  await milkyToken.transferOwnership(
    process.env.MASTERCHEF_CONTRACT_ADDRESS
      ? process.env.MASTERCHEF_CONTRACT_ADDRESS
      : ''
  )
  await syrupBar.transferOwnership(
    process.env.MASTERCHEF_CONTRACT_ADDRESS
      ? process.env.MASTERCHEF_CONTRACT_ADDRESS
      : ''
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
