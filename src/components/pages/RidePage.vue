<template>
  <article-box class="center">
    <input class="from-location" type="text" id="from-input" value="Current Location" placeholder="From...">
    <location-search @select="setPlace"></location-search>
    <v-map ref="map" :zoom="map.zoom" :center="[map.center.lat, map.center.lng]" class="route-map" @l-load="autoMapResize">
      <v-tilelayer :url="map.url" :attribution="map.attribution"></v-tilelayer>
      <v-marker :lat-lng="[$location.lat, $location.lng]"></v-marker>
      <v-marker :lat-lng="map.toLocation"></v-marker>
      <v-poly :lat-lngs="[[$location.lat, $location.lng], [map.toLocation.lat, map.toLocation.lng]]" :visible="map.routeLine"></v-poly>
    </v-map>
    <button type="button" class="list-button" @click="listDrivers">List Drivers</button>
    <ul>
      <li v-for="(driver, index) in drivers">
        <p>Driver: {{driver}}</p>
        <button type="button" class="order-button" @click="propose(index)">Propose Job</button>
      </li>
    </ul>
    <ul>
      <li v-for="(quote, index) in quotes">
        <p>Quote: {{quote}}</p>
        <button type="button" class="order-button" @click="accept(index)">Accept Quote</button>
      </li>
    </ul>
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox'
import LocationSearch from '@/components/elements/LocationSearch'

import Vue2Leaflet from 'vue2-leaflet'
import L from 'leaflet'

// hack because leaflet doesn't play well with webpack
// https://github.com/PaulLeCam/react-leaflet/issues/255#issuecomment-261904061
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

export default {
  name: 'ride-page',
  data () {
    return {
      map: {
        zoom: 13,
        url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        toLocation: {
          lat: 0,
          lng: 0
        },
        center: {
          lat: 0,
          lng: 0
        },
        routeLine: false
      },
      toPlaceName: '',
      places: [],
      drivers: [],
      quotes: []
    }
  },
  components: {
    ArticleBox,
    'v-map': Vue2Leaflet.Map,
    'v-tilelayer': Vue2Leaflet.TileLayer,
    'v-marker': Vue2Leaflet.Marker,
    'v-poly': Vue2Leaflet.Polyline,
    LocationSearch
  },
  mounted () {
    this.$tc.on('quote', this.handleQuote)
    this.$location.getLocation().then(position => {
      this.map.center.lat = position.coords.latitude
      this.map.center.lng = position.coords.longitude
    })
  },
  methods: {
    setPlace (place) {
      this.map.toLocation.lat = place.lat
      this.map.toLocation.lng = place.lon
      this.autoMapResize()
    },
    autoMapResize () {
      let bounds = [[this.$location.lat, this.$location.lng]]
      if (this.map.toLocation.lat && this.map.toLocation.lng) {
        bounds.push([this.map.toLocation.lat, this.map.toLocation.lng])
        this.map.routeLine = true
      }
      this.$refs.map.mapObject.fitBounds(bounds, {maxZoom: 14})
    },
    listDrivers () {
      this.$tc.getDrivers().then(drivers => {
        this.drivers = drivers
      })
    },
    propose (index) {
      const driver = this.drivers[index]

      this.$tc.riderProposeJob(driver.pubKey, {lat: this.$location.lat, lng: this.$location.lng}, this.map.toLocation).then((msg) => {
        console.log('proposed', msg)
      })
    },
    accept (index) {
      this.$tc.riderCreateJourney(this.quotes[index].body.address, this.quotes[index].body.fare).then(() => {
        console.log('journey contract created')
      })
    },
    handleQuote (quote) {
      this.quotes.push(quote)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~leaflet/dist/leaflet.css";

button {
  @include taxicoin-button($highlight-color, $text-color-light);
}

.list-button, .order-button {
  margin-top: 10px;
}

.route-map {
  height: 400px;
  border: 1px solid $border-color;
}

.from-location {
  @include taxicoin-input;
  width: 100%;
  margin-top: 0;
}
</style>
