<template>
  <div id='container'>
    <canvas id='e'>
    </canvas>
  </div>
</template>

<script>
import { WEBGL } from 'three/examples/jsm/WebGL.js'
import Main from './js/gltfDemo.js'

export default {
  name: 'three3d',
  data () {
    return {
      title: 'gltf'
    }
  },
  created () {

  },
  mounted () {
    if ( WEBGL.isWebGLAvailable() ) {
      Main();
    } else {
      var warning = WEBGL.getWebGLErrorMessage();
      document.getElementById( 'container' ).appendChild( warning );
    }
  },
  methods: {
  },
  components: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#e {
  width: 100%;
  height: 100%;
  display: block;
}
#e:focus {
  outline: none;
}
#container {
  position: relative;  /* makes this the origin of its children */
  /* width: 100vw;
  height: 100vh; */
  overflow: hidden;
}
</style>
