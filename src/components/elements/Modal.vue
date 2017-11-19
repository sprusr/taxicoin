<template>
  <div class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">
        <div class="modal-header">
          <slot name="header">
            <h1>Info</h1>
          </slot>
        </div>

        <div class="modal-body">
          <slot name="body">
            <p>Something has happened!</p>
          </slot>
        </div>

        <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="$emit('close')">Close</button>
            </slot>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'modal',
  data () {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.modal-mask {
  position: fixed;
  display: table;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 100;
}

.modal-wrapper {
  width: 500px;
  margin: 0 auto;
}

.modal-container {
  margin: 40px 20px;
  background-color: $content-background-color;
  padding: 10px;

  &::after {
    display: block;
    content: '';
    clear: both;
  }
}

.modal-default-button {
  @include taxicoin-button($highlight-color, $text-color-light);
  float: right;
}
</style>
