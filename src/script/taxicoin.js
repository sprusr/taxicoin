import Web3 from 'web3'
import Shh from 'web3-shh'
import TruffleContract from 'truffle-contract'
import TaxicoinJSON from '../../dist/contracts/Taxicoin.json'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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
   * The public key for Whisper.
   *
   * @private
   */
  _shhPubKey

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
  constructor (web3Http, shhHttp, shhPrivateKey) {
    // hack for using Web3 v1.0 with TruffleContract
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

    // initialise our Web3 instance
    if (window && window.web3 && !web3Http) {
      console.info('[Web3] Using browser Web3 provider')
      this.web3 = new Web3(window.web3.currentProvider)
    } else if (web3Http) {
      console.info(`[Web3] Using RPC Web3 provider (${web3Http})`)
      this.web3 = new Web3(new Web3.providers.HttpProvider(web3Http))
    } else {
      throw new Web3Error('No provider set!')
    }

    // initialise our Whisper provider
    this.shh = new Shh(shhHttp || web3Http)

    // initialise our contract reference
    this.contract = TruffleContract(TaxicoinJSON)
    this.contract.setProvider(this.web3.currentProvider)
    this.contract.defaults({
      gas: 900000
    })

    // object for storing event handlers
    this._events = {}

    // Whisper topic hex strings
    this._shhTopics = {
      job: this.web3.utils.asciiToHex('job '),
      quote: this.web3.utils.asciiToHex('quot')
    }

    // set up Whisper with a new identity
    new Promise((resolve, reject) => {
      if (shhPrivateKey) {
        resolve(this.shh.addPrivateKey(shhPrivateKey))
      } else {
        resolve(this.shh.newKeyPair())
      }
    }).then(id => {
      this._shhIdentity = id
    }).then(() => {
      return this._generateShhFilter()
    }).then(() => {
      return this.shh.getPublicKey(this._shhIdentity)
    }).then((pubKey) => {
      this._shhPubKey = pubKey
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
  async driverAdvertise (lat, lon) {
    const instance = await this.contract.deployed()
    const driverDeposit = await instance.driverDeposit()
    const accounts = await this.web3.eth.getAccounts()
    const driver = await instance.drivers(accounts[0])
    const amountDeposited = driver[5]
    const amountToSend = driverDeposit - amountDeposited <= 0 ? 0 : driverDeposit - amountDeposited

    await instance.driverAdvertise('' + lat, '' + lon, this._shhPubKey, {from: accounts[0], value: amountToSend})
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
  async driverRevokeAdvert () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.driverRevokeAdvert({from: accounts[0]})
  }

  /**
   * @typedef {object} driver
   * @property {string} addr - Ethereum address of driver
   * @property {string} lat - latitude component of the driver location
   * @property {string} lon - longitude component of the driver location
   * @property {BigNumber} updated
   * @property {string} rider
   * @property {BigNumber} deposit
   * @property {BigNumber} rating - decimal between 0 (bad) and 1 (good)
   * @property {BigNumber} ratingCount
   * @property {BigNumber} riderRating
   * @property {string} shhIdentity
   */

  /**
   * Gets a list of currently advertised drivers.
   *
   * @return {driver[]} Array of drivers
   */
  async getDrivers () {
    const instance = await this.contract.deployed()

    let drivers = []
    let currentDriver = await instance.dllDriverIndex('0x0', true)

    while (currentDriver !== ZERO_ADDRESS) {
      drivers.push(this._driverArrayToObject(await instance.drivers(currentDriver)))
      currentDriver = await instance.dllDriverIndex(currentDriver, true)
    }

    return drivers
  }

  /**
   * Proposes a job to a driver via shh.
   *
   * Riders should register a 'quote' event handler for incoming quotes, if they haven't already.
   *
   * @param {string} driverIdentity - Whisper identity of the driver to propose a job to
   */
  async riderProposeJob (driverIdentity, pickup, dropoff) {
    const accounts = await this.web3.eth.getAccounts()

    const proposal = {
      address: accounts[0],
      pickup: pickup,
      dropoff: dropoff
    }

    await this.shh.post({
      pubKey: driverIdentity, // pubKey of recipient
      sig: this._shhIdentity, // sign it to prove it's from us
      ttl: 10,
      topic: this._shhTopics.job, // 4 bytes
      payload: this.web3.utils.asciiToHex(JSON.stringify(proposal)),
      powTime: 3, // how long to maths
      powTarget: 0.5 // how hard to maths
    })
  }

  /**
   * Reject a proposed job as a driver.
   */
  async driverRejectProposal (riderIdentity) {
    const accounts = await this.web3.eth.getAccounts()

    const response = {
      address: accounts[0],
      quote: -1
    }

    await this.shh.post({
      pubKey: riderIdentity, // pubKey of recipient
      sig: this._shhIdentity, // sign it to prove it's from us
      ttl: 10,
      topic: this._shhTopics.quote, // 4 bytes
      payload: this.web3.utils.asciiToHex(JSON.stringify(response)),
      powTime: 3, // how long to maths
      powTarget: 0.5 // how hard to maths
    })
  }

  /**
   * Propose a fare for a given proposal as a driver.
   */
  async driverQuoteProposal (riderIdentity, fare) {
    const accounts = await this.web3.eth.getAccounts()

    const response = {
      address: accounts[0],
      fare: fare
    }

    await this.shh.post({
      pubKey: riderIdentity, // pubKey of recipient
      sig: this._shhIdentity, // sign it to prove it's from us
      ttl: 10,
      topic: this._shhTopics.quote, // 4 bytes
      payload: this.web3.utils.asciiToHex(JSON.stringify(response)),
      powTime: 3, // how long to maths
      powTarget: 0.5 // how hard to maths
    })
  }

  /**
   * Accept a quoted fare for a journey as a rider. Forms contract between
   * driver and rider, taking full fare plus deposit from rider.
   *
   * TODO rewrite docs
   */
  async riderCreateJourney (driverAddress, fare) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()
    const riderDeposit = await instance.riderDeposit()
    const amountToSend = riderDeposit + fare

    await instance.riderCreateJourney(driverAddress, {from: accounts[0], value: amountToSend})
  }

  /**
   * Accept a quoted fare for a journey as a rider. Forms contract between
   * driver and rider, taking full fare plus deposit from rider.
   *
   * TODO rewrite docs
   */
  async driverAcceptJourney (riderAddress) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.driverAcceptJourney(riderAddress, {from: accounts[0]})
  }

  /**
   * Returns the details of a rider's current journey
   */
  async riderGetJourney () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    const rider = this._riderArrayToObject(await instance.riders(accounts[0]))

    if (rider.driver === ZERO_ADDRESS) {
      return null
    }

    const driver = this._driverArrayToObject(await instance.drivers(rider.driver))

    return {
      rider,
      driver
    }
  }

  /**
   * Returns the details of a driver's current journey
   */
  async driverGetJourney () {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    const driver = this._driverArrayToObject(await instance.drivers(accounts[0]))

    if (driver.rider === ZERO_ADDRESS) {
      return null
    }

    const rider = this._riderArrayToObject(await instance.riders(driver.rider))

    return {
      rider,
      driver
    }
  }

  /**
   * Complete a journey, thus completing the contract, transfering payment, and
   * returning deposits.
   */
  async driverCompleteJourney (rating) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.driverCompleteJourney(rating, {from: accounts[0]})
  }

  /**
   * Complete a journey, thus completing the contract, transfering payment, and
   * returning deposits.
   */
  async riderCompleteJourney (rating) {
    const instance = await this.contract.deployed()
    const accounts = await this.web3.eth.getAccounts()

    await instance.riderCompleteJourney(rating, {from: accounts[0]})
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
   * Converts a driver array (returned from Web3) to a driver object
   *
   * @return {driver} Driver object
   */
  _driverArrayToObject (driverArray) {
    return {
      addr: driverArray[0],
      lat: driverArray[1],
      lon: driverArray[2],
      updated: driverArray[3],
      rider: driverArray[4],
      deposit: driverArray[5],
      rating: driverArray[6],
      ratingCount: driverArray[7],
      riderRating: driverArray[8],
      pubKey: driverArray[9]
    }
  }

  /**
   * Converts a rider array (returned from Web3) to a rider object
   *
   * @return {driver} Driver object
   */
  _riderArrayToObject (riderArray) {
    return {
      addr: riderArray[0],
      driver: riderArray[1],
      fare: riderArray[2],
      deposit: riderArray[3],
      rating: riderArray[4],
      ratingCount: riderArray[5]
    }
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
    return this.shh.getFilterMessages(this._shhFilter).then(messages => {
      for (let message of messages) {
        switch (message.topic) {
          case this._shhTopics.job:
            message.body = JSON.parse(this.web3.utils.hexToAscii(message.payload))
            this.emit('job', message)
            break
          case this._shhTopics.quote:
            message.body = JSON.parse(this.web3.utils.hexToAscii(message.payload))
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
    return this.shh.newMessageFilter({
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

class Web3Error extends Error {
  constructor (...args) {
    super(...args)

    this.name = this.constructor.name

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export default Taxicoin
