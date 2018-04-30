<template>
  <div class="container">
    <div class="absolute-wrapper">
      <div class="rider-top-bar">
        <a role="button" @click="goBack" v-show="showBack"><font-awesome-icon :icon="faArrowLeft" transform="grow-6"/></a>
        <location-search @select="setDestination" v-show="!showBack"></location-search>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
import faArrowLeft from '@fortawesome/fontawesome-free-solid/faArrowLeft'

import LocationSearch from '@/components/elements/LocationSearch'

export default {
  name: 'rider-top-bar',
  components: {
    FontAwesomeIcon,
    LocationSearch
  },
  data () {
    return {
      faArrowLeft
    }
  },
  computed: {
    ...mapGetters({
      showBack: 'isBackAvailable'
    })
  },
  methods: {
    ...mapMutations({
      setDestination: 'setDestination'
    }),
    ...mapActions({
      goBack: 'goBack'
    })
  }
}
</script>

<style lang="scss" scoped>
.rider-top-bar {
  margin: 30px;
}
</style>
