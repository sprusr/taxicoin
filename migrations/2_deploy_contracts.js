var TaxiCoin = artifacts.require("./TaxiCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(TaxiCoin);
};
