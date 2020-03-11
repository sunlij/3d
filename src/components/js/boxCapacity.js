import * as THREE from 'three'
import { makeBoxCapacity } from './3dModel.js'

function main ({
  scene,
  // controls,
  // sceneOrtho,
  renderFunction,
  // tweenManager,
  // commonObj,
  resourceTracker
}) {
  let boxGroup = scene.getObjectByName('boxGroup')
  const track = resourceTracker.track.bind(resourceTracker);

  function randInt(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.random() * (max - min) + min | 0;
  }
  
  if (boxGroup && boxGroup.visible) {
    boxGroup.visible = false

    var BoxCapacityGroup = new THREE.Group()
    for (var i = 0;i < 9; i++ ) {

      let boxA = makeBoxCapacity('A0'+(i+1) , 300, 240-i*60,randInt(200))
      let boxB = makeBoxCapacity('B0'+(i+1) , 210, 240-i*60,randInt(200))

      let boxC = makeBoxCapacity('C0'+(i+1) , 0, 240-i*60,randInt(200))
      let boxD = makeBoxCapacity('D0'+(i+1) , -90, 240-i*60,randInt(200))

      let boxE = makeBoxCapacity('E0'+(i+1) , -300, 240-i*60,randInt(200))
      let boxF = makeBoxCapacity('F0'+(i+1) , -390, 240-i*60,randInt(200))
      BoxCapacityGroup.add(boxA, boxB, boxC, boxD, boxE, boxF)
    }
    track(BoxCapacityGroup)
    scene.add(BoxCapacityGroup)
  } else {
    boxGroup.visible = true
    resourceTracker.dispose()
  }
  renderFunction()
}

export default main