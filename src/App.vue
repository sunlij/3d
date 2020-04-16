<template>
  <div id="app">
    <Three3d />
    <Gltf />
  </div>
</template>

<script>
import Three3d from './components/three3d.vue'
import Gltf from './components/gltf.vue'

export default {
  name: 'App',
  components: {
    Three3d,
    Gltf
  }
}
</script>

<style>
html, body {
  margin: 0;
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
