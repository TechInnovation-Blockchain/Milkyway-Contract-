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

  const MasterChef = await ethers.getContractFactory('MasterChef')
  const masterChef = await MasterChef.deploy(
    milkyToken.address,
    process.env.ACCOUNT_DEV ? process.env.ACCOUNT_DEV : '',
    BN(process.env.MILKY_EMISSION_RATE ? process.env.MILKY_EMISSION_RATE : 1)
      .mul(BN(10).pow(await milkyToken.decimals()))
      .div(BN(100)),
    0
  )
  await masterChef.deployed()

  console.log('MasterChef is deployed to:', masterChef.address) // 0xBa215B9e2E79e2c3d7e9eE644692C46436336b91

  // please run the output of the below log for verification of this contract
  console.log(
    `npx hardhat verify --network bscTest ${masterChef.address} "${
      milkyToken.address
    }" "${process.env.ACCOUNT_DEV ? process.env.ACCOUNT_DEV : ''}" "${BN(
      process.env.MILKY_EMISSION_RATE ? process.env.MILKY_EMISSION_RATE : 1
    )
      .mul(BN(10).pow(await milkyToken.decimals()))
      .div(BN(100))}" "0"`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
