<template>
  <div class="container">
    <article>
      <slot></slot>
    </article>
  </div>
</template>

<script>
export default {
  name: 'article-box',
  data () {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  max-width: $page-width;
  margin: 0 auto;
  padding: 10px;

}

article {
  background-color: $content-background-color;
  border: 1px solid $border-color;
  padding: 10px;
}
</style>
