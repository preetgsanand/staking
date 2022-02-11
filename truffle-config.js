const HDWalletProvider = require('truffle-hdwallet-provider')

const infuraProvider = (network) => {
  return new HDWalletProvider(
      process.env.MNEMONIC,
      `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
  )
}

module.exports = {
  compilers: {
    solc: {
      version: "^0.8.0",
    }
  },
  networks: {
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*',
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
      gasPrice: 0x01,
    },
    ropsten: {
      provider: infuraProvider('ropsten'),
      network_id: '3',
      gasPrice: 5000000000,
    },
    rinkeby: {
      provider: infuraProvider('rinkeby'),
      network_id: '4',
      gasPrice: 5000000000,
    },
  },
}
