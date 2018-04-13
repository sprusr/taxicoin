import Taxicoin from '@/script/taxicoin'

export default {
  install (Vue, options) {
    Vue.prototype.$tc = new Taxicoin({
      web3: {
        provider: 'http://localhost:7545'
      },
      shh: {
        provider: 'http://localhost:8545'
      }
    })
  }
}
