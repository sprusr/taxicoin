pragma solidity ^0.4.21;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

import "../../contracts/Taxicoin.sol";

contract TestTaxicoin {

  uint public initialBalance = 1 ether;

  function testDriverAdvertise() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());

    string memory lat = "1.23";
    string memory lon = "50.67";
    string memory pubKey = "<pub_key_goes_here>";

    uint driverDeposit = tc.driverDeposit();
    tc.driverAdvertise.value(driverDeposit)(lat, lon, pubKey);

    FetchedDriver memory dr = getDriver(tc, tx.origin);

    Assert.equal(dr.addr, tx.origin, "driver addr should equal address of sender");
    Assert.equal(dr.lat, lat, "driver lat should equal advertised lat");
    Assert.equal(dr.lon, lon, "driver lon should equal advertised lon");
    Assert.equal(dr.pubKey, pubKey, "driver pubKey should equal advertised pubKey");
    Assert.equal(dr.updated, block.timestamp, "driver updated should equal block timestamp");
    Assert.equal(dr.deposit, driverDeposit, "driver deposit should equal global driver deposit");
  }

  function testDriverRevokeAdvert() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testRiderCreateJourney() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testRiderCancelJourney() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testDriverAcceptJourney() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testCompleteJourney() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testDriverProposeFareAlteration() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testRiderConfirmFareAlteration() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testGetUserTypey() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testGetDriver() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testGetNextDriver() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testGetPreviousDriver() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  function testGetRider() public {
    Taxicoin tc = Taxicoin(DeployedAddresses.Taxicoin());
    Assert.equal(true, true, "Truth!");
  }

  /**************/

  struct FetchedDriver {
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

  function getDriver(Taxicoin tc, address driverAddr) internal view returns (FetchedDriver) {
    var (addr, lat, lon, pubKey, updated, rider, deposit, rating, ratingCount, riderRating, proposedNewFare, hasProposedNewFare) = tc.getDriver(driverAddr);
    return FetchedDriver(addr, lat, lon, pubKey, updated, rider, deposit, rating, ratingCount, riderRating, proposedNewFare, hasProposedNewFare);
  }

}
