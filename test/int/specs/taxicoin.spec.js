import Taxicoin from '@/script/taxicoin'
import Web3 from 'web3'

// eslint-disable-next-line no-undef
chai.use(require('chai-as-promised'))

const WEB3_URL = 'http://localhost:7545'
const SHH_URL = 'http://localhost:8545'

const web3 = new Web3(new Web3.providers.HttpProvider(WEB3_URL))

describe('taxicoin client library', () => {
  let blankSnapshot, tcRider, tcDriver, accounts

  before(async () => {
    accounts = await web3.eth.getAccounts()
    blankSnapshot = await makeSnapshot()
  })

  beforeEach(async () => {
    await makeSnapshot() // need some interaction between reverts or else ganache won't return for some reason
    tcRider = new Taxicoin({
      web3: {
        provider: WEB3_URL,
        account: accounts[1]
      },
      shh: {
        provider: SHH_URL
      }
    })
    tcDriver = new Taxicoin({
      web3: {
        provider: WEB3_URL,
        account: accounts[2]
      },
      shh: {
        provider: SHH_URL
      }
    })
  })

  afterEach(async () => {
    await revertSnapshot(blankSnapshot)
  })

  describe('driver advertise', () => {
    it('should reduce the driver\'s funds by the deposit amount plus gas', async () => {
      const driverDeposit = await tcDriver.getDriverDeposit()

      const preBalance = await tcDriver.getBalance()
      const tx = await tcDriver.driverAdvertise(51.5074, 0.1278) // coords of London!
      const postBalance = await tcDriver.getBalance()

      postBalance.eq(preBalance.sub(driverDeposit).subn(tx.receipt.cumulativeGasUsed)).should.be.true
    })

    it('should throw an error if driver has insufficient funds for deposit', async () => {
      const driverAccount = await tcDriver.getAccount()

      await sendAllEth(driverAccount)

      await expect(tcDriver.driverAdvertise(51.5074, 0.1278)).to.be.rejected
    })

    it('should publish the driver\'s location and whisper public key', async () => {
      const driverAccount = await tcDriver.getAccount()
      const driverShh = await tcDriver.getShhPubKey()

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      const drivers = await tcRider.getDrivers()

      drivers[0].should.include({
        addr: driverAccount,
        lat: '51.5074',
        lon: '0.1278',
        pubKey: driverShh
      })
    })
  })

  describe('driver advert revoke', () => {
    it('should mark a driver as not advertised', async () => {
      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcDriver.driverRevokeAdvert()
      const drivers = await tcRider.getDrivers()
      drivers.should.be.empty
    })

    it('should throw an error if driver is not advertised', async () => {
      await expect(tcRider.driverRevokeAdvert()).to.be.rejected
    })
  })

  describe('get drivers', () => {
    it('should return an empty array when no drivers are published', async () => {
      const drivers = await tcRider.getDrivers()
      drivers.should.be.empty
    })

    it('should return a non-empty array after advertising a driver', async () => {
      await tcDriver.driverAdvertise(51.5074, 0.1278)
      const drivers = await tcRider.getDrivers()
      drivers.should.not.be.empty
    })
  })

  describe('rider propose job', () => {
    it('should cause the proposed to driver to recieve a job message', async () => {
      const driverPubKey = await tcDriver.getShhPubKey()

      const p = new Promise((resolve, reject) => {
        tcDriver.on('job', () => {
          resolve()
        })
      })

      await tcRider.riderProposeJob(driverPubKey, [51.5074, 0.1278], [52.5074, 1.1278])

      return p
    }).timeout(5000)

    it('should send the rider\'s address, pickup and dropoff locations in a job message to the driver', async () => {
      const riderAccount = await tcRider.getAccount()
      const driverPubKey = await tcDriver.getShhPubKey()
      const pickup = [51.5074, 0.1278]
      const dropoff = [52.5074, 1.1278]

      const p = new Promise((resolve, reject) => {
        tcDriver.on('job', (message) => {
          message.body.address.should.equal(riderAccount)
          message.body.pickup.should.deep.equal(pickup)
          message.body.dropoff.should.deep.equal(dropoff)
          resolve()
        })
      })

      await tcRider.riderProposeJob(driverPubKey, pickup, dropoff)

      return p
    }).timeout(5000)
  })

  describe('driver reject proposal', () => {
    it('should cause the rider to recieve a quote message', async () => {
      const riderPubKey = await tcRider.getShhPubKey()

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          resolve()
        })
      })

      tcDriver.driverRejectProposal(riderPubKey)

      return p
    }).timeout(5000)

    it('should send a quote message with a quote of -1', async () => {
      const riderPubKey = await tcRider.getShhPubKey()

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          message.body.fare.should.equal(-1)
          resolve()
        })
      })

      tcDriver.driverRejectProposal(riderPubKey)

      return p
    }).timeout(5000)

    it('should include the driver\'s address in the quote message', async () => {
      const riderPubKey = await tcRider.getShhPubKey()
      const driverAccount = await tcDriver.getAccount()

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          message.body.address.should.equal(driverAccount)
          resolve()
        })
      })

      tcDriver.driverRejectProposal(riderPubKey)

      return p
    }).timeout(5000)
  })

  describe('driver quote proposal', () => {
    it('should cause the rider to recieve a quote message', async () => {
      const riderPubKey = await tcRider.getShhPubKey()
      const quote = 100

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          resolve()
        })
      })

      tcDriver.driverQuoteProposal(riderPubKey, quote)

      return p
    }).timeout(5000)

    it('should send a quote message with the specified fare', async () => {
      const riderPubKey = await tcRider.getShhPubKey()
      const quote = 100

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          message.body.fare.should.equal(quote)
          resolve()
        })
      })

      tcDriver.driverQuoteProposal(riderPubKey, quote)

      return p
    }).timeout(5000)

    it('should include the driver\'s address in the quote message', async () => {
      const riderPubKey = await tcRider.getShhPubKey()
      const driverAccount = await tcDriver.getAccount()
      const quote = 100

      const p = new Promise((resolve, reject) => {
        tcRider.on('quote', (message) => {
          message.body.address.should.equal(driverAccount)
          resolve()
        })
      })

      tcDriver.driverQuoteProposal(riderPubKey, quote)

      return p
    }).timeout(5000)
  })

  describe('rider create journey', () => {
    it('should reduce the rider\'s funds by the deposit amount plus the specified agreed fare plus gas', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderDeposit = await tcRider.getRiderDeposit()
      const fare = 100

      await tcDriver.driverAdvertise(51.5074, 0.1278)

      const preBalance = await tcRider.getBalance()
      const tx = await tcRider.riderCreateJourney(driverAccount, fare)
      const postBalance = await tcRider.getBalance()

      postBalance.eq(preBalance.sub(riderDeposit).subn(fare).subn(tx.receipt.cumulativeGasUsed)).should.be.true
    })

    it('should throw an error if the address provided is not that of an advertised driver', async () => {
      const driverAccount = await tcDriver.getAccount()
      const fare = 100

      await expect(tcRider.riderCreateJourney(driverAccount, fare)).to.be.rejected
    })

    it('should set the rider as being on a journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const fare = 100

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)

      const journey = await tcRider.riderGetJourney()
      journey.should.not.be.null
    })
  })

  describe('driver accept journey', () => {
    it('should throw an error if the provided address (rider) has not agreed to ride with the driver', async () => {
      const riderAccount = await tcRider.getAccount()
      await expect(tcDriver.driverAcceptJourney(riderAccount)).to.be.rejected
    })

    it('should set the driver\'s state to being on a journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)

      const journey = await tcDriver.driverGetJourney()
      journey.should.not.be.null
    })
  })

  describe('rider get journey', () => {
    it('should return null if the rider is not currently on a journey', async () => {
      const journey = await tcRider.riderGetJourney()
      expect(journey).to.be.null
    })

    it('should return the details of the current journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const fare = 100

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)

      const journey = await tcRider.riderGetJourney()
      journey.should.not.be.null
      journey.rider.should.not.be.null
      journey.rider.addr.should.not.be.null
      journey.driver.should.not.be.null
      journey.driver.addr.should.not.be.null
    })
  })

  describe('driver get journey', () => {
    it('should return null if the driver is not currently on a journey', async () => {
      const journey = await tcDriver.driverGetJourney()
      expect(journey).to.be.null
    })

    it('should return the details of the current journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)

      const journey = await tcDriver.driverGetJourney()
      journey.should.not.be.null
      journey.rider.should.not.be.null
      journey.rider.addr.should.not.be.null
      journey.driver.should.not.be.null
      journey.driver.addr.should.not.be.null
    })
  })

  describe('driver complete journey', () => {
    it('should throw an error if the driver is not currently on a journey', async () => {
      await expect(tcDriver.driverCompleteJourney(255)).to.be.rejected
    })

    it('should set the driver\'s rider rating to the given value', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)

      const journey = await tcDriver.driverGetJourney()
      journey.driver.riderRating.should.equal(riderRating)
    })
  })

  describe('rider complete journey', () => {
    it('should throw an error if the rider is not currently on a journey', async () => {
      await expect(tcRider.riderCompleteJourney(255)).to.be.rejected
    })

    it('should throw an error if the driver has not completed the journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)

      await expect(tcRider.riderCompleteJourney(driverRating)).to.be.rejected
    })

    it('should increase the rider\'s balance by the deposit amount minus gas cost', async () => {
      const riderDeposit = await tcRider.getRiderDeposit()
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)

      const preBalance = await tcRider.getBalance()
      const tx = await tcRider.riderCompleteJourney(driverRating)
      const postBalance = await tcRider.getBalance()

      postBalance.eq(preBalance.add(riderDeposit).subn(tx.receipt.cumulativeGasUsed)).should.be.true
    })

    it('should increase the driver\'s balance by the deposit amount plus the fare of the journey minus gas cost', async () => {
      const driverDeposit = await tcDriver.getDriverDeposit()
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)

      const preBalance = await tcDriver.getBalance()
      await tcRider.riderCompleteJourney(driverRating)
      const postBalance = await tcDriver.getBalance()

      postBalance.eq(preBalance.add(driverDeposit).addn(fare)).should.be.true
    })

    it('should alter the rider\'s overall rating', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)

      const preRider = await tcDriver.getRider(riderAccount)
      await tcRider.riderCompleteJourney(driverRating)
      const postRider = await tcDriver.getRider(riderAccount)

      postRider.rating.should.equal(Math.floor(preRider.ratingCount.muln(preRider.rating).addn(riderRating).div(preRider.ratingCount.addn(1)).toNumber()))
      postRider.ratingCount.eq(preRider.ratingCount.addn(1)).should.be.true
    })

    it('should alter the driver\'s overall rating', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)

      const preDriver = await tcRider.getDriver(driverAccount)
      await tcRider.riderCompleteJourney(driverRating)
      const postDriver = await tcRider.getDriver(driverAccount)

      postDriver.rating.should.equal(Math.floor(preDriver.ratingCount.muln(preDriver.rating).addn(driverRating).div(preDriver.ratingCount.addn(1)).toNumber()))
      postDriver.ratingCount.eq(preDriver.ratingCount.addn(1)).should.be.true
    })

    it('should set the rider to be not on a journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)
      await tcRider.riderCompleteJourney(driverRating)

      const journey = await tcRider.riderGetJourney()
      expect(journey).to.be.null
    })

    it('should set the driver to be not on a journey', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)
      await tcRider.riderCompleteJourney(driverRating)

      const journey = await tcDriver.driverGetJourney()
      expect(journey).to.be.null
    })

    it('should set the driver to be not advertised', async () => {
      const driverAccount = await tcDriver.getAccount()
      const riderAccount = await tcRider.getAccount()
      const fare = 100
      const riderRating = 255
      const driverRating = 255

      await tcDriver.driverAdvertise(51.5074, 0.1278)
      await tcRider.riderCreateJourney(driverAccount, fare)
      await tcDriver.driverAcceptJourney(riderAccount)
      await tcDriver.driverCompleteJourney(riderRating)
      await tcRider.riderCompleteJourney(driverRating)

      const drivers = await tcRider.getDrivers()
      drivers.should.be.empty
    })
  })
})

// makes a ganache blockchain snapshot and returns its number
const makeSnapshot = async () => {
  return new Promise((resolve, reject) => {
    web3._requestManager.send({method: 'evm_snapshot'}, (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve(result)
    })
  })
}

// reverts the ganache blockchain to snapshot number specified
const revertSnapshot = async (snapshot) => {
  return new Promise((resolve, reject) => {
    web3._requestManager.send({method: 'evm_revert', params: [snapshot]}, (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve()
    })
  })
}

// sends all the eth at a given address somewhere else
const sendAllEth = async (account) => {
  const accounts = await web3.eth.getAccounts()
  const balance = await web3.eth.getBalance(account)

  const gasToSend = 21000 // always the gas cost when sending to non-contract
  const gasPrice = await web3.eth.getGasPrice()
  const amountToSend = balance - gasToSend * gasPrice

  await web3.eth.sendTransaction({from: account, to: accounts[0], value: amountToSend, gas: gasToSend, gasPrice: gasPrice})
}
