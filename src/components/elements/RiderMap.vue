<template>
  <v-map class="rider-map" ref="map" :zoom="zoom" :center="[center.lat, center.lng]" :options="options" @l-load="autoMapResize">
    <v-tilelayer :url="url" :attribution="attribution"></v-tilelayer>
    <v-marker :lat-lng="[$location.lat, $location.lng]"></v-marker>
    <v-marker :lat-lng="[destination.lat, destination.lon]" :visible="isDestinationSet"></v-marker>
    <v-poly :lat-lngs="[[$location.lat, $location.lng], [destination.lat, destination.lon]]" :visible="isDestinationSet"></v-poly>
  </v-map>
</template>

<script>
import { mapGetters } from 'vuex'
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
  name: 'rider-map',
  components: {
    'v-map': Vue2Leaflet.Map,
    'v-tilelayer': Vue2Leaflet.TileLayer,
    'v-marker': Vue2Leaflet.Marker,
    'v-poly': Vue2Leaflet.Polyline
  },
  data () {
    return {
      options: {
        zoomControl: false,
        attributionControl: false
      },
      zoom: 13,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      center: {
        lat: 0,
        lng: 0
      }
    }
  },
  computed: {
    ...mapGetters({
      isDestinationSet: 'isDestinationSet',
      destination: 'destination'
    })
  },
  mounted () {
    this.$location.getLocation().then(position => {
      this.center.lat = position.coords.latitude
      this.center.lng = position.coords.longitude
    })
  },
  watch: {
    $location () {
      this.autoMapResize()
    },
    destination () {
      this.autoMapResize()
    }
  },
  methods: {
    autoMapResize () {
      let bounds = [[this.$location.lat, this.$location.lng]]
      if (this.isDestinationSet) {
        bounds.push([this.destination.lat, this.destination.lon])
      }
      this.$refs.map.mapObject.fitBounds(bounds, {maxZoom: 14})
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
