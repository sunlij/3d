import * as THREE from 'three'
import { createFloor, createWall, createWall2, createWall3, createDoor} from './3dModel.js'

function main({scene, tweenManager, renderFunction}) {
  
  class DoorGroup extends THREE.Group {
    constructor () {
      super()
      this.doorState = 'close'
    }
    close () {
      console.log('to close')
      if (this.doorState === 'close') {
        return
      }
      let leftDoor = this.getObjectByName('leftDoor')
      let rightDoor = this.getObjectByName('rightDoor')
      if (leftDoor) {
        tweenManager.createTween(leftDoor.rotation)
        .to({y: 0}, 500)
        .start();
      }
      if (rightDoor) {
        tweenManager.createTween(rightDoor.rotation)
        .to({y: 0}, 500)
        .start();
      }
      this.doorState = 'close'
      renderFunction()
    }
    open () {
      console.log('to open')
      if (this.doorState === 'open') {
        return
      }
      let leftDoor = this.getObjectByName('leftDoor')
      let rightDoor = this.getObjectByName('rightDoor')
      if (leftDoor) {
        tweenManager.createTween(leftDoor.rotation)
        .to({y: Math.PI * -.5}, 500)
        .start();
      }
      if (rightDoor) {
        tweenManager.createTween(rightDoor.rotation)
        .to({y: Math.PI * .5}, 500)
        .start();
      }
      this.doorState = 'open'
      renderFunction()
    }
    toggle () {
      if (this.doorState === 'open') {
        this.close()
      } else {
        this.open()
      }
    }
  }
  const doorGroup = new DoorGroup()

  const doorModel = createDoor()
  doorGroup.add(...doorModel.children)

  doorGroup.addEventListener( '3dclick', function ( event ) {
    console.log('-----------')
    let obj = event.obj
    console.log(obj.doorState)
    obj.toggle()
  })
  scene.add(doorGroup)
  doorGroup.position.set(460, 100, 390)

  const floor = createFloor()
  scene.add(floor)

  let wall_1 = createWall({length: 1200})
  scene.add(wall_1)
  wall_1.position.z = -390
  let wall_2 = createWall3({length: 1200}, {})
  scene.add(wall_2)
  wall_2.position.z = 390
  let wall_3 = createWall2({length: 760}, {})
  scene.add(wall_3)
  wall_3.position.x = 590
  wall_3.rotation.y = Math.PI * -.5;
  let wall_4 = createWall2({length: 760}, {})
  scene.add(wall_4)
  wall_4.position.x = -590
  wall_4.rotation.y = Math.PI * -.5;
}

export default main