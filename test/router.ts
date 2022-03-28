import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
  bigNumberify,
  expandTo18Decimals,
  MaxUint256,
} from './shared/utilities'

import {
  MilkyFactory,
  WETH9,
  ERC20,
  MilkyRouter,
  Milky,
  MilkyPair,
  Treasury,
} from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('MilkyRouter', function () {
  let owner: SignerWithAddress, user: SignerWithAddress
  let milkyFactory: MilkyFactory
  let wEth: WETH9
  let wEthPartner: ERC20
  let tokenA: ERC20
  let tokenB: ERC20
  let milkyToken: Milky
  let milkyRouter: MilkyRouter
  let treasury: Treasury
  let milkyPair1: MilkyPair, milkyPair2: MilkyPair
  const MINIMUM_LIQUIDITY = expandTo18Decimals(1, 3)

  before(async () => {
    const [_owner, _user] = await ethers.getSigners()
    owner = _owner
    user = _user

    const WETH = await ethers.getContractFactory('WETH9')
    wEth = await WETH.deploy()
    await wEth.deployed()
    await wEth.deposit({ value: ethers.utils.parseEther('10') })

    const ERC20 = await ethers.getContractFactory('ERC20')
    wEthPartner = await ERC20.deploy(expandTo18Decimals(3000000000))
    await wEthPartner.deployed()

    tokenA = await ERC20.deploy(expandTo18Decimals(3000000000))
    await tokenA.deployed()

    tokenB = await ERC20.deploy(expandTo18Decimals(3000000000))
    await tokenB.deployed()

    const MilkyToken = await ethers.getContractFactory('Milky')
    milkyToken = await MilkyToken.deploy()
    await milkyToken.deployed()
    await milkyToken.mintTo(owner.address, expandTo18Decimals(3000000000))

    const MilkyFactory = await ethers.getContractFactory('MilkyFactory')
    milkyFactory = await MilkyFactory.deploy(owner.address)
    await milkyFactory.deployed()

    const MilkyRouter = await ethers.getContractFactory('MilkyRouter')
    milkyRouter = await MilkyRouter.deploy(milkyFactory.address, wEth.address)
    await milkyRouter.deployed()

    const Treasury = await ethers.getContractFactory('Treasury')
    treasury = await Treasury.deploy()
    await treasury.deployed()

    await milkyFactory.setFeeTo(treasury.address)
  })

  it('INIT_CODE_PAIR_HASH', async () => {
    console.log(await milkyFactory.INIT_CODE_PAIR_HASH())
  })

  // it('Create Pair-(WETH, ERC20)', async () => {
  //   const tx = await milkyFactory.createPair(wEth.address, wEthPartner.address)
  //   const rc = await tx.wait()
  //   const event = rc.events?.find((e) => e.event === 'PairCreated')
  //   if (event && event.args) {
  //     const milkyPair = await ethers.getContractAt('MilkyPair', event.args.pair)
  //     if (wEth.address < wEthPartner.address) {
  //       expect(await milkyPair.token0()).to.equal(wEth.address)
  //       expect(await milkyPair.token1()).to.equal(wEthPartner.address)
  //     } else {
  //       expect(await milkyPair.token0()).to.equal(wEthPartner.address)
  //       expect(await milkyPair.token1()).to.equal(wEth.address)
  //     }

  //     console.log(
  //       'Pair Address',
  //       await milkyFactory.getPair(wEth.address, wEthPartner.address)
  //     )
  //   }
  // })

  it('addLiquidity', async () => {
    await tokenA.approve(milkyRouter.address, MaxUint256)
    await tokenB.approve(milkyRouter.address, MaxUint256)
    await milkyToken.approve(milkyRouter.address, MaxUint256)

    for (let i = 0; i < 10; i++) {
      await milkyRouter.addLiquidity(
        tokenA.address,
        tokenB.address,
        expandTo18Decimals(10000),
        expandTo18Decimals(30000),
        0,
        0,
        owner.address,
        MaxUint256
      )
    }

    milkyPair1 = await ethers.getContractAt(
      'MilkyPair',
      await milkyFactory.getPair(tokenA.address, tokenB.address)
    )
    // expect(await milkyPair1.balanceOf(owner.address)).to.equal(
    //   expandTo18Decimals(100000).sub(MINIMUM_LIQUIDITY)
    // )

    for (let i = 0; i < 10; i++) {
      await milkyRouter.addLiquidity(
        tokenA.address,
        milkyToken.address,
        expandTo18Decimals(10000),
        expandTo18Decimals(25000),
        0,
        0,
        owner.address,
        MaxUint256
      )
    }
    milkyPair2 = await ethers.getContractAt(
      'MilkyPair',
      await milkyFactory.getPair(tokenA.address, milkyToken.address)
    )
    // expect(await milkyPair2.balanceOf(owner.address)).to.equal(
    //   expandTo18Decimals(100000).sub(MINIMUM_LIQUIDITY)
    // )

    console.log(await milkyPair1.balanceOf(owner.address))
    console.log(await milkyPair2.balanceOf(owner.address))
  })

  it('swap', async () => {
    for (let i = 0; i < 50; i++) {
      {
        const beforeSwap = await tokenB.balanceOf(user.address)
        const tx = await milkyRouter.swapExactTokensForTokens(
          expandTo18Decimals(100),
          0,
          [tokenA.address, tokenB.address],
          user.address,
          MaxUint256
        )
        const cr = await tx.wait()
        const event = cr.events?.find((e) => e.event === 'Swap')
        if (event && event.args) {
          expect(event.args.amount1Out).to.equal(expandTo18Decimals(300))
          const afterSwap = await tokenB.balanceOf(user.address)
          expect(afterSwap.sub(beforeSwap)).to.equal(expandTo18Decimals(300))
        }
      }
      {
        const tx = await milkyRouter.swapExactTokensForTokens(
          expandTo18Decimals(300),
          0,
          [tokenB.address, tokenA.address],
          user.address,
          MaxUint256
        )
        const cr = await tx.wait()
        const event = cr.events?.find((e) => e.event === 'Swap')
        if (event && event.args) {
          expect(event.args.amount1Out).to.equal(expandTo18Decimals(100))
        }
      }
      {
        const tx = await milkyRouter.swapExactTokensForTokens(
          expandTo18Decimals(100),
          0,
          [tokenA.address, milkyToken.address],
          user.address,
          MaxUint256
        )
        const cr = await tx.wait()
        const event = cr.events?.find((e) => e.event === 'Swap')
        if (event && event.args) {
          expect(event.args.amount1Out).to.equal(expandTo18Decimals(250))
        }
      }
    }
  })

  it('removeLiquidity', async () => {
    const milkyPair = await ethers.getContractAt(
      'MilkyPair',
      await milkyFactory.getPair(tokenA.address, tokenB.address)
    )
    const liquidity = (await milkyPair.balanceOf(owner.address)).div(
      bigNumberify(4)
    )
    await milkyPair.approve(milkyRouter.address, liquidity)
    await milkyRouter.removeLiquidity(
      tokenA.address,
      tokenB.address,
      liquidity,
      0,
      0,
      owner.address,
      MaxUint256
    )

    await milkyRouter.addLiquidity(
      tokenA.address,
      milkyToken.address,
      expandTo18Decimals(10000),
      expandTo18Decimals(25000),
      0,
      0,
      owner.address,
      MaxUint256
    )

    console.log(await milkyPair1.balanceOf(treasury.address))
    console.log(await milkyPair2.balanceOf(treasury.address))
  })

  // it('Treasury', async () => {
  //   await treasury.setMilkyRouter(milkyRouter.address)
  //   await treasury.setSwapRoutes(tokenA.address, milkyToken.address, [])
  //   await treasury.setSwapRoutes(tokenB.address, milkyToken.address, [
  //     tokenA.address,
  //   ])

  //   console.log(await milkyToken.balanceOf(treasury.address))
  //   const tx = await treasury.buyBurnTest(6250, milkyToken.address)
  //   const cr = await tx.wait()
  //   const event = cr.events?.find((e) => e.event === 'BuyBackBurn')
  //   if (event && event.args) {
  //     console.log(event.args)
  //     console.log(await milkyToken.balanceOf(treasury.address))
  //   }

  //   console.log(await milkyPair1.balanceOf(treasury.address))
  //   console.log(await milkyPair2.balanceOf(treasury.address))
  // })
})
