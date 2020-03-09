<template>
  <div id='container'>
    <canvas id='d'>
    </canvas>
    <div id="labels"></div>
    <br />
    <div class="box" v-show="showHtml">
      <p>ID:{{idcBarn.id}}</p>
      <p>城市:{{idcBarn.city}}</p>
      <p>名称:{{idcBarn.name}}</p>
    </div>
    <!-- <canvas id='c'>
    </canvas> -->
  </div>
</template>

<script>
import { WEBGL } from 'three/examples/jsm/WebGL.js'
// import Main from './js/3dDataCenter.js'
import Init from './js/init.js'
import Building from './js/building.js'
import Equipment from './js/equipment.js'
import UiInit from './js/ui.js'
import BoxCapacity from './js/boxCapacity.js'
import GetData from '../mockData/index.js'

export default {
  name: 'three3d',
  data () {
    return {
      title: 'three.js演示',
      showHtml: false,
      idcBarn: '',
      idcCabinet: '',
      idcDevice: '',
      threeInfo:{
        canvas: '',
        camera: '',
        scene: '',
        controls: '',
        uiCamera: '',
        uiScene: '',
        renderFunction: '',
        tweenManager: '',
        resourceTracker: ''
      }
    }
  },
  created () {

  },
  mounted () {
    if ( WEBGL.isWebGLAvailable() ) {
      // Main();
      this.threeInfo = Init()
      this.uiInit()
      this.getBarn()
      this.getCabinet()
    } else {
      var warning = WEBGL.getWebGLErrorMessage();
      document.getElementById( 'container' ).appendChild( warning );
    }
  },
  methods: {
    uiInit () {
      UiInit(this.threeInfo, this)
    },
    createBuilding () {
      Building(this.threeInfo)
    },
    createEquipment() {
      Equipment(this.threeInfo, this)
    },
    showBoxCapacity() {
      BoxCapacity(this.threeInfo)
    },
    toggleHtml () {
      this.showHtml = !this.showHtml
    },
    getBarn () {
      return GetData('idcBarn').then((data) => {
        console.log(data)
        this.idcBarn = data
        this.createBuilding();
      })
    },
    getCabinet(){
      return GetData('idcCabinet').then((data) => {
        console.log(data)
        this.idcCabinet = data
        this.createEquipment()
      })
    },
    getDevide(){
      return GetData('idcDevice').then((data) => {
        console.log(data)
        this.idcDevice = data
      })
    }
  },
  components: {

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#c,#d {
  width: 100%;
  height: 100%;
  display: block;
}
#c:focus,#d:focus {
  outline: none;
}
#container {
  position: relative;  /* makes this the origin of its children */
  /* width: 100vw;
  height: 100vh; */
  overflow: hidden;
}
.box {
  position: absolute;
  top: 40px;
  left: 100px;
  color: white;
  background-color: black;
  padding: 10px 20px;
  border-radius: 5px;
}
#labels {
  position: absolute;  /* let us position ourself inside the container */
  left: 0;             /* make our position the top left of the container */
  top: 0;
  color: white;
}
#labels>div {
  position: absolute;  /* let us position them inside the container */
  left: 0;             /* make their default position the top left of the container */
  top: 0;
  cursor: pointer;     /* change the cursor to a hand when over us */
  font-size: large;
  user-select: none;   /* don't let the text get selected */
  text-shadow:         /* create a black outline */
  -1px -1px 0 #000,
  0   -1px 0 #000,
  1px -1px 0 #000,
  1px  0   0 #000,
  1px  1px 0 #000,
  0    1px 0 #000,
  -1px  1px 0 #000,
  -1px  0   0 #000;
}
#labels>div:hover {
  color: red;
}
</style>
