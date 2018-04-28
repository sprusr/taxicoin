import Taxicoin from '@/script/taxicoin'

export default {
  install (Vue, options) {
    const web3Provider = window.web3 || process.env.ETH_NODE
    const shhProvider = window.web3 && !window.web3.currentProvider.isMetaMask && process.env.SHH_USE_PROVIDED ? window.web3 : process.env.SHH_NODE

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
