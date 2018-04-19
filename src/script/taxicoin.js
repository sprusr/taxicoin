import Web3 from 'web3'
import Shh from 'web3-shh'
import TruffleContract from 'truffle-contract'
import TaxicoinJSON from '../../dist/contracts/Taxicoin.json'

class Taxicoin {

  static ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  static NONE = 0
  static DRIVER = 1
  static ACTIVE_DRIVER = 2
  static RIDER = 3

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
   * The private key for Whisper to be imported.
   *
   * @private
   */
  _shhPrivateKey

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
   * @property options - {web3: {provider, account}, shh: {provider, privateKey}, contract}
   */
  constructor (options) {
    // hack for using Web3 v1.0 with TruffleContract
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

    // initialise our Web3 instance
    let web3Provider
    if (window && window.web3 && !options.web3.provider) {
      web3Provider = window.web3.currentProvider
    } else if (typeof options.web3.provider === 'string') {
      web3Provider = new Web3.providers.HttpProvider(options.web3.provider)
    } else if (options.web3.provider instanceof Web3.providers.HttpProvider) { // TODO: include other providers
      web3Provider = options.web3.provider
    } else {
      throw new Web3Error('No provider set!')
    }
    this.web3 = new Web3(web3Provider)

    // if account is defined in options, store it
    if (options.web3.account) {
      this._web3Account = options.web3.account
    }

    // initialise our Whisper provider
    let shhProvider
    if (typeof options.shh.provider === 'string') {
      shhProvider = new Web3.providers.HttpProvider(options.shh.provider)
    } else if (options.shh.provider instanceof Web3.providers.HttpProvider) { // TODO: include other providers
      shhProvider = options.shh.provider
    } else {
      shhProvider = web3Provider
    }
    this.shh = new Shh(shhProvider)

    // store the Whisper private key for later if defined
    if (options.shh.privateKey) {
      this._shhPrivateKey = options.shh.privateKey
    }

    // initialise our contract reference
    this.contract = TruffleContract(options.contract || TaxicoinJSON)
    this.contract.setProvider(this.web3.currentProvider)
    this.contract.defaults({
      gas: 900000
    })

    // object for storing event handlers
    this._events = {}

    // Whisper topic hex strings
    this._shhTopics = {
      job: this.web3.utils.asciiToHex('job '),
      quote: this.web3.utils.asciiToHex('quot'),
      created: this.web3.utils.asciiToHex('crea'),
      accepted: this.web3.utils.asciiToHex('accp'),
      location: this.web3.utils.asciiToHex('lctn'),
      completed: this.web3.utils.asciiToHex('cmpl'),
      newFare: this.web3.utils.asciiToHex('nfar')
    }
  }

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
    const account = await this.getAccount()
    const driver = await instance.drivers(account)
    const amountDeposited = driver[5]
    const amountToSend = driverDeposit - amountDeposited <= 0 ? 0 : driverDeposit - amountDeposited

    await this._waitForShh()
    return instance.driverAdvertise('' + lat, '' + lon, this._shhPubKey, {from: account, value: amountToSend})
  }

  /**
   * If an active advertisement exists, it is set as invalid. Deposits are not returned as a result of this action.
   *
   * @return {RevokeAdvertPromise} Promise which resolves when the transaction is mined
   */
  async driverRevokeAdvert () {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    return instance.driverRevokeAdvert({from: account})
  }

  /**
   * Gets a list of currently advertised drivers.
   *
   * @return {driver[]} Array of drivers
   */
  async getDrivers () {
    const instance = await this.contract.deployed()

    let drivers = []
    let currentDriver = await instance.dllDriverIndex('0x0', true)

    while (currentDriver !== Taxicoin.ZERO_ADDRESS) {
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
    await this._waitForShh()
    const account = await this.getAccount()

    const proposal = {
      address: account,
      pickup: pickup,
      dropoff: dropoff
    }

    return this.shh.post({
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
    await this._waitForShh()
    const account = await this.getAccount()

    const response = {
      address: account,
      fare: -1
    }

    return this.shh.post({
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
    await this._waitForShh()
    const account = await this.getAccount()

    const response = {
      address: account,
      fare: fare
    }

    return this.shh.post({
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
   * Todo.
   */
  async riderCreateJourney (driverAddress, fare) {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()
    const riderDeposit = await this.getRiderDeposit()
    const amountToSend = riderDeposit.addn(fare)

    return instance.riderCreateJourney(driverAddress, {from: account, value: amountToSend})
  }

  /**
   * Todo.
   */
  async riderCancelJourney () {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    return instance.riderCancelJourney({from: account})
  }

  /**
   * Todo.
   */
  async driverAcceptJourney (riderAddress) {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    return instance.driverAcceptJourney(riderAddress, {from: account})
  }

  /**
   * Complete a journey, thus completing the contract, transfering payment, and
   * returning deposits.
   */
  async completeJourney (rating) {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    return instance.completeJourney(rating, {from: account})

    // TODO: send journey complete message
  }

  async proposeNewFare (newFare) {
    // TODO: send shh message
  }

  /**
   * Todo.
   */
  async driverProposeFareAlteration (newFare) {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    return instance.driverProposeFareAlteration(newFare, {from: account})
  }

  /**
   * Todo.
   */
  async riderConfirmFareAlteration (newFare) {
    const instance = await this.contract.deployed()
    const account = await this.getAccount()

    const journey = await this.getJourney()

    let amountToSend = this.web3.utils.toBN(newFare).sub(journey.rider.fare)
    if (amountToSend.ltn(0)) {
      amountToSend = 0
    }

    return instance.riderConfirmFareAlteration(newFare, {from: account, value: amountToSend})
  }

  // ---------------- //
  // Whisper messages //
  // ---------------- //

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
  async on (name, handler) {
    await this._waitForShh()
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

  /**
   * Returns a promise which resolves only when Whisper is ready to be used.
   *
   * @private
   */
  async _waitForShh () {
    if (this._shhIdentity) {
      return
    }
    await this._setupShhIdentity()
  }

  /**
   * Sets up Whisper ready for use - initialise keys and start polling for new messages.
   *
   * @private
   */
  async _setupShhIdentity () {
    // set up Whisper with a new identity
    const id = this._shhPrivateKey ? await this.shh.addPrivateKey(this._shhPrivateKey) : await this.shh.newKeyPair()
    this._shhIdentity = id
    await this._generateShhFilter()
    const pubKey = await this.shh.getPublicKey(this._shhIdentity)
    this._shhPubKey = pubKey
  }

  // ---------------- //
  // Helper functions //
  // ---------------- //

  async getAccount () {
    return (this._web3Account || (await this.web3.eth.getAccounts())[0]).toLowerCase()
  }

  async getBalance () {
    const account = await this.getAccount()
    const balanceString = await this.web3.eth.getBalance(account)
    return this.web3.utils.toBN(balanceString)
  }

  async getUserType (account) {
    const instance = await this.contract.deployed()
    return (await instance.getUserType(account)).toNumber()
  }

  /**
   * Returns the details of a user's current journey
   */
  async getJourney () {
    const account = await this.getAccount()
    const userType = await this.getUserType(account)

    let driver, rider

    if (userType === Taxicoin.RIDER) {
      rider = await this.getRider(account)
      driver = await this.getDriver(rider.driver)
    } else if (userType === Taxicoin.ACTIVE_DRIVER) {
      driver = await this.getDriver(account)
      rider = await this.getRider(driver.rider)
    } else {
      return null
    }

    return {
      rider,
      driver
    }
  }

  async getDriver (address) {
    const instance = await this.contract.deployed()
    return this._driverArrayToObject(await instance.drivers(address))
  }

  async getRider (address) {
    const instance = await this.contract.deployed()
    return this._riderArrayToObject(await instance.riders(address))
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
      pubKey: driverArray[3],
      updated: driverArray[4].toNumber(),
      rider: driverArray[5],
      deposit: this.web3.utils.toBN(driverArray[6]),
      rating: driverArray[7].toNumber(),
      ratingCount: this.web3.utils.toBN(driverArray[8]),
      riderRating: driverArray[9].toNumber(),
      proposedNewFare: this.web3.utils.toBN(driverArray[10]),
      hasProposedNewFare: driverArray[11]
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
      fare: this.web3.utils.toBN(riderArray[2]),
      deposit: this.web3.utils.toBN(riderArray[3]),
      rating: riderArray[4].toNumber(),
      ratingCount: this.web3.utils.toBN(riderArray[5]),
      driverRating: riderArray[6].toNumber()
    }
  }

  async getDriverDeposit () {
    const instance = await this.contract.deployed()
    const deposit = await instance.driverDeposit()
    return this.web3.utils.toBN(deposit)
  }

  async getRiderDeposit () {
    const instance = await this.contract.deployed()
    const deposit = await instance.riderDeposit()
    return this.web3.utils.toBN(deposit)
  }

  async getShhPubKey () {
    await this._waitForShh()
    return this._shhPubKey
  }

  get web3Url () {
    return this.web3.currentProvider.host
  }

  set web3Url (url) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(url))
  }

  get shhUrl () {
    return this.shh.currentProvider.host
  }

  set shhUrl (url) {
    this.shh = new Shh(url)
    // TODO update identity, pending loading from localstorage
  }

  // ---------------- //
  // Type definitions //
  // ---------------- //

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
   * A promise for revoking a driver advertisement
   *
   * @promise RevokeAdvertPromise
   * @reject {EthereumNetworkError} Problem connecting to Ethereum network
   */

  /**
   * A promise for a driver advertisement.
   *
   * @promise AdvertisePromise
   * @reject {TypeError} The lat/lon values are not of the correct format
   * @reject {InsufficientDepositError} Not enough
   */
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
