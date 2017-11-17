import Web3 from 'web3'
import TruffleContract from 'truffle-contract'
import TaxicoinJSON from '../../dist/contracts/Taxicoin.json'

class Taxicoin {
  /**
   * Represents a Taxicoin client instance
   * Events: job, quote
   *
   * @class
   *
   * @property web3 - the Ethereum Web3 instance
   * @property contract - the Taxicoin contract instance
   */
  constructor () {
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      console.info('[Web3] Using browser Web3 provider')
      this.web3 = new Web3(window.web3.currentProvider)
    } else {
      console.info('[Web3] Using RPC Web3 provider (http://localhost:7545)')
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
    }

    this.contract = TruffleContract(TaxicoinJSON)
    this.contract.setProvider(this.web3.currentProvider)

    this.events = {}

    console.log(this.contract)

    // let shhIdentity = this.web3.shh.newIdentity()
    //
    // var shhWatch = this.web3.shh.watch({
    //   topics: [ this.web3.fromAscii('taxicoin-job'), shhIdentity ],
    //   to: shhIdentity
    // })
    //
    // shhWatch.arrived(message => {
    //   console.log('Reply from ' + this.web3.toAscii(message.payload) + ' whose address is ' + message.from)
    //   this.emit('job', message)
    // })
  }

  /**
   * Registers an event handler
   */
  on (name, handler) {
    if (this.events.hasOwnProperty(name)) {
      this.events[name].push(handler)
    } else {
      this.events[name] = [handler]
    }
  }

  /**
   * Unregisters an event handler
   */
  off (name, handler) {
    if (!this.events.hasOwnProperty(name)) {
      return
    }

    if (!handler) {
      this.events[name] = []
    } else {
      let index = this.events[name].indexOf(handler)
      if (index !== -1) {
        this.events[name].splice(index, 1)
      }
    }
  }

  /**
   * Emits an event and calls event handlers for that event
   */
  emit (name, ...args) {
    if (!this.events.hasOwnProperty(name)) {
      return
    }

    if (!args || !args.length) {
      args = []
    }

    let event = this.events[name]
    for (let i = 0; i < event.length; i++) {
      event[i].apply(null, args)
    }
  }

  /**
   * A promise for a driver advertisement
   *
   * @promise AdvertisePromise
   * @reject {TypeError} The lat/lon values are not of the correct format
   * @reject {InsufficientDepositError} Not enough
   */

  /**
   * The advertise method takes a location and deposit (value as defined by the contract settings) from a driver and published the location.
   * The deposit then acts as incentive to complete a job.
   *
   * If a deposit has not already been provided, and is not sent with the advertisement, an error is thrown.
   * If deposit is sent, but has already been provided, the excess is returned and the method returns successfully.
   *
   * @param {number} lat - latitude component of the driver location
   * @param {number} lon - longitude component of the driver location
   *
   * @return {AdvertisePromise} Promise which resolves when the transaction is mined
   */
  advertiseDriver (lat, lon) {
    console.log('advertise driver')
    // check if already deposited
    // publish location + address + current time (or block?), along with paying deposit if not already
    return new Promise((resolve, reject) => {
      this.contract.deployed().then(instance => {
        return instance.advertiseDriver.call(lat, lon, {from: this.web3.account})
      }).then(resolve).catch(error => {
        // TODO process error
        reject(error)
      })
    })
  }

  /**
   * If an active advertisement exists, it is set as invalid. Deposits are not returned as a result of this action.
   *
   * @return {boolean} Whether the advertisement was invalidated successfully
   */
  revokeDriverAdvert () {
    return new Promise((resolve, reject) => {
      this.contract.deployed().then(instance => {
        return instance.revokeDriverAdvert.call({from: this.web3.account})
      }).then(resolve).catch(error => {
        // TODO process error
        reject(error)
      })
    })
  }

  /**
   * @typedef {Object} driver
   * @property {String} address - Ethereum address of driver
   * @property {Number} lat - latitude component of the driver location
   * @property {Number} lon - longitude component of the driver location
   * @property {Number} rating - decimal between 0 (bad) and 1 (good)
   */

  /**
   * Gets a list of currently advertised drivers.
   *
   * @return {driver[]} Array of drivers
   */
  get drivers () {
    // get drivers published
    // sort by combination of nearby and reputation
    return [{
      address: '0x000000000000000000000000',
      lat: 0,
      lon: 0,
      rating: 0.965
    }]
  }

  /**
   * Proposes a job to a driver via shh.
   */
  proposeJob (driverAddress) {
    // send proposal of journey pickup and dropoff via whisper
  }

  /**
   * Reject a proposed job as a driver.
   */
  rejectProposal () {
    // reject a proposal via whisper
  }

  /**
   * Propose a fare for a given proposal as a driver.
   */
  quoteProposal () {
    // send a quote for a proposed journey via whisper
  }

  /**
   * Accept a quoted fare for a journey as a rider. Forms contract between
   * driver and rider, taking full fare plus deposit from rider.
   */
  acceptQuote () {
    //
  }

  /**
   * Complete a journey, thus completing the contract, transfering payment, and
   * returning deposits.
   */
  completeJourney () {
    //
  }

  /**
   * Propose cancellation of a journey contract.
   */
  proposeCancel () {
    //
  }

  /**
   * Accept a proposed cancellation of a contract, returning fare and deposits.
   */
  acceptCancel () {
    //
  }
}

export default Taxicoin
