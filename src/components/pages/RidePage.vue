<template>
  <article-box class="center">
    <input type="text" id="from-input" value="Current Location" placeholder="From...">
    <gmap-autocomplete id="to-input" value="" placeholder="To..." @place_changed="setPlace"></gmap-autocomplete>
    <gmap-map :center="{lat: $location.lat, lng: $location.lng}" :zoom="map.zoom" :options="map.options" class="route-map" ref="map">
      <gmap-marker :position="{lat: $location.lat, lng: $location.lng}" :clickable="true" :draggable="false" :icon="map.currentLocationIcon"></gmap-marker>
      <gmap-marker :position="map.toLocation" :clickable="true" :draggable="false"></gmap-marker>
      <gmap-polyline :path="[{lat: $location.lat, lng: $location.lng}, map.toLocation]" :editable="false" :draggable="false" :deepWatch="true" :options="map.routeLineOptions"></gmap-polyline>
    </gmap-map>
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

export default {
  name: 'ride-page',
  data () {
    return {
      map: {
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
      drivers: [],
      quotes: []
    }
  },
  components: {
    ArticleBox
  },
  mounted () {
    this.$tc.on('quote', this.handleQuote)
  },
  methods: {
    setPlace (place) {
      this.map.toLocation.lat = place.geometry.location.lat()
      this.map.toLocation.lng = place.geometry.location.lng()
      this.autoMapResize()
    },
    autoMapResize () {
      var bounds = new window.google.maps.LatLngBounds()
      bounds.extend({lat: this.$location.lat, lng: this.$location.lng})
      bounds.extend(this.map.toLocation)
      this.$refs.map.fitBounds(bounds)
    },
    listDrivers () {
      this.$tc.getDrivers().then(drivers => {
        this.drivers = drivers
      })
    },
    propose (index) {
      const driver = this.drivers[index]

      this.$tc.riderProposeJob(driver.pubKey, {lat: this.$location.lat, lng: this.$location.lng}, this.map.toLocation).then(() => {
        console.log('proposed')
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
