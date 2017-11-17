pragma solidity ^0.4.4;

contract Taxicoin {
	event DriverRating(address indexed _driver, uint8 _rating);

	struct Journey {
		Driver driver;
		Rider rider;
		uint startTime;
		uint endTime;
	}

	struct Location {
		// multiply lat/lon by 1000000 and truncate to get int
		int lat;
		int lon;
	}

	struct Driver {
		address driverAddress;
		Location location;
		uint lastLocation; // time at which location was last published
	}

	struct Rider {
		address riderAddress;
		string name;
	}

	mapping(address => Driver) private drivers;

	function Taxicoin() public {
		//
	}

	function rateDriver(uint journeyId, uint8 rating) public returns(bool success) {
		// if not a passenger with them, return false
		// if already rated, return false

		//DriverRating(journey.driver.driverAddress, rating);

		return true;
	}

	function advertiseDriver(int lat, int lon) public returns(bool) {
		// if deposit not provided, revert and return false
		// if new driver, add to drivers list
		// set driver location and return true

		return true;
	}

	function revokeDriverAdvert() public returns(bool) {
		// if not valid driver or not advertised, revert and return false
		// set driver location to invalid and return true

		return true;
	}
}
