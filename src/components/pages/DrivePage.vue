<template>
  <article-box class="center">
    <gmap-map :center="{lat: $location.lat, lng: $location.lng}" :zoom="map.zoom" :options="map.options" class="route-map" ref="map">
      <gmap-marker :position="{lat: $location.lat, lng: $location.lng}" :clickable="true" :draggable="false" :icon="map.currentLocationIcon"></gmap-marker>
    </gmap-map>
    <button type="button" class="advertise-button" @click="advertise">Advertise</button>
    <div v-for="(job, index) in jobs">Job: {{job}}</div>
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
      this.$tc.advertiseDriver(1, 1).then(_ => {
        // TODO visual feedback
        console.log('advertised')
      }).catch(error => {
        this.showError(error.message)
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
