var Taxicoin = artifacts.require("Taxicoin");

module.exports = function(deployer) {
  deployer.deploy(Taxicoin);
};
