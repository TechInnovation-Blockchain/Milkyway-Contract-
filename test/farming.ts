import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
  bigNumberify,
  expandTo18Decimals,
  MaxUint256,
} from './shared/utilities'

import { Milky } from '../typechain/Milky'
import { MasterChef } from '../typechain/MasterChef'
import { SyrupBar } from '../typechain/SyrupBar'
import { MockBEP20 } from '../typechain/MockBEP20'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('MilkyRouter', function () {
  let owner: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    dev: SignerWithAddress
  let milkyToken: Milky
  let lp1: MockBEP20, lp2: MockBEP20, lp3: MockBEP20
  let masterChef: MasterChef

  before(async () => {
    const [_owner, _user1, _user2, _dev] = await ethers.getSigners()
    owner = _owner
    user1 = _user1
    user2 = _user2
    dev = _dev

    const MilkyToken = await ethers.getContractFactory('Milky')
    milkyToken = await MilkyToken.deploy()
    await milkyToken.deployed()

    const MasterChef = await ethers.getContractFactory('MasterChef')
    masterChef = await MasterChef.deploy(
      milkyToken.address,
      dev.address,
      1000,
      0
    )
    await masterChef.deployed()

    await milkyToken.transferOwnership(masterChef.address)

    const MockBEP20 = await ethers.getContractFactory('MockBEP20')
    lp1 = await MockBEP20.deploy('LPToken', 'LP1', 1000000)
    lp2 = await MockBEP20.deploy('LPToken', 'LP2', 1000000)
    lp3 = await MockBEP20.deploy('LPToken', 'LP3', 1000000)

    await lp1.transfer(user1.address, 2000)
    await lp2.transfer(user1.address, 2000)
    await lp3.transfer(user1.address, 2000)

    await lp1.transfer(user2.address, 2000)
    await lp2.transfer(user2.address, 2000)
    await lp3.transfer(user2.address, 2000)
  })

  it('add', async () => {
    await masterChef.add(2000, lp1.address, true)
    await masterChef.add(1000, lp2.address, true)
    await masterChef.add(500, lp3.address, true)
    expect(await masterChef.poolLength()).to.equal(3)
  })

  it('deposit', async () => {
    await lp1.connect(user1).approve(masterChef.address, 100)
    await masterChef.connect(user1).deposit(0, 20)
    await masterChef.connect(user1).deposit(0, 0)
    await masterChef.connect(user1).deposit(0, 40)
    await masterChef.connect(user1).deposit(0, 0)
    expect(await lp1.balanceOf(user1.address)).to.equal(1940)

    await masterChef.connect(user1).withdraw(0, 10)
    expect(await lp1.balanceOf(user1.address)).to.equal(1950)
    expect(await milkyToken.balanceOf(user1.address)).to.equal(716)
    expect(await milkyToken.balanceOf(dev.address)).to.equal(228)

    console.log(await masterChef.userInfo(0, user1.address))
    console.log(await masterChef.pendingMilky(0, user1.address))
  })
})
