<template>
  <div id="app">
    <menu-bar></menu-bar>
    <router-view></router-view>
  </div>
</template>

<script>
import MenuBar from '@/components/elements/MenuBar'
export default {
  name: 'app',
  components: {
    MenuBar
  }
}
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

body, html {
  margin: 0;
  padding: 0;
  background-color: $page-background-color;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
  font-weight: bold;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: $text-color;
}
</style>
