const getters = {

  isBackAvailable: state => {
    return state.journey.destination.lat !== null && state.journey.destination.lon !== null
  },

  destination: state => {
    return {
      lat: state.journey.destination.lat || 0,
      lon: state.journey.destination.lon || 0
    }
  },

  isDestinationSet: state => {
    return state.journey.destination.lat !== null && state.journey.destination.lon !== null
  },

  isPreJourney: state => state.journey.state === '',

  isProposing: state => state.journey.state === 'proposing',

  hasProposed: state => state.journey.state === 'proposed',

  hasBeenQuoted: state => state.journey.state === 'quoted',

  isAccepting: state => state.journey.state === 'accepting',

  hasAccepted: state => state.journey.state === 'accepted',

  isHappening: state => state.journey.state === 'happening',

  isRating: state => state.journey.state === 'rating',

  isEnding: state => state.journey.state === 'ending',

  hasEnded: state => state.journey.state === 'ended',

  isFinished: state => state.journey.state === 'finished'

}

export default getters
