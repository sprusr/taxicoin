pragma solidity ^0.4.14;

contract TaxicoinInterface {

	enum UserType {None, Driver, ActiveDriver, Rider}

	function driverAdvertise(string lat, string lon, string pubKey) public payable;

	function driverRevokeAdvert() public;

	function riderCreateJourney(address driver, uint fare, string pubKey) public payable;

	function riderCancelJourney() public;

	function driverAcceptJourney(address rider, uint fare) public;

	function completeJourney(uint8 rating) public;

	function driverProposeFareAlteration(uint newFare) public;

	function riderConfirmFareAlteration(uint newFare) public payable;

	function getUserType(address addr) public view returns (UserType);

	function getDriver(address driverAddr) public returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare);

	function getNextDriver(address driverAddr) public returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare);

	function getPreviousDriver(address driverAddr) public returns (address addr, string lat, string lon, string pubKey, uint updated, address rider, uint deposit, uint8 rating, uint ratingCount, uint8 riderRating, uint proposedNewFare, bool hasProposedNewFare);

	function getRider(address riderAddr) public returns (address addr, string pubKey, address driver, uint fare, uint deposit,	uint8 rating,	uint ratingCount,	uint8 driverRating);

}
