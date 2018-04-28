import Taxicoin from '@/script/taxicoin'

export default {
  install (Vue, options) {
    const web3Provider = window.web3 || 'http://localhost:7545'
    const shhProvider = window.web3 && !window.web3.currentProvider.isMetaMask ? window.web3 : 'http://localhost:8545'

    Vue.prototype.$tc = new Taxicoin({
      web3: {
        provider: web3Provider
      },
      shh: {
        provider: shhProvider
      }
    })
  }
}
