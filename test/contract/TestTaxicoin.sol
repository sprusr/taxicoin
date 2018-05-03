pragma solidity ^0.4.21;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

import "../../contracts/Taxicoin.sol";

contract TestTaxicoin {

  uint public initialBalance = 1 ether;

  function testDriverAdvertise() public {
    Taxicoin tc = new Taxicoin();

    string memory lat = "1.23";
    string memory lon = "50.67";
    string memory pubKey = "<pub_key_goes_here>";
    uint driverDeposit = tc.driverDeposit();

    // test without deposit
    ThrowProxy throwProxy = new ThrowProxy(address(tc));
    Taxicoin(address(throwProxy)).driverAdvertise(lat, lon, pubKey);
    bool result = throwProxy.execute.gas(200000)();
    Assert.false(result, "driverAdvertse should throw if deposit not provided");

    // test with expected conditions
    tc.driverAdvertise.value(driverDeposit)(lat, lon, pubKey);
    FetchedDriver memory dr = getDriver(tc, tx.origin);

    Assert.equal(dr.addr, tx.origin, "driver addr should equal address of sender");
    Assert.equal(dr.lat, lat, "driver lat should equal advertised lat");
    Assert.equal(dr.lon, lon, "driver lon should equal advertised lon");
    Assert.equal(dr.pubKey, pubKey, "driver pubKey should equal advertised pubKey");
    Assert.equal(dr.updated, block.timestamp, "driver updated should equal block timestamp");
    Assert.equal(dr.deposit, driverDeposit, "driver deposit should equal global driver deposit");

    // test is in list
    bool driverFound = isInDriverList(tx.origin);
    Assert.isTrue(driverFound, "driver should be in driver index");
  }

  function testDriverRevokeAdvert() public {
    Taxicoin tc = new Taxicoin();

    string memory lat = "1.23";
    string memory lon = "50.67";
    string memory pubKey = "<pub_key_goes_here>";
    uint driverDeposit = tc.driverDeposit();

    // test before driver has advertised
    ThrowProxy throwProxy = new ThrowProxy(address(tc));
    Taxicoin(address(throwProxy)).driverRevokeAdvert();
    bool result = throwProxy.execute.gas(200000)();
    Assert.false(result, "driverRevokeAdvert should throw if caller is not advertised");

    // test expected
    tc.driverAdvertise.value(driverDeposit)(lat, lon, pubKey);
    tc.driverRevokeAdvert();
    FetchedDriver memory dr = getDriver(tc, tx.origin);

    Assert.equal(dr.addr, address(0), "driver addr should equal zero");
    Assert.equal(dr.deposit, driverDeposit, "driver deposit should not be returned");

    // test is not in list
    bool driverFound = isInDriverList(tx.origin);
    Assert.isFalse(driverFound, "driver should not be in driver index");
  }

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

  function isInDriverList(address _driver) {
    address currentDriver = tc.dllDriverIndex(address(0), true);
    bool driverFound = false;

    while (!driverFound && currentDriver != address(0)) {
      if (currentDriver == _driver) {
        driverFound = true;
      }
      currentDriver = tc.dllDriverIndex(currentDriver, true);
    }

    return driverFound;
  }

}

// from http://truffleframework.com/tutorials/testing-for-throws-in-solidity-tests
// proxy contract for testing throws
contract ThrowProxy {
  address public target;
  bytes data;

  function ThrowProxy(address _target) {
    target = _target;
  }

  // prime the data using the fallback function.
  function() {
    data = msg.data;
  }

  function execute() returns (bool) {
    return target.call(data);
  }
}
