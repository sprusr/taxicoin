pragma solidity ^0.4.4;

contract TaxiCoin {
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

	mapping(address => Driver) public drivers;

	function TaxiCoin() {
		//
	}

	function rateDriver(Journey journey, uint8 rating) returns(bool success) {
		// if not a passenger with them, return false
		// if already rated, return false

		DriverRating(journey.driver.driverAddress, rating);

		return true;
	}

	function publishDriverLocation(int lat, int lon) returns(bool) {
		if (!drivers[msg.sender]) return false;

		drivers[msg.sender].lastLocation = now;
		drivers[msg.sender].location = Location({
			lat: lat,
			lon: lon
		});

		return true;
	}
}
