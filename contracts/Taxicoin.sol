pragma solidity ^0.4.21;

import "./ITaxicoin.sol";

contract Taxicoin is ITaxicoin {

	uint8 public constant USERTYPE_NONE = 0;
	uint8 public constant USERTYPE_DRIVER = 1;
	uint8 public constant USERTYPE_ACTIVEDRIVER = 2;
	uint8 public constant USERTYPE_RIDER = 3;

	struct Driver {
		address addr;
		string lat;
		string lon;
		string pubKey;
		uint updated;
		address rider;
		uint deposit;
		uint8 rating;
		uint ratingCount;
		uint8 riderRating;
		uint proposedNewFare;
		bool hasProposedNewFare;
	}

	struct Rider {
		address addr;
		string pubKey;
		address driver;
		uint fare;
		uint deposit;
		uint8 rating;
		uint ratingCount;
		uint8 driverRating;
	}

	mapping(address => Driver) public drivers;
	mapping(address => Rider) public riders;

	// contract settings
	uint public driverDeposit;
	uint public riderDeposit;

	constructor() public {
		// in future, these will change dynamically
		driverDeposit = 100;
		riderDeposit = 100;
	}

	function driverAdvertise(string lat, string lon, string pubKey) public payable {
		// check the driver has paid deposit
		require(drivers[tx.origin].deposit >= driverDeposit || msg.value >= driverDeposit);

		// must not be ActiveDriver or Rider
		require(getUserType(tx.origin) != USERTYPE_ACTIVEDRIVER);
		require(getUserType(tx.origin) != USERTYPE_RIDER);

		// if new driver, add to index
		if (drivers[tx.origin].addr != tx.origin) {
			dllAddDriver(tx.origin);
		}

		// update driver state
		drivers[tx.origin].addr = tx.origin;
		drivers[tx.origin].lat = lat;
		drivers[tx.origin].lon = lon;
		drivers[tx.origin].updated = block.timestamp;
		drivers[tx.origin].deposit = drivers[tx.origin].deposit + msg.value;
		drivers[tx.origin].pubKey = pubKey;
	}

	function driverRevokeAdvert() public {
		// check driver is already advertised
		require(drivers[tx.origin].addr == tx.origin);

		// remove driver from index and mapping
		dllRemoveDriver(tx.origin);

		drivers[tx.origin].addr = address(0);
	}

	function riderCreateJourney(address driver, uint fare, string pubKey) public payable {
		// check the deposit + fare have been paid
		require(msg.value >= riderDeposit + fare);

		// check user is not already a rider or driver
		require(getUserType(tx.origin) == USERTYPE_NONE);

		// check driver is not the zero address
		require(driver != address(0));

		// check the driver is advertised
		require(getUserType(driver) == USERTYPE_ACTIVEDRIVER);

		// set the rider's deposit, fare and pubKey
		riders[tx.origin].deposit = riderDeposit;
		riders[tx.origin].fare = fare;
		riders[tx.origin].pubKey = pubKey;

		// set the rider's current driver
		riders[tx.origin].driver = driver;

		// set the rider's address
		riders[tx.origin].addr = tx.origin;

		// send back any excess value
		tx.origin.transfer(msg.value - riderDeposit - fare);
	}

	function riderCancelJourney() public {
		// rider must have created a journey
		require(riders[tx.origin].addr != address(0));

		// driver must not have accepted
		require(drivers[riders[tx.origin].driver].rider != tx.origin);

		// send back deposit and fare
		tx.origin.transfer(riders[tx.origin].deposit);
		tx.origin.transfer(riders[tx.origin].fare);

		// reset rider state
		riders[tx.origin].deposit = 0;
		riders[tx.origin].fare = 0;
		riders[tx.origin].driver = address(0);
		riders[tx.origin].addr = address(0);
	}

	function driverAcceptJourney(address rider, uint fare) public {
		// check the driver is advertised
		require(drivers[tx.origin].addr == tx.origin);

		// TODO: check fare

		// check the rider has agreed to ride with this driver
		require(riders[rider].driver == tx.origin);

		// set the driver's rider
		drivers[tx.origin].rider = rider;

		// remove from DLL
		dllRemoveDriver(tx.origin);
	}

	function completeJourney(uint8 rating) public {
		require(rating > 0);

		uint8 userType = getUserType(tx.origin);

		if (userType == USERTYPE_ACTIVEDRIVER) {

			// set rating to give to rider
			drivers[tx.origin].riderRating = rating;

			// if rider has rated us, apply everything
			if (riders[drivers[tx.origin].rider].driverRating != 0) {
				finaliseCompleteJourney(drivers[tx.origin].rider, tx.origin);
			}

		} else if(userType == USERTYPE_RIDER) {

			// set rating to give to driver
			riders[tx.origin].driverRating = rating;

			// if driver has rated us, apply everything
			if (drivers[riders[tx.origin].driver].riderRating != 0) {
				finaliseCompleteJourney(tx.origin, riders[tx.origin].driver);
			}

		} else {
			revert();
		}
	}

	function finaliseCompleteJourney(address riderAddr, address driverAddr) internal {
		// send rider deposit back
		riderAddr.transfer(riders[riderAddr].deposit);

		// if fare was non-zero, pay to driver and return driver deposit
		if (riders[riderAddr].fare > 0) {
			driverAddr.transfer(drivers[driverAddr].deposit);
			driverAddr.transfer(riders[riderAddr].fare);
		}

		// update driver rating
		drivers[driverAddr].rating = uint8((drivers[driverAddr].rating * drivers[driverAddr].ratingCount + riders[riderAddr].driverRating) / (drivers[driverAddr].ratingCount + 1));
		drivers[driverAddr].ratingCount++;

		// update rider rating
		riders[riderAddr].rating = uint8((riders[riderAddr].rating * riders[riderAddr].ratingCount + drivers[driverAddr].riderRating) / (riders[riderAddr].ratingCount + 1));
		riders[riderAddr].ratingCount++;

		// reset rider and driver state
		riders[riderAddr].addr = address(0);
		riders[riderAddr].driver = address(0);
		riders[riderAddr].driverRating = 0;
		riders[riderAddr].fare = 0;
		riders[riderAddr].deposit = 0;
		drivers[driverAddr].addr = address(0);
		drivers[driverAddr].rider = address(0);
		drivers[driverAddr].riderRating = 0;
		drivers[driverAddr].deposit = 0;
	}

	function driverProposeFareAlteration(uint newFare) public {
		// user must be active driver
		require(getUserType(tx.origin) == USERTYPE_ACTIVEDRIVER);

		// set the proposed new fare for driver
		drivers[tx.origin].proposedNewFare = newFare;
		drivers[tx.origin].hasProposedNewFare = true;
	}

	function riderConfirmFareAlteration(uint newFare) public payable {
		// user must be rider
		require(getUserType(tx.origin) == USERTYPE_RIDER);

		// driver must have already agreed to the same new fare
		require(drivers[riders[tx.origin].driver].hasProposedNewFare);
		require(drivers[riders[tx.origin].driver].proposedNewFare == newFare);

		uint fareDifference;

		if (newFare > riders[tx.origin].fare) {
			fareDifference = newFare - riders[tx.origin].fare;

			require(msg.value >= fareDifference);

			if (msg.value > fareDifference) {
				tx.origin.transfer(msg.value - fareDifference);
			}
		} else {
			fareDifference = riders[tx.origin].fare - newFare;
			tx.origin.transfer(fareDifference);
		}

		// set the new fare for the rider
		riders[tx.origin].fare = newFare;

		// reset the fare proposal for driver
		drivers[riders[tx.origin].driver].proposedNewFare = 0;
		drivers[riders[tx.origin].driver].hasProposedNewFare = false;
	}

	//------------------//
	// Helper functions //
	//------------------//

	function getUserType(address addr) public view returns (uint8) {
		if (drivers[addr].addr == addr) {
			if (drivers[addr].rider == address(0)) {
				return USERTYPE_DRIVER;
			} else {
				return USERTYPE_ACTIVEDRIVER;
			}
		} else if (riders[addr].addr == addr) {
			return USERTYPE_RIDER;
		} else {
			return USERTYPE_NONE;
		}
	}

	function getDriver(address driverAddr) public view returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare) {
		Driver dr = drivers[driverAddr];
		return(dr.addr, dr.lat, dr.lon, dr.pubKey, dr.updated, dr.rider, dr.deposit, dr.rating, dr.ratingCount, dr.riderRating, dr.proposedNewFare, dr.hasProposedNewFare);
	}

	function getNextDriver(address driverAddr) public view returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare) {
		//
	}

	function getPreviousDriver(address driverAddr) public view returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare) {
		//
	}

	function getRider(address riderAddr) public view returns (address addr, string pubKey, address driver, uint fare, uint deposit,	uint8 rating,	uint ratingCount,	uint8 driverRating) {
		//
	}

	//---------------------------------------------------------//
	// Double Linked List     																 //
	// Adapted from https://ethereum.stackexchange.com/a/15341 //
	//---------------------------------------------------------//

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
