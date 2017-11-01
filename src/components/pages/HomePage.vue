<template>
  <article-box class="center">
    <p class="taxi-emoji">🚖</p>
    <p>For more info, check the <router-link to="/about">about page</router-link>.</p>
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox.vue'
export default {
  name: 'home-page',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  components: {
    ArticleBox
  }
}
</script>

<style scoped>
.center {
  text-align: center;
}
.taxi-emoji {
  font-size: 100pt;
  line-height: 50pt;
}
</style>
