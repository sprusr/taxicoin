pragma solidity ^0.4.14;

contract Taxicoin {
	struct Driver {
		address addr;
		string lat;
		string lon;
		uint updated;
		address rider;
		uint deposit;
		uint8 rating;
		uint ratingCount;
		uint8 riderRating;
		string pubKey;
	}

	struct Rider {
		address addr;
		address driver;
		uint fare;
		uint deposit;
		uint8 rating;
		uint ratingCount;
	}

	mapping(address => Driver) public drivers;
	mapping(address => Rider) public riders;

	// contract settings
	uint public driverDeposit;
	uint public riderDeposit;

	function Taxicoin() public {
		// in future, these will change dynamically
		driverDeposit = 100;
		riderDeposit = 100;
	}

	function driverAdvertise(string lat, string lon, string pubKey) public payable {
		// check the driver has paid deposit
		require(drivers[msg.sender].deposit >= driverDeposit || msg.value >= driverDeposit);

		// if new driver, add to index
		if (drivers[msg.sender].addr != msg.sender) {
			dllAddDriver(msg.sender);
		}

		// update driver state
		drivers[msg.sender].addr = msg.sender;
		drivers[msg.sender].lat = lat;
		drivers[msg.sender].lon = lon;
		drivers[msg.sender].updated = block.timestamp;
		drivers[msg.sender].deposit = drivers[msg.sender].deposit + msg.value;
		drivers[msg.sender].pubKey = pubKey;

		// potentially fire an event here
	}

	function driverRevokeAdvert() public {
		// check driver is already advertised
		require(drivers[msg.sender].addr == msg.sender);

		// remove driver from index and mapping
		dllRemoveDriver(msg.sender);

		drivers[msg.sender].addr = address(0);
	}

	function riderCreateJourney(address driver) public payable {
		// check the deposit has been paid
		require(msg.value >= riderDeposit);

		// check the passenger is not already on a journey
		require(riders[msg.sender].driver == address(0));

		// check the driver is advertised
		require(drivers[driver].addr == driver);

		// set the rider's deposit and fare
		riders[msg.sender].deposit = riderDeposit;
		riders[msg.sender].fare = msg.value - riderDeposit;

		// set the rider's current driver
		riders[msg.sender].driver = driver;

		// set the rider's address
		riders[msg.sender].addr = msg.sender;
	}

	function driverAcceptJourney(address rider) public {
		// check the driver is advertised
		require(drivers[msg.sender].addr == msg.sender);

		// check the rider has agreed to ride with this driver
		require(riders[rider].driver == msg.sender);

		// set the driver's rider
		drivers[msg.sender].rider = rider;
	}

	function driverCompleteJourney(uint8 rating) public {
		// check driver is on a journey
		require(drivers[msg.sender].rider != address(0));

		// set rating for rider
		drivers[msg.sender].riderRating = rating;
	}

	function riderCompleteJourney(uint8 rating) public {
		address riderAddr = msg.sender;
		address driverAddr = riders[riderAddr].driver;

		// check the rider is on a journey
		require(riders[riderAddr].driver != address(0));

		// check the driver has completed the journey
		require(drivers[driverAddr].riderRating != 0);

		// send deposits back and pay fare
		riderAddr.transfer(riders[riderAddr].deposit);
		driverAddr.transfer(drivers[driverAddr].deposit + riders[riderAddr].fare);

		// update driver rating
		drivers[driverAddr].rating = uint8((drivers[driverAddr].rating * drivers[driverAddr].ratingCount + rating) / (drivers[driverAddr].ratingCount + 1));
		drivers[driverAddr].ratingCount++;

		// update rider rating
		riders[riderAddr].rating = uint8((riders[riderAddr].rating * riders[riderAddr].ratingCount + drivers[driverAddr].riderRating) / (riders[riderAddr].ratingCount + 1));
		riders[riderAddr].ratingCount++;

		// potentially fire a rating event here

		// reset rider and driver state
		riders[riderAddr].addr = address(0);
		riders[riderAddr].driver = 0;
		riders[riderAddr].fare = 0;
		riders[riderAddr].deposit = 0;
		drivers[driverAddr].addr = address(0);
		drivers[driverAddr].rider = 0;
		drivers[driverAddr].riderRating = 0;
		drivers[driverAddr].deposit = 0;

		// remove driver from index
		dllRemoveDriver(driverAddr);
	}

	/*
	* Double Linked List
	* Adapted from https://ethereum.stackexchange.com/a/15341
	*/

	mapping(address => mapping(bool => address)) public dllDriverIndex;

	bool constant PREV = false;
	bool constant NEXT = true;

	function dllAddDriver(address addr) internal {
		// link the new node
		dllDriverIndex[addr][PREV] = 0x0;
		dllDriverIndex[addr][NEXT] = dllDriverIndex[0x0][NEXT];

		// insert the new node
		dllDriverIndex[dllDriverIndex[0x0][NEXT]][PREV] = addr;
		dllDriverIndex[0x0][NEXT] = addr;
	}

	function dllRemoveDriver(address addr) internal {
		// stitch the neighbours together
		dllDriverIndex[dllDriverIndex[addr][PREV]][NEXT] = dllDriverIndex[addr][NEXT];
		dllDriverIndex[dllDriverIndex[addr][NEXT]][PREV] = dllDriverIndex[addr][PREV];

		// delete state storage
		delete dllDriverIndex[addr][PREV];
		delete dllDriverIndex[addr][NEXT];
	}
}
