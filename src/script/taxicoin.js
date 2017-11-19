import Web3 from 'web3'
import TruffleContract from 'truffle-contract'
import TaxicoinJSON from '../../dist/contracts/Taxicoin.json'

class Taxicoin {
  /**
   * Web3 instance.
   */
  web3

  /**
   * TruffleContract instance for Taxicoin contract.
   */
  contract

  /**
   * Object to store arrays of handlers for the various events.
   *
   * @private
   */
  _events

  /**
   * Mappings between event names and topic hex strings.
   *
   * @private
   */
  _shhTopics

  /**
   * The key pair for Whisper.
   *
   * @private
   */
  _shhIdentity

  /**
   * The Whisper message filter.
   *
   * @private
   */
  _shhFilter

  /**
   * Interval for checking Whisper for new messages.
   *
   * @private
   */
  _shhInterval

  /**
   * Represents a Taxicoin client instance.
   *
   * @class
   *
   * @property web3 - the Ethereum Web3 instance
   * @property contract - the Taxicoin contract instance
   */
  constructor () {
    // hack for using Web3 v1.0 with TruffleContract
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

    // initialise our Web3 instance
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      console.info('[Web3] Using browser Web3 provider')
      this.web3 = new Web3(window.web3.currentProvider)
    } else {
      console.info('[Web3] Using RPC Web3 provider (http://localhost:8545)')
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    }

    // initialise our contract reference
    this.contract = TruffleContract(TaxicoinJSON)
    this.contract.setProvider(this.web3.currentProvider)

    // object for storing event handlers
    this._events = {}

    // Whisper topic hex strings
    this._shhTopics = {
      job: this.web3.utils.asciiToHex('job '),
      quote: this.web3.utils.asciiToHex('quot')
    }

    // set up Whisper with a new identity
    this.web3.shh.newKeyPair().then(id => {
      this._shhIdentity = id
      return this.web3.shh.newMessageFilter({
        privateKeyID: id
      })
    }).then(() => {
      return this._generateShhFilter()
    })
  }

  /**
   * A promise for a driver advertisement.
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
   * After successfully advertising, if they haven't already, drivers should register a 'job' event handler for incoming jobs.
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
        // TODO possibly include Whisper identity?
        return instance.advertiseDriver.call(lat, lon, {from: this.web3.account})
      }).then(resolve).catch(error => {
        // TODO process error
        reject(error)
      })
    })
  }

  /**
   * A promise for revoking a driver advertisement
   *
   * @promise RevokeAdvertPromise
   * @reject {EthereumNetworkError} Problem connecting to Ethereum network
   */

  /**
   * If an active advertisement exists, it is set as invalid. Deposits are not returned as a result of this action.
   *
   * @return {RevokeAdvertPromise} Promise which resolves when the transaction is mined
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
   * @typedef {object} driver
   * @property {string} address - Ethereum address of driver
   * @property {number} lat - latitude component of the driver location
   * @property {number} lon - longitude component of the driver location
   * @property {number} rating - decimal between 0 (bad) and 1 (good)
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
   *
   * Riders should register a 'quote' event handler for incoming quotes, if they haven't already.
   *
   * @param {string} driverAddress - address of the driver to propose a job to
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

  /**
   * Registers an event handler
   *
   * Valid events:
   *   job    - triggered when a job offer is recieved
   *   quote  - triggered when a quote is recieved, following a job advertisement
   *
   * @param {string} name - the event name
   * @param {function} handler - the function to be called when the event is triggered
   */
  on (name, handler) {
    if (this._events.hasOwnProperty(name)) {
      this._events[name].push(handler)
    } else {
      this._events[name] = [handler]
    }
  }

  /**
   * Unregisters an event handler
   *
   * @param {string} name - the event name for which to unregister a handler
   * @param {function} handler - the function to unregister
   */
  off (name, handler) {
    if (!this._events.hasOwnProperty(name)) {
      return
    }

    if (!handler) {
      this._events[name] = []
    } else {
      let index = this._events[name].indexOf(handler)
      if (index !== -1) {
        this._events[name].splice(index, 1)
      }
    }
  }

  /**
   * Emits an event and calls event handlers for that event
   *
   * @param {string} name - the name of the event to trigger
   * @param {...object} args - the arguments to the event handler(s)
   */
  emit (name, ...args) {
    if (!this._events.hasOwnProperty(name)) {
      return
    }

    if (!args || !args.length) {
      args = []
    }

    let event = this._events[name]
    for (let i = 0; i < event.length; i++) {
      event[i].apply(null, args)
    }
  }

  /**
   * Checks for unread Whisper messages, and emits events accordingly.
   * Internal method, should not be called externally.
   *
   * @private
   */
  _checkShhMessages () {
    console.log(this._shhFilter)
    return this.web3.shh.getFilterMessages(this._shhFilter).then(messages => {
      for (let message of messages) {
        switch (message.topic) {
          case this._shhTopics.job:
            this.emit('job', message)
            break
          case this._shhTopics.quote:
            this.emit('quote', message)
            break
        }
      }
    }).catch(error => {
      console.error(`[Shh] Error: ${error.message}`)
      return this._generateShhFilter()
    })
  }

  /**
   * Generates a new Whisper message filter
   *
   * @private
   */
  _generateShhFilter () {
    return this.web3.shh.newMessageFilter({
      privateKeyID: this._shhIdentity
    }).then(filter => {
      console.info('[Shh] Registered filter')
      this._shhFilter = filter

      // clear the interval if we already had one
      if (this._shhInterval) {
        clearInterval(this._shhInterval)
      }

      // check for new messages every 2s
      this._shhInterval = setInterval(() => {
        this._checkShhMessages()
      }, 2000)

      return filter
    })
  }
}

export default Taxicoin
