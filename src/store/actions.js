import Vue from 'vue'

let v = new Vue()

const actions = {

  async goBack ({ commit, getters }) {
    if (getters.isProposing || getters.hasProposed) {
      v.$tc.off('quote')
      commit('setPreJourney')
    } else {
      commit('removeDestination')
    }
  },

  async loadState ({ commit }) {
    const journey = await v.$tc.getJourney()

    if (journey && journey.driver.addr) {
      if (journey.rider.driverRating) {
        commit('setEnded')
      } else {
        commit('setHappening')
      }

      commit('setDestination', { lat: 0, lon: 0 })
    }
  },

  async loadDrivers ({ commit }) {
    const drivers = await v.$tc.getDrivers()
    commit('setDrivers', { drivers })
  },

  async proposeToDriver ({ commit, state, dispatch }, { index, pickup, dropoff }) {
    commit('setProposing')

    v.$tc.on('quote', (msg) => dispatch('handleQuote', msg.body))

    const driver = state.drivers[index]
    await v.$tc.riderProposeJob(driver.pubKey, pickup, dropoff)
    commit('setProposed', { driver })
  },

  async handleQuote ({ commit }, { address, fare }) {
    v.$tc.off('quote')
    commit('setQuoted', { fare })
  },

  async rejectQuote ({ commit }) {
    commit('setPreJourney')
  },

  async acceptQuote ({ commit, state }) {
    commit('setAccepting')
    await v.$tc.riderCreateJourney(state.journey.driver.addr, state.journey.fare)
    commit('setAccepted')
    v.$tc.on('accepted', () => {
      v.$tc.off('accepted')
      commit('setHappening')
    })
  },

  async endJourney ({ commit, state }, { rating }) {
    commit('setEnding')
    await v.$tc.completeJourney(rating)
    const driver = v.$tc.getDriver(state.journey.driver.addr)

    if (driver.riderRating) {
      commit('setFinished')
    } else {
      commit('setEnded')
      v.$tc.on('completed', () => {
        v.$tc.off('completed')
        commit('setFinished')
      })
    }
  }

}

export default actions
