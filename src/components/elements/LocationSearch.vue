<template>
  <div class="location-search">
    <ul class="location-search-results">
      <li v-for="place, index in places" @click="onClick(index)">{{place.display_name}}</li>
    </ul>
    <input class="taxicoin-input location-search-input" type="text" id="to-input" value="" placeholder="Where do you want to go?" v-model="input" @blur="onBlur" @focus="onFocus" ref="input">
  </div>
</template>

<script>
import { NominatimJS } from 'nominatim-js'
import _ from 'lodash'

export default {
  name: 'location-search',
  data () {
    return {
      input: '',
      places: [],
      selectedLocation: null
    }
  },
  watch: {
    input (val) {
      this.getPlaces(val)
    }
  },
  methods: {
    getPlaces: _.debounce(function (placeName) {
      if (placeName.length >= 5 && this.$refs.input === document.activeElement) {
        NominatimJS.search({
          q: placeName
        }).then(results => {
          this.places = results
        }).catch(error => {
          console.error(error)
        })
      }
    }, 1000),
    onFocus () {
      // this.$refs.input.selectionStart = this.$refs.input.selectionEnd = this.$refs.input.value.length
      // this.input = ''
    },
    onBlur: _.debounce(function () {
      // this.places = []
      //
      // if (this.selectedLocation) {
      //   // this.input = this.selectedLocation.display_name
      //   this.input = ''
      //   this.$refs.input.selectionStart = this.$refs.input.selectionEnd = 0
      // } else {
      //   this.input = ''
      // }
    }, 300),
    onClick (index) {
      this.$emit('select', this.places[index])
      this.selectedLocation = this.places[index]
      // this.input = this.places[index].display_name
      this.input = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.location-search {
  position: relative;
}

.location-search-input {
  width: 100%;
  margin: 0;
  box-shadow: 0 0 3px 1px #999;
}

.location-search-results {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  z-index: 2000;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    margin: 0;
    width: 100%;
    height: 40px;
    line-height: 40px;
    background-color: #fff;
    border: 1px solid $border-color;
    border-top: none;
    padding: 0 5px;
    font-size: 12pt;
    display: block;
    vertical-align: middle;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }
}
</style>
