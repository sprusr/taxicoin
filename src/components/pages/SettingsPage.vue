<template>
  <article-box>
    <h1>Settings</h1>
    <label for="web3-url">
      <h2>Web3 RPC URL</h2>
      <p>Used for connecting to to the Ethereum network.</p>
    </label>
    <input type="text" id="web3-url" @blur="updateWeb3Url" v-model="web3Url">
    <label for="shh-url">
      <h2>Shh RPC URL</h2>
      <p>Used for connecting to to the Whisper network.</p>
    </label>
    <input type="text" id="shh-url" @blur="updateShhUrl" v-model="shhUrl">
  </article-box>
</template>

<script>
import ArticleBox from '@/components/utility/ArticleBox'
export default {
  name: 'settings-page',
  data () {
    return {
      web3Url: '',
      shhUrl: ''
    }
  },
  components: {
    ArticleBox
  },
  mounted () {
    this.web3Url = this.$tc.web3Url
    this.shhUrl = this.$tc.shhUrl
  },
  methods: {
    updateWeb3Url () {
      if (this.web3Url !== this.$tc.web3Url) {
        this.$tc.setWeb3Url(this.web3Url)
      }
    },
    updateShhUrl () {
      if (this.shhUrl !== this.$tc.shhUrl) {
        this.$tc.setShhUrl(this.shhUrl)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
label {
  display: block;
  margin-top: 1rem;

  h2 {
    font-size: 1.1rem;
  }

  p {
    margin: 0;
  }
}

input[type="text"] {
  @include taxicoin-input;
}
</style>
