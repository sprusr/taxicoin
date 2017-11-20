import Taxicoin from '@/script/taxicoin'

export default {
  install (Vue, options) {
    Vue.prototype.$tc = new Taxicoin()
  }
}
