# Taxicoin

Taxicoin is a decentralised ride-sharing protocol, which uses Ethereum to manage logistics. The aim of the project is to provide a more open alternative to existing applications, and one without any intermediary to take a cut of driver profits.

It is the final year project of Scott Street, a Computer Science undergraduate at Aston University, Birmingham. As such, please do not attempt to contribute!

# Running Locally

You'll first need to install the project dependencies: `nodejs`, `npm`, [`ganache`](http://truffleframework.com/ganache/), [`geth`](https://github.com/ethereum/go-ethereum/).

1. Clone this repo to somewhere on your computer
2. Launch `ganache`, make sure it's using port `7545` and leave it running in the background
3. Run `geth` using the following, and keep it running in the background:
```sh
# run on rinkeby testnet, allow anybody to connect, and enable the Whisper protocol
geth console --rinkeby --rpc --rpccorsdomain "http://localhost:*" --shh
```
4. Run some commands to set everything up:
```sh
cd /where/you/put/taxicoin
# install dependencies
npm install
# migrate Ethereum smart contracts
npm run contract
# start the dev server
npm run dev
```
5. This should open a browser window at `http://localhost:8080` where you can start playing with Taxicoin!

## Multiple Accounts for Testing

As a single user of Taxicoin is not able to be both a rider and a driver simultaneously, for testing purposes it is useful to be able to use two Ethereum accounts. The browser plugin [`MetaMask`](https://metamask.io/) allows this.

After installation, set the network to custom RPC, with the url `http://127.0.0.1:7545` (your local ganache test node). In ganache, you may click the key icon to the right of each address to display the private key for that address. You may then use this to import the account into MetaMask.

Now when visiting the Taxicoin example client, it will automatically use MetaMask to interact with the smart contract. Simply toggle between two imported Ganache accounts to represent either a rider or driver.
