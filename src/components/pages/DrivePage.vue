<template>
  <article-box class="center">
    <gmap-map :center="map.center" :zoom="map.zoom" :options="map.options" class="route-map" ref="map">
      <gmap-marker :position="map.currentLocation" :clickable="true" :draggable="false" :icon="map.currentLocationIcon"></gmap-marker>
    </gmap-map>
    <button type="button" class="advertise-button" @click="advertise">Advertise</button>
    <div v-for="(job, index) in jobs">Job: {{job}}</div>
  </article-box>
</template>

<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

import Taxicoin from '@/script/taxicoin'
import ArticleBox from '@/components/utility/ArticleBox'

Vue.use(VueGoogleMaps, {
  load: {
    libraries: 'places'
  }
})

export default {
  name: 'drive-page',
  data () {
    return {
      map: {
        center: {
          lat: 0,
          lng: 0
        },
        currentLocation: {
          lat: 0,
          lng: 0
        },
        currentLocationIcon: {
          url: 'https://i.stack.imgur.com/VpVF8.png',
          anchor: {
            x: 15,
            y: 15
          }
        },
        zoom: 14,
        options: {
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false
        }
      },
      tc: null,
      jobs: []
    }
  },
  components: {
    ArticleBox
  },
  watch: {
    '$route' (to, from) {
      Vue.$gmapDefaultResizeBus.$emit('resize')
    }
  },
  created () {
    this.tc = new Taxicoin()
    this.tc.on('job', this.handleJob)

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        this.map.center.lat = position.coords.latitude
        this.map.center.lng = position.coords.longitude
        this.updateLocation(position)
      })
      navigator.geolocation.watchPosition(this.updateLocation, null, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      })
    } else {
      alert('Geolocation not supported!')
    }
  },
  methods: {
    advertise () {
      this.tc.advertiseDriver(1, 1).then(_ => {
        console.log('advertised')
      }).catch(error => {
        // TODO handle error
        console.error(error)
      })
    },
    handleJob (job) {
      this.jobs.push(job)
    },
    updateLocation (position) {
      this.map.currentLocation.lat = position.coords.latitude
      this.map.currentLocation.lng = position.coords.longitude
    }
  }
}
</script>

<style lang="scss" scoped>
button {
  @include taxicoin-button($highlight-color, $text-color-light);
}

.advertise-button {
  margin-top: 10px;
}

.route-map {
  height: 400px;
  border: 1px solid $border-color;
}
</style>
