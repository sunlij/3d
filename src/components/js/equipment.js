import * as THREE from 'three'
import {createScreen, makeCabinet, makeDevice} from './3dModel.js'
import { makeSprite } from './2dCanvas.js'
import makeLabel from './billboards.js'

function main ({
  scene,
  controls,
  sceneOrtho,
  renderFunction,
  tweenManager,
  commonObj,
  // resourceTracker
}, vueCom) {
  // 电视屏幕
  
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = 160;
  ctx.canvas.height = 90;
  ctx.fillStyle = '#FFF';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  function randInt(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.random() * (max - min) + min | 0;
  }

  function drawRandomDot() {
    ctx.fillStyle = `#${randInt(0x1000000).toString(16).padStart(6, '0')}`;
    ctx.beginPath();

    const x = randInt(160);
    const y = randInt(90);
    const radius = randInt(2, 30);
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // drawRandomDot()
  window.setInterval(function () {
    drawRandomDot()
    texture.needsUpdate = true;
    renderFunction()
  }, 500)

  let monitorScreen = createScreen(texture)
  scene.add(monitorScreen)
  monitorScreen.addEventListener( '3dclick', function ( event ) {
    console.log(event)

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.x = ctx.canvas.width;
    sprite.scale.y = ctx.canvas.height;

    // let obj = event.obj.clone()
    let obj = sprite
    obj.position.set(0, 0, 0)
    obj.name = 'spriteC'
    sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
    sceneOrtho.add(obj)
    renderFunction()
  })
  monitorScreen.position.set(460, 240, -378.5)

  const boxCallback = (event) => {
    // console.log(event)
    let obj = event.obj
    if (obj.layers.mask > 1 && obj.layers.mask < 4 ) {
      // let cabinetDoor = obj.getObjectByName('cabinetDoor')
      if (event.pickedObject.name === 'cabinetDoor') {
        obj.toggle()
      }
    } else {
      // 镜头目标
      let ta = new THREE.Vector3()
      obj.getWorldPosition(ta)

      obj.layers.enable(1)
      obj.traverse(function (child) {
        child.layers.enable(1)
      });
      
      commonObj.layerszObj = obj
      controls.object.layers.set(1)
      sceneOrtho.getObjectByName('spriteTL').visible = false
      var spriteTR = sceneOrtho.getObjectByName('spriteTR')
      vueCom.getDevide().then(function(){
        let dialog = makeSprite('dialog', {
          text: [
            '机柜',
            `ID: ${vueCom.idcCabinet.id}`,
            `名称: ${vueCom.idcCabinet.name}`,
            `状态: ${vueCom.idcCabinet.status}`,
            ` `,
            `机柜内设备`,
            `ID: ${vueCom.idcDevice.id}`,
            `名称: ${vueCom.idcDevice.name}`,
            `状态: ${vueCom.idcDevice.status}`,
          ]
        })
        dialog.center.set(1.0, 1.0)
        dialog.position.set(-50, -50, 1)
        dialog.name = 'dialog'
        spriteTR.add(dialog)

        let device = makeDevice()
        device.position.set(0, randInt(-80, 80), 0)
        device.layers.set(1)
        obj.addDevice(device)
      })
      // 镜头位置
      let b = new THREE.Vector3( 0, 0, 280);
      let quaternion = new THREE.Quaternion();
      obj.getWorldQuaternion(quaternion)
      b.applyQuaternion(quaternion)
      b.add(ta)

      tweenManager.createTween(controls.object.position)
      .to(b, 500)
      .start();
      tweenManager.createTween(controls.target)
      .to(ta, 500)
      .start();
      controls.update();
    }
    
    renderFunction()
  }
  var boxGroup = new THREE.Group()

  class CabinetGroup extends THREE.Group {
    constructor () {
      super()
      this.doorState = 'close'
      this.device = []
    }
    close () {
      console.log('to close')
      if (this.doorState === 'close') {
        return
      }
      let cabinetDoor = this.getObjectByName('cabinetDoor')
      if (cabinetDoor) {
        tweenManager.createTween(cabinetDoor.rotation)
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
      let cabinetDoor = this.getObjectByName('cabinetDoor')
      if (cabinetDoor) {
        tweenManager.createTween(cabinetDoor.rotation)
        .to({y: Math.PI * .7}, 500)
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
    addDevice (device) {
      this.device.push(device)
      this.add(device)
    }
    clearDevice() {
      this.remove(...this.device)
    }
  }

  // 机柜
  function makeBox (name = '', x = 0, z = 0, rotateY = 0, callback) {
    const goup = new THREE.Group();
    goup.position.set(x, 100, z)
    goup.rotateY(rotateY)

    const cabinet = makeCabinet(name)
    const cabinetGroup = new CabinetGroup()
    cabinetGroup.add(...cabinet.children)

    if (callback) {
      cabinetGroup.addEventListener( '3dclick', callback)
    }
    goup.add(cabinetGroup)
    
    return goup
  }
  
  for (var i = 0;i < 9; i++ ) {

    let boxA = makeBox('A0'+(i+1) , 300, 240-i*60,Math.PI * 0.5, boxCallback)
    let boxB = makeBox('B0'+(i+1) , 210, 240-i*60,Math.PI * -0.5, boxCallback)

    let boxC = makeBox('C0'+(i+1) , 0, 240-i*60,Math.PI * 0.5, boxCallback)
    let boxD = makeBox('D0'+(i+1) , -90, 240-i*60,Math.PI * -0.5, boxCallback)

    let boxE = makeBox('E0'+(i+1) , -300, 240-i*60,Math.PI * 0.5, boxCallback)
    let boxF = makeBox('F0'+(i+1) , -390, 240-i*60,Math.PI * -0.5, boxCallback)
    boxGroup.add(boxA, boxB, boxC, boxD, boxE, boxF)
  }
  boxGroup.name = 'boxGroup'
  scene.add(boxGroup)
  // 提示框
  let label = makeLabel({x: 0, y: 1}, 50, 16, 'warning!!!')
  label.addEventListener( '3dclick', function ( event ) {
    let a = event.pickedObject.clone()
    a.position.set(0, 0, 0)
    a.name = 'spriteC'
    sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
    sceneOrtho.add(a)
    renderFunction()
  })
  label.position.y = 220
  scene.add(label);
}

export default main