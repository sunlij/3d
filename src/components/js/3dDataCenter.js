import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'

import makeLabel from './billboards.js'

import ClosePng from '../img/close.png';

// 鼠标选中
class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    // this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      // this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      // requestRenderIfNotRequested()
      this.pickedObject = undefined;
    }

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      // this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color to flashing red/yellow
      // this.pickedObject.material.emissive.setHex(0xFFFF00);
      // requestRenderIfNotRequested()

      return this.pickedObject
    }
    
  }
}

// 补间动画管理
class TweenManger {
  constructor() {
    this.numTweensRunning = 0;
  }
  _handleComplete() {
    --this.numTweensRunning;
    console.assert(this.numTweensRunning >= 0);
  }
  createTween(targetObject) {
    const self = this;
    ++this.numTweensRunning;
    let userCompleteFn = () => {};
    // create a new tween and install our own onComplete callback
    const tween = new TWEEN.Tween(targetObject).onComplete(function(...args) {
      self._handleComplete();
      userCompleteFn.call(this, ...args);
    });
    // replace the tween's onComplete function with our own
    // so we can call the user's callback if they supply one.
    tween.onComplete = (fn) => {
      userCompleteFn = fn;
      return tween;
    };
    return tween;
  }
  update() {
    TWEEN.update();
    return this.numTweensRunning > 0;
  }
}

function main () {
  // canvas, renderer, camera, scene
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.autoClear = false; // To allow render overlay on top of another

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 2500;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 800, 1000)

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('green');

  const canvas_width = canvas.clientWidth;
  const canvas_height = canvas.clientHeight;
  var cameraOrtho, sceneOrtho;
  cameraOrtho = new THREE.OrthographicCamera( - canvas_width / 2, canvas_width / 2, canvas_height / 2, - canvas_height / 2, 1, 300 );
  cameraOrtho.position.z = 200;
  sceneOrtho = new THREE.Scene();

  var layerszObj

  const tweenManager = new TweenManger();
  const pickHelper = new PickHelper()
  var textureLoader = new THREE.TextureLoader();

  // UI
  var spriteTL, spriteTR, spriteBL, spriteBR, spriteC;
  textureLoader.load( ClosePng, createHUDSprites );
  function createHUDSprites( texture ) {
    var material = new THREE.SpriteMaterial( { map: texture } );

    // var width = material.map.image.width;
    // var height = material.map.image.height;
    var width = 20;
    var height = 20;

    spriteTL = new THREE.Sprite( material );
    spriteTL.center.set( 0.0, 1.0 );
    spriteTL.scale.set( width, height, 1 );
    sceneOrtho.add( spriteTL );

    spriteTR = new THREE.Sprite( material );
    spriteTR.center.set( 1.0, 1.0 );
    spriteTR.scale.set( width, height, 1 );
    sceneOrtho.add( spriteTR );
    spriteTR.name = 'spriteTR'
    spriteTR.addEventListener( '3dclick', function ( event ) {
      console.log(event)
      sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
      requestRenderIfNotRequested()
    })

    spriteBL = new THREE.Sprite( material );
    spriteBL.center.set( 0.0, 0.0 );
    spriteBL.scale.set( width, height, 1 );
    sceneOrtho.add( spriteBL );

    spriteBR = new THREE.Sprite( material );
    spriteBR.center.set( 1.0, 0.0 );
    spriteBR.scale.set( width, height, 1 );
    sceneOrtho.add( spriteBR );
    spriteBR.addEventListener( '3dclick', function ( event ) {
      console.log(event)
      layerszObj && layerszObj.layers.set(0)
      camera.layers.set(0)
      controls.reset ()
      requestRenderIfNotRequested()
    })

    spriteC = new THREE.Sprite( material );
    spriteC.center.set( 0.5, 0.5 );
    spriteC.scale.set( width, height, 1 );
    sceneOrtho.add( spriteC );
    spriteC.name = 'spriteC'

    updateHUDSprites();

  }

  function updateHUDSprites() {

    var width = canvas.clientWidth / 2;
    var height = canvas.clientHeight / 2;

    spriteTL && spriteTL.position.set( - width, height, 1 ); // top left
    spriteTR && spriteTR.position.set( width, height, 1 ); // top right
    spriteBL && spriteBL.position.set( - width, - height, 1 ); // bottom left
    spriteBR && spriteBR.position.set( width, - height, 1 ); // bottom right
    spriteC && spriteC.position.set( 0, 0, 1 ); // center

  }

  // var helper = new THREE.CameraHelper( camera );
  // scene.add( helper );

  // 帧数监测
  const container = document.getElementById( 'container' )
  const stats = new Stats();
  container.appendChild( stats.dom );
  stats.update()

  // 镜头控制
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.enableDamping = true; // 启用阻尼（惯性）
  controls.enablePan = false // 禁用摄像机平移
  controls.maxDistance =  1500// 相机向外移动多少
  controls.minDistance = 200// 相机向内移动多少
  controls.maxPolarAngle = Math.PI *.5// 垂直旋转的角度的上限
  controls.minPolarAngle = 0 // 垂直旋转的角度的下限 默认值为0
  controls.target.set(0, 50, 0);
  controls.update();

  // 获取鼠标所在canvas位置
  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  // 获取在3d视图的位置
  // function getPickPosition(event) {
  //   const pos = getCanvasRelativePosition(event);
  //   return {
  //     x: (pos.x / canvas.clientWidth ) *  2 - 1,
  //     y: (pos.y / canvas.clientHeight) * -2 + 1  // note we flip Y
  //   }  
  // }

  // 点击事件
  const maxClickTimeMs = 200;
  const maxMoveDeltaSq = 5 * 5;
  const startPosition = {};
  let startTimeMs;

  function recordStartTimeAndPosition(event) {
    startTimeMs = performance.now();
    const pos = getCanvasRelativePosition(event);
    startPosition.x = pos.x;
    startPosition.y = pos.y;
  }

  window.addEventListener('mousedown', recordStartTimeAndPosition)
  window.addEventListener('mouseup', function(event){
    // if it's been a moment since the user started
    // then assume it was a drag action, not a select action
    const clickTimeMs = performance.now() - startTimeMs;
    if (clickTimeMs > maxClickTimeMs) {
      return;
    }
   
    // if they moved assume it was a drag action
    const position = getCanvasRelativePosition(event);
    const moveDeltaSq = (startPosition.x - position.x) ** 2 + (startPosition.y - position.y) ** 2;
    if (moveDeltaSq > maxMoveDeltaSq) {
      return;
    }

    let pickPosition = {
      x: (position.x / canvas.clientWidth ) *  2 - 1,
      y: (position.y / canvas.clientHeight) * -2 + 1  // note we flip Y
    }
    let pickedObject = pickHelper.pick(pickPosition, scene, camera)
    let pickedUIObject = pickHelper.pick(pickPosition, sceneOrtho, cameraOrtho)

    function dispatchAll(pickedObject, obj) {
      if(obj.parent && obj.parent !== null) {
        obj.parent.dispatchEvent( { type: '3dclick', obj: obj.parent, pickedObject: pickedObject })
        dispatchAll(pickedObject, obj.parent)
      }
    }
    if (pickedUIObject) {
      pickedUIObject.dispatchEvent( { type: '3dclick', obj: pickedUIObject, pickedObject: pickedUIObject })
      dispatchAll(pickedUIObject, pickedUIObject)
      return
    }
    if (!pickedObject || camera.layers.mask !== pickedObject.layers.mask) {
      return
    }
    if (pickedObject) {
      pickedObject.dispatchEvent( { type: '3dclick', obj: pickedObject, pickedObject: pickedObject })
      dispatchAll(pickedObject, pickedObject)
    }
  })

  // 环境光
  var ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);
  var ambientLight_1 = new THREE.AmbientLight(0x606060);
  ambientLight_1.layers.set(2)
  scene.add(ambientLight_1);
  // 平行光
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);

  // 提示框
  let label = makeLabel({x: 0, y: 1}, 50, 16, 'warning!!!')
  label.addEventListener( '3dclick', function ( event ) {
    let a = event.pickedObject.clone()
    a.position.set(0, 0, 0)
    a.name = 'spriteC'
    sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
    sceneOrtho.add(a)
    requestRenderIfNotRequested()
  })
  label.position.y = 220
  scene.add(label);

  // 地板
  function createFloor() {
    const shape = new THREE.Shape();
    const length = 1200
    const width = 800
    shape.moveTo( 0,0 );
    shape.lineTo( 0, width );
    shape.lineTo( length, width );
    shape.lineTo( length, 0 );
    shape.lineTo( 0, 0 );

    const extrudeSettings = {
      steps: 2,
      depth: 5,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    geometry.translate(-600, -400, -2.5)

    const material = new THREE.MeshPhongMaterial({color: 0xffffff});
    const floor = new THREE.Mesh(geometry, material);

    floor.rotation.x = Math.PI * -.5;
    floor.position.y = -2.5
    scene.add(floor)

    return floor
  }
  createFloor()

  // 墙
  function createWall ({length = 100}) {
    const shape = new THREE.Shape();
    const width = 300
    const depth = 20
    shape.moveTo( 0,0 );
    shape.lineTo( 0, width );
    shape.lineTo( length, width );
    shape.lineTo( length, 0 );
    shape.lineTo( 0, 0 );

    const extrudeSettings = {
      steps: 2,
      depth: depth,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    geometry.translate(-length / 2, -width / 2, -depth /2)

    const material = new THREE.MeshPhongMaterial({color: 0xffffff});
    const wall = new THREE.Mesh(geometry, material);

    wall.position.y = width / 2

    return wall
  }
  // 墙 带窗户
  function createWall2 ({length = 100}, {w_left = 20, w_right = 20, w_top = 20, w_bottom = 20 }) {
    const shape = new THREE.Shape();
    const width = 300
    const depth = 20
    shape.moveTo( 0,0 );
    shape.lineTo( 0, width );
    shape.lineTo( length, width );
    shape.lineTo( length, 0 );
    shape.lineTo( w_left, 0 );
    shape.lineTo( w_left, w_bottom);
    shape.lineTo( length - w_right, w_bottom);
    shape.lineTo( length - w_right, width - w_top);
    shape.lineTo( w_left, width - w_top);
    shape.lineTo( w_left, 0);
    shape.lineTo( 0, 0);

    const extrudeSettings = {
      steps: 2,
      depth: depth,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    geometry.translate(-length / 2, -width / 2, -depth /2)

    const material = new THREE.MeshPhongMaterial({color: 0xffffff});
    const wall = new THREE.Mesh(geometry, material);

    const w_geometry = new THREE.BoxGeometry(length - w_left - w_right , width - w_top - w_bottom, 5);
    var glass_material = new THREE.MeshBasicMaterial({
        color: 0XECF1F3,
        opacity: 0.5,
        transparent: true
    });
    const glass = new THREE.Mesh(w_geometry, glass_material);
    var group = new THREE.Group();
    group.add( wall )
    group.add( glass )
    group.position.y = width / 2

    return group
  }
  // 墙带 门洞
  function createWall3 ({length = 100}, {w_left = 960, w_right = 40, w_top = 100, w_bottom = 2 }) {
    const shape = new THREE.Shape();
    const width = 300
    const depth = 20
    shape.moveTo( 0,0 );
    shape.lineTo( 0, width );
    shape.lineTo( length, width );
    shape.lineTo( length, 0 );
    shape.lineTo( w_left, 0 );
    shape.lineTo( w_left, w_bottom);
    shape.lineTo( length - w_right, w_bottom);
    shape.lineTo( length - w_right, width - w_top);
    shape.lineTo( w_left, width - w_top);
    shape.lineTo( w_left, 0);
    shape.lineTo( 0, 0);

    const extrudeSettings = {
      steps: 2,
      depth: depth,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    geometry.translate(-length / 2, -width / 2, -depth /2)

    const material = new THREE.MeshPhongMaterial({color: 0xffffff});
    const wall = new THREE.Mesh(geometry, material);

    wall.position.y = width / 2

    return wall
  }
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

  // 门
  function createDoor () {
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
        requestRenderIfNotRequested()
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
        requestRenderIfNotRequested()
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

    // 门框 先省略
    // 创建 门
    const d_left_geometry = new THREE.BoxGeometry(98, 180, 4);
    d_left_geometry.translate( 48, 0, 0 )
    var glass_material = new THREE.MeshBasicMaterial({
        // color: 'black',
        color: 0x58ACFA,
        opacity: 0.9,
        transparent: true
    });
    const doorLeft = new THREE.Mesh(d_left_geometry, glass_material);
    doorLeft.name = 'leftDoor'
    doorLeft.position.x = -98
    doorGroup.add(doorLeft)

    const d_right_geometry = new THREE.BoxGeometry(98, 180, 5);
    d_right_geometry.translate( -48, 0, 0 )
    const doorRight = new THREE.Mesh(d_right_geometry, glass_material);
    doorRight.name = 'rightDoor'
    doorRight.position.x = 98
    doorGroup.add(doorRight)

    doorGroup.addEventListener( '3dclick', function ( event ) {
      console.log('-----------')
      let obj = event.obj
      console.log(obj.doorState)
      obj.toggle()
    })

    return doorGroup
  }
  let door = createDoor()
  scene.add(door)
  door.position.set(460, 100, 390)

  // 电视屏幕
  function createScreen(){
    const geometry = new THREE.BoxGeometry(160, 90, 3);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 160;
    ctx.canvas.height = 90;
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const texture = new THREE.CanvasTexture(ctx.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
    });

    const materialOther = new THREE.MeshPhongMaterial({color: 0x42474c})

    const materials = [
      materialOther, // 右
      materialOther, // 左
      materialOther, // 上
      materialOther, // 下
      material,      // 前
      materialOther  // 后
    ];
    const cube = new THREE.Mesh(geometry, materials);

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
      requestRenderIfNotRequested()
    }, 500)

    return cube
  }
  let monitorScreen = createScreen()
  scene.add(monitorScreen)
  monitorScreen.addEventListener( '3dclick', function ( event ) {
    let obj = event.obj.clone()
    obj.position.set(0, 0, 0)
    obj.name = 'spriteC'
    sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
    sceneOrtho.add(obj)
    requestRenderIfNotRequested()
  })
  monitorScreen.position.set(460, 240, -378.5)

  // 机柜
  function makeBox (name, x = 0, z = 0, rotateY = 0) {
    const geometry = new THREE.BoxGeometry(60, 200, 60);
    const material = new THREE.MeshPhongMaterial({color: 0x42474c});
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = 60;
    ctx.canvas.height = 200;
    ctx.fillStyle = '#42474c';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.strokeRect(2, 2, 56, 196);
    ctx.translate(60 / 2, 200 / 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '24px serif';
    ctx.fillStyle = 'white';
    ctx.fillText(name, 0, 0);
    const texture = new THREE.CanvasTexture(ctx.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material_1 = new THREE.MeshBasicMaterial({
      map: texture,
    });

    const ctx_2 = document.createElement('canvas').getContext('2d');
    ctx_2.canvas.width = 60;
    ctx_2.canvas.height = 60;
    ctx_2.fillStyle = '#4e5052';
    ctx_2.fillRect(0, 0, ctx_2.canvas.width, ctx_2.canvas.height);
    ctx_2.lineWidth = 3;
    ctx_2.strokeStyle = '#42474c';
    ctx_2.strokeRect(0, 0, 60, 60);
    const texture_2 = new THREE.CanvasTexture(ctx_2.canvas);
    texture_2.minFilter = THREE.LinearFilter;
    texture_2.wrapS = THREE.ClampToEdgeWrapping;
    texture_2.wrapT = THREE.ClampToEdgeWrapping;

    const material_2 = new THREE.MeshBasicMaterial({
      map: texture_2,
    });

    const box = new THREE.Mesh(geometry, [material, material, material_2, material, material_1, material,]);
    box.position.set(x, 100, z)
    box.rotateY(rotateY)
    box.addEventListener( '3dclick', function ( event ) {
      let obj = event.obj
      console.log(obj)
      let ta = obj.position
      // controls.saveState ()
      obj.layers.set(1)
      layerszObj = obj
      console.log(camera)
      camera.layers.set(1)
      let b = new THREE.Vector3( 0, 0, 280);
      b.applyEuler(obj.rotation)
      b.add(ta)
      console.log(ta, obj.rotation, b)
      tweenManager.createTween(camera.position)
      .to(b, 500)
      .start();
      tweenManager.createTween(controls.target)
      .to(ta, 500)
      .start();
      // camera.position.copy(b)
      // controls.target.copy(ta)
      controls.update();
      
      requestRenderIfNotRequested()
    })
    scene.add(box)
  }
  // makeBox('A01',0,0,Math.PI * 0.5)
  for (var i = 0;i < 9; i++ ) {

    makeBox('A0'+(i+1) , 300, 240-i*60,Math.PI * 0.5)
    makeBox('B0'+(i+1) , 210, 240-i*60,Math.PI * -0.5)

    makeBox('C0'+(i+1) , 0, 240-i*60,Math.PI * 0.5)
    makeBox('D0'+(i+1) , -90, 240-i*60,Math.PI * -0.5)

    makeBox('E0'+(i+1) , -300, 240-i*60,Math.PI * 0.5)
    makeBox('F0'+(i+1) , -390, 240-i*60,Math.PI * -0.5)
  }

  // 是否需要调整视图
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // 按需刷新
  var renderRequested = false;
  function render() {
    renderRequested = undefined;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

      cameraOrtho.left = - canvas.clientWidth / 2;
      cameraOrtho.right = canvas.clientWidth / 2;
      cameraOrtho.top = canvas.clientHeight / 2;
      cameraOrtho.bottom = - canvas.clientHeight / 2;
      cameraOrtho.updateProjectionMatrix();
      updateHUDSprites()
    }

    if (tweenManager.update()) {
      requestRenderIfNotRequested();
    }

    controls.update();
    stats.update()

    renderer.clear();
    renderer.render( scene, camera );
    renderer.clearDepth();
    renderer.render( sceneOrtho, cameraOrtho );
  }
  render();

  function requestRenderIfNotRequested() {
    if (!renderRequested) {
      renderRequested = true;
      requestAnimationFrame(render);
    }
  }

  window.addEventListener('resize', requestRenderIfNotRequested);
  window.addEventListener('mouseout', requestRenderIfNotRequested)
  window.addEventListener('mouseleave', requestRenderIfNotRequested)
  controls.addEventListener('change', requestRenderIfNotRequested);
}

export default main

