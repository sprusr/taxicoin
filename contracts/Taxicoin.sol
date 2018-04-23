pragma solidity ^0.4.14;

import "./TaxicoinInterface.sol";

contract Taxicoin is TaxicoinInterface {

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

	function Taxicoin() public {
		// in future, these will change dynamically
		driverDeposit = 100;
		riderDeposit = 100;
	}

	function driverAdvertise(string lat, string lon, string pubKey) public payable {
		// check the driver has paid deposit
		require(drivers[msg.sender].deposit >= driverDeposit || msg.value >= driverDeposit);

		// must not be ActiveDriver or Rider
		require(getUserType(msg.sender) != UserType.ActiveDriver);
		require(getUserType(msg.sender) != UserType.Rider);

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
	}

	function driverRevokeAdvert() public {
		// check driver is already advertised
		require(drivers[msg.sender].addr == msg.sender);

		// remove driver from index and mapping
		dllRemoveDriver(msg.sender);

		drivers[msg.sender].addr = address(0);
	}

	function riderCreateJourney(address driver, uint fare, string pubKey) public payable {
		// check the deposit + fare have been paid
		require(msg.value >= riderDeposit + fare);

		// check the passenger is not already on a journey
		require(riders[msg.sender].driver == address(0));

		// check driver is not the zero address
		require(driver != address(0));

		// check the driver is advertised
		require(drivers[driver].addr == driver);

		// set the rider's deposit, fare and pubKey
		riders[msg.sender].deposit = riderDeposit;
		riders[msg.sender].fare = fare;
		riders[msg.sender].pubKey = pubKey;

		// set the rider's current driver
		riders[msg.sender].driver = driver;

		// set the rider's address
		riders[msg.sender].addr = msg.sender;

		// send back any excess value
		msg.sender.transfer(msg.value - riderDeposit - fare);
	}

	function riderCancelJourney() public {
		// rider must have created a journey
		require(riders[msg.sender].addr != address(0));

		// driver must not have accepted
		require(drivers[riders[msg.sender].driver].rider != msg.sender);

		// send back deposit and fare
		msg.sender.transfer(riders[msg.sender].deposit);
		msg.sender.transfer(riders[msg.sender].fare);

		// reset rider state
		riders[msg.sender].deposit = 0;
		riders[msg.sender].fare = 0;
		riders[msg.sender].driver = address(0);
		riders[msg.sender].addr = address(0);
	}

	function driverAcceptJourney(address rider) public {
		// check the driver is advertised
		require(drivers[msg.sender].addr == msg.sender);

		// check the rider has agreed to ride with this driver
		require(riders[rider].driver == msg.sender);

		// set the driver's rider
		drivers[msg.sender].rider = rider;

		// remove from DLL
		dllRemoveDriver(msg.sender);
	}

	function completeJourney(uint8 rating) public {
		require(rating > 0);

		UserType userType = getUserType(msg.sender);

		if (userType == UserType.ActiveDriver) {

			// set rating to give to rider
			drivers[msg.sender].riderRating = rating;

			// if rider has rated us, apply everything
			if (riders[drivers[msg.sender].rider].driverRating != 0) {
				finaliseCompleteJourney(drivers[msg.sender].rider, msg.sender);
			}

		} else if(userType == UserType.Rider) {

			// set rating to give to driver
			riders[msg.sender].driverRating = rating;

			// if driver has rated us, apply everything
			if (drivers[riders[msg.sender].driver].riderRating != 0) {
				finaliseCompleteJourney(msg.sender, riders[msg.sender].driver);
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
		require(getUserType(msg.sender) == UserType.ActiveDriver);

		// set the proposed new fare for driver
		drivers[msg.sender].proposedNewFare = newFare;
		drivers[msg.sender].hasProposedNewFare = true;
	}

	function riderConfirmFareAlteration(uint newFare) public payable {
		// user must be rider
		require(getUserType(msg.sender) == UserType.Rider);

		// driver must have already agreed to the same new fare
		require(drivers[riders[msg.sender].driver].hasProposedNewFare);
		require(drivers[riders[msg.sender].driver].proposedNewFare == newFare);

		uint fareDifference;

		if (newFare > riders[msg.sender].fare) {
			fareDifference = newFare - riders[msg.sender].fare;

			require(msg.value >= fareDifference);

			if (msg.value > fareDifference) {
				msg.sender.transfer(msg.value - fareDifference);
			}
		} else {
			fareDifference = riders[msg.sender].fare - newFare;
			msg.sender.transfer(fareDifference);
		}

		// set the new fare for the rider
		riders[msg.sender].fare = newFare;

		// reset the fare proposal for driver
		drivers[riders[msg.sender].driver].proposedNewFare = 0;
		drivers[riders[msg.sender].driver].hasProposedNewFare = false;
	}

	//------------------//
	// Helper functions //
	//------------------//

	function getUserType(address addr) public view returns (UserType) {
		if (drivers[addr].addr == addr) {
			if (drivers[addr].rider == address(0)) {
				return UserType.Driver;
			} else {
				return UserType.ActiveDriver;
			}
		} else if (riders[addr].addr == addr) {
			return UserType.Rider;
		} else {
			return UserType.None;
		}
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
