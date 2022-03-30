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

  await milkyToken.transferOwnership(
    process.env.MASTERCHEF_CONTRACT_ADDRESS
      ? process.env.MASTERCHEF_CONTRACT_ADDRESS
      : ''
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
