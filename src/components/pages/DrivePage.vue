<template>
  <article-box class="center">
    <gmap-map :center="{lat: $location.lat, lng: $location.lng}" :zoom="map.zoom" :options="map.options" class="route-map" ref="map">
      <gmap-marker :position="{lat: $location.lat, lng: $location.lng}" :clickable="true" :draggable="false" :icon="map.currentLocationIcon"></gmap-marker>
    </gmap-map>
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

export default {
  name: 'drive-page',
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
        zoom: 14,
        options: {
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false
        }
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
    Modal
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
