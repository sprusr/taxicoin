const state = {
  loading: false,
  drivers: [],
  journey: {
    state: '', // '', 'proposing', 'proposed', 'quoted', 'accepting', 'accepted', 'happening', 'rating', 'ending', 'ended', 'finished'
    destination: {
      lat: null,
      lon: null
    },
    driver: {
      //
    },
    fare: 0
  }
}

export default state
