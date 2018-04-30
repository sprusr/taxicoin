<template>
  <div class="home-page">
    <!-- top bar -->
    <rider-top-bar></rider-top-bar>

    <!-- rider map -->
    <rider-map></rider-map>

    <!-- journey wizard -->
    <div class="container">
      <rider-journey-wizard></rider-journey-wizard>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import RiderTopBar from '@/components/elements/RiderTopBar'
import RiderMap from '@/components/elements/RiderMap'
import RiderJourneyWizard from '@/components/elements/RiderJourneyWizard'

export default {
  name: 'home-page',
  data () {
    return {
    }
  },
  computed: {
  },
  components: {
    RiderTopBar,
    RiderMap,
    RiderJourneyWizard
  },
  mounted () {
    this.loadState()
  },
  methods: {
    ...mapActions({
      loadState: 'loadState'
    })
  }
}
</script>

<style lang="scss" scoped>
@import "~leaflet/dist/leaflet.css";

.home-page {
  display: flex;
  flex-flow: column;
  height: 100%;
  position: relative;
}
</style>
