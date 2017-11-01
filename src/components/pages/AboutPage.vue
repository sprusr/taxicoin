<template>
  <article-box>
    <h2>What the heck is taxicoin?</h2>
    <p>Taxicoin is the creation of Scott Street, a final year student at Aston University. The aim of the project is to explore how we can use recent <em>blockchain-based</em> technologies to change the way in which we develop for the web.</p>
    <p>For more information about the background and motivation for this project, please have a read of the <a href="https://github.com/sprusr/taxicoin/blob/master/docs/project-definition.pdf">project definition</a>.</p>
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox'
export default {
  name: 'about-page',
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

<style lang="scss" scoped>
</style>
