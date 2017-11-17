<template>
  <article-box class="center">
    <input type="text" id="from-input" value="Current Location" placeholder="From...">
    <gmap-autocomplete id="to-input" value="" placeholder="To..." @place_changed="setPlace"></gmap-autocomplete>
    <gmap-map :center="map.center" :zoom="map.zoom" :options="map.options" class="route-map" ref="map">
      <gmap-marker :position="map.currentLocation" :clickable="true" :draggable="false" :icon="map.currentLocationIcon"></gmap-marker>
      <gmap-marker :position="map.toLocation" :clickable="true" :draggable="false"></gmap-marker>
      <gmap-polyline :path="[map.currentLocation, map.toLocation]" :editable="false" :draggable="false" :deepWatch="true" :options="map.routeLineOptions"></gmap-polyline>
    </gmap-map>
    <button type="button" class="order-button">Order (Advertise All)</button>
    <div v-for="(quote, index) in quotes">Quote: {{quote}}</div>
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
  name: 'ride-page',
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
        toLocation: {
          lat: 0,
          lng: 0
        },
        zoom: 14,
        options: {
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false
        },
        routeLineOptions: {
          strokeColor: '#000000',
          strokeOpacity: 0.5,
          strokeWeight: 2
        }
      },
      tc: null,
      quotes: []
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
    this.tc.on('quote', this.handleQuote)

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
    setPlace (place) {
      this.map.toLocation.lat = place.geometry.location.lat()
      this.map.toLocation.lng = place.geometry.location.lng()
      this.autoMapResize()
    },
    autoMapResize () {
      var bounds = new window.google.maps.LatLngBounds()
      bounds.extend(this.map.currentLocation)
      bounds.extend(this.map.toLocation)
      this.$refs.map.fitBounds(bounds)
    },
    order () {
      let drivers = this.tc.drivers()

      for (let driver of drivers) {
        this.tc.proposeJob(driver.address)
      }
    },
    handleQuote (quote) {
      this.quotes.push(quote)
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

.order-button {
  margin-top: 10px;
}

.route-map {
  height: 400px;
  border: 1px solid $border-color;
}

input[type="text"] {
  width: 100%;
  height: 40px;
  line-height: 40px;
  padding: 5px;
  font-size: 20px;
  display: block;
  border: 1px solid $border-color;
  border-bottom: none;
}
</style>
