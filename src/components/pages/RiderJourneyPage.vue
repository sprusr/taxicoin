<template>
  <article-box class="center">
    <p>Currently on journey with: {{journey.driver}}</p>

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
  name: 'rider-journey-page',
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
    this.$tc.getJourney().then(journey => {
      this.journey = journey
    })
  },
  methods: {
    completeJourney () {
      console.log('doing')
      this.$tc.completeJourney('5').then(() => {
        console.log('journey completed!')
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
