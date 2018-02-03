<template>
  <article-box class="center">
    <v-map :zoom="map.zoom" :center="[$location.lat, $location.lng]" class="route-map">
      <v-tilelayer :url="map.url" :attribution="map.attribution"></v-tilelayer>
      <v-marker :lat-lng="[$location.lat, $location.lng]"></v-marker>
    </v-map>
    <button type="button" class="advertise-button" @click="advertise">Advertise</button>
    <ul>
      <li v-for="(job, index) in jobs">
        <p>Job: {{job}}</p>
        <button type="button" class="quote-button" @click="quote(index)">Quote</button>
        <button type="button" class="reject-button" @click="reject(index)">Reject</button>
        <button type="button" class="accept-contract-button" @click="acceptContract(index)">Accept Contract</button>
      </li>
    </ul>

    <modal v-if="errorModal.show" @close="errorModal.show = false">
      <h1 slot="header">Error</h1>
      <p slot="body">{{errorModal.message}}</p>
    </modal>
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox'
import Modal from '@/components/elements/Modal'

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
  name: 'drive-page',
  data () {
    console.log(Vue2Leaflet)
    return {
      map: {
        zoom: 13,
        url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      },
      jobs: [],
      errorModal: {
        show: false,
        message: ''
      }
    }
  },
  components: {
    ArticleBox,
    Modal,
    'v-map': Vue2Leaflet.Map,
    'v-tilelayer': Vue2Leaflet.TileLayer,
    'v-marker': Vue2Leaflet.Marker
  },
  mounted () {
    this.$tc.on('job', this.handleJob)
  },
  methods: {
    advertise () {
      this.$tc.driverAdvertise(this.$location.lat, this.$location.lng).then(() => {
        console.log('advertised')
      }).catch(error => {
        this.showError(error.message)
      })
    },
    quote (index) {
      this.$tc.driverQuoteProposal(this.jobs[index].sig, 100).then(() => {
        console.log('quoted')
      })
    },
    reject (index) {
      this.$tc.driverRejectProposal(this.jobs[index].sig).then(() => {
        console.log('rejected')
      })
    },
    acceptContract (index) {
      this.$tc.driverAcceptJourney(this.jobs[index].body.address).then(() => {
        console.log('journey is happening!')
      })
    },
    handleJob (job) {
      this.jobs.push(job)
    },
    showError (message) {
      this.errorModal.message = message
      this.errorModal.show = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~leaflet/dist/leaflet.css";

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
