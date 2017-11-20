export default {
  install (Vue) {
    const storeVM = new Vue({
      data () {
        return {
          lat: 0,
          lng: 0
        }
      }
    })

    Vue.mixin({
      beforeCreate () {
        this.$location = storeVM
      }
    })

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(position => {
        storeVM.lat = position.coords.latitude
        storeVM.lng = position.coords.longitude
      }, null, {
        enableHighAccuracy: false,
        timeout: 500,
        maximumAge: 0
      })
    } else {
      console.error('Geolocation is not supported')
    }
  }
}
