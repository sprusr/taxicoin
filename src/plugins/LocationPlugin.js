export default {
  install (Vue) {
    const storeVM = new Vue({
      data () {
        return {
          lat: 0,
          lng: 0
        }
      },
      methods: {
        getLocation () {
          return new Promise((resolve, reject) => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(position => {
                storeVM.lat = position.coords.latitude
                storeVM.lng = position.coords.longitude
                resolve(position)
              }, null, {
                enableHighAccuracy: true,
                timeout: Infinity,
                maximumAge: 0
              })
            } else {
              console.error('Geolocation is not supported')
              reject()
            }
          })
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
