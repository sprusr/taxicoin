<template>
  <article-box class="center">
    <router-link to="/ride"><p class="taxi-emoji">🚖</p></router-link>
    <p>For more info, check the <router-link to="/about">about page</router-link>.</p>
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox'

export default {
  name: 'home-page',
  data () {
    return {}
  },
  components: {
    ArticleBox
  },
  methods: {}
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
