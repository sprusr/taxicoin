import Taxicoin from '@/script/taxicoin'

export default {
  install (Vue, options) {
    Vue.prototype.$tc = new Taxicoin('http://localhost:7545', 'http://localhost:8545')
  }
}
