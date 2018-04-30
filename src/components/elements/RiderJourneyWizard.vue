<template>
  <div class="container">
    <div class="rider-journey-wizard-wrapper absolute-wrapper">
      <div class="rider-journey-wizard" v-show="showJourneyWizard">
        <div class="driver-search center" :disabled="proposing" v-show="preJourney || proposing">
          <p>Searching for drivers <font-awesome-icon :icon="faSpinner" spin /></p>
          <div class="drivers">
            <div v-for="driver, index in drivers" class="driver">
              <a role="button" @click="proposeToDriver({ index, pickup: {lat: $location.lat, lon: $location.lng}, dropoff: destination })"><img :src="`https://identicon-api.herokuapp.com/${driver.addr}/64?format=png`" alt="driver image"></a>
            </div>
          </div>
        </div>
        <div class="driver-proposal center" v-show="proposed">
          <p>Waiting for response from driver <font-awesome-icon :icon="faSpinner" spin /></p>
        </div>
        <div class="driver-quote center" v-show="quoted">
          <p>Driver offered quote of {{ journey.fare }}</p>
          <div class="buttons">
            <button type="button" class="accept-quote-button taxicoin-button" @click="accept">Accept</button>
            <button type="button" class="reject-quote-button taxicoin-button" @click="reject">Reject</button>
          </div>
        </div>
        <div class="accepting-quote center" v-show="accepting">
          <p>Accepting driver's quote (this takes a moment) <font-awesome-icon :icon="faSpinner" spin /></p>
        </div>
        <div class="accepted-quote center" v-show="accepted">
          <p>Driver's quote accepted! Waiting for driver to confirm <font-awesome-icon :icon="faSpinner" spin /></p>
        </div>
        <div class="journey-happening center" v-show="happening">
          <p>You are currently on a journey with {{ journey.driver.addr }}</p>
          <div class="buttons">
            <button type="button" class="end-journey-button taxicoin-button" @click="setRating">Complete Journey</button>
            <button type="button" class="end-journey-button taxicoin-button" @click="">Propose Fare Alteration</button>
          </div>
        </div>
        <div class="journey-rating center" v-show="rating">
          <input type="text" class="taxicoin-input" v-model="ratingInput">
          <div class="buttons">
            <button type="button" class="end-journey-button taxicoin-button" @click="endJourney({ rating: ratingInput })">Complete Journey</button>
          </div>
        </div>
        <div class="ending center" v-show="ending">
          <p>Completing the journey <font-awesome-icon :icon="faSpinner" spin /></p>
        </div>
        <div class="ended center" v-show="ended">
          <p>Waiting for driver to complete journey <font-awesome-icon :icon="faSpinner" spin /></p>
        </div>
        <div class="finished center" v-show="finished">
          <p>Journey complete!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'

export default {
  name: 'rider-journey-wizard',
  components: {
    FontAwesomeIcon
  },
  mounted () {
    this.interval = setInterval(this.loadDrivers, 2000)
  },
  data () {
    return {
      faSpinner,
      ratingInput: '',
      interval: null
    }
  },
  computed: {
    ...mapState({
      drivers: 'drivers',
      journey: 'journey'
    }),
    ...mapGetters({
      destination: 'destination',
      showJourneyWizard: 'isDestinationSet',
      preJourney: 'isPreJourney',
      proposing: 'isProposing',
      proposed: 'hasProposed',
      quoted: 'hasBeenQuoted',
      accepting: 'isAccepting',
      accepted: 'hasAccepted',
      happening: 'isHappening',
      rating: 'isRating',
      ending: 'isEnding',
      ended: 'hasEnded',
      finished: 'isFinished'
    })
  },
  methods: {
    ...mapMutations({
      setRating: 'setRating'
    }),
    ...mapActions({
      proposeToDriver: 'proposeToDriver',
      loadDrivers: 'loadDrivers',
      accept: 'acceptQuote',
      reject: 'rejectQuote',
      endJourney: 'endJourney'
    })
  }
}
</script>

<style lang="scss" scoped>
.rider-journey-wizard-wrapper {
  bottom: 0;
}

.rider-journey-wizard {
  background-color: $content-background-color;
  border: 1px 0 1px 1px solid $border-color;
  box-shadow: 0 0 3px 1px #999;
  padding: 20px;
  margin: 0 30px;
  word-wrap: break-word;
}
</style>
