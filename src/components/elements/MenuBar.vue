<template>
  <nav class="menu-bar">
    <div class="container">
      <div class="title">
        <h1><router-link to="/">🚖 taxicoin</router-link></h1>
      </div>
      <ul class="nav">
        <li><router-link to="/ride">Ride</router-link></li>
        <li><router-link to="/drive">Drive</router-link></li>
        <li><router-link to="/settings"><font-awesome-icon :icon="icon"/></router-link></li>
      </ul>
    </div>
  </nav>
</template>

<script>
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
import faCog from '@fortawesome/fontawesome-free-solid/faCog'

export default {
  name: 'menu-bar',
  data () {
    return {
      settingsModal: {
        show: false
      }
    }
  },
  computed: {
    icon () {
      return faCog
    }
  },
  components: {
    FontAwesomeIcon
  }
}
</script>

<style lang="scss" scoped>
.menu-bar {
  height: 60px;
  line-height: 60px;
  background-color: $highlight-color;
  color: $text-color-light;
}

.container {
  width: 100%;
  max-width: $page-width;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
}

.title {
  display: inline-block;
  padding: 0 10px;
}

.nav {
  list-style: none;
  margin: 0;
  padding: 0;

  a {
    display: inline-block;
    padding: 0 10px;
  }

  li {
    display: inline-block;
    margin: 0;
  }
}
</style>
