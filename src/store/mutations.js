const mutations = {

  setDestination (state, { lat, lon }) {
    state.journey.destination.lat = lat
    state.journey.destination.lon = lon
  },

  removeDestination (state) {
    state.journey.destination.lat = null
    state.journey.destination.lon = null
  },

  setDrivers (state, { drivers }) {
    state.drivers = drivers
  },

  setPreJourney (state) {
    state.journey.driver = {}
    state.journey.fare = 0
    state.journey.state = ''
  },

  setProposing (state) {
    state.journey.state = 'proposing'
  },

  setProposed (state, { driver }) {
    state.journey.driver = driver
    state.journey.state = 'proposed'
  },

  setQuoted (state, { fare }) {
    state.journey.fare = fare
    state.journey.state = 'quoted'
  },

  setAccepting (state) {
    state.journey.state = 'accepting'
  },

  setAccepted (state) {
    state.journey.state = 'accepted'
  },

  setHappening (state) {
    state.journey.state = 'happening'
  },

  setRating (state) {
    state.journey.state = 'rating'
  },

  setEnding (state) {
    state.journey.state = 'ending'
  },

  setEnded (state) {
    state.journey.state = 'ended'
  },

  setFinished (state) {
    state.journey.state = 'finished'
  }

}

export default mutations
