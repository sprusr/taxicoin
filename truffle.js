module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    }
  },
  contracts_build_directory: "./dist/contracts",
  test_directory: "./test/contract"
};
