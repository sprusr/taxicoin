<template>
  <article-box class="center">
    <p>Current passenger: {{journey.rider}}</p>

    <button type="button" class="complete-journey-button" @click="completeJourney">Complete Journey</button>

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
  name: 'driver-journey-page',
  data () {
    return {
      journey: {},
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
    this.$tc.driverGetJourney().then(journey => {
      this.journey = journey
    })
  },
  methods: {
    completeJourney () {
      this.$tc.driverCompleteJourney(5).then(() => {
        console.log('journey marked as complete')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
button {
  @include taxicoin-button($highlight-color, $text-color-light);
}
</style>
