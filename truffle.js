module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "5777", // ganache
      gas: 6000000
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "4", // Match any network id
      gas: 6000000
    }
  },
  //contracts_build_directory: "./dist/contracts", // disabled until fix for https://github.com/trufflesuite/truffle-migrate/issues/10
  test_directory: "./test/contract"
};
