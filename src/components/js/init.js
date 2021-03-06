import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'

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
    // this.raycaster.layers.set(camera.layers.mask)

    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      for ( var i = 0; i < intersectedObjects.length; i++ ) {
        if (intersectedObjects[i].object.layers.test(camera.layers)) {
          this.pickedObject = intersectedObjects[i].object;
          break;
        }
      }
      // this.pickedObject = intersectedObjects[0].object;
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
  const canvas = document.querySelector('#d');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true });
  renderer.autoClear = false; // To allow render overlay on top of another

  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 2500;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 800, 1000)

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#DEFEFF');

  const canvas_width = canvas.clientWidth;
  const canvas_height = canvas.clientHeight;
  var cameraOrtho, sceneOrtho;
  cameraOrtho = new THREE.OrthographicCamera( - canvas_width / 2, canvas_width / 2, canvas_height / 2, - canvas_height / 2, 1, 300 );
  cameraOrtho.position.z = 200;
  sceneOrtho = new THREE.Scene();

  const commonObj = {} 

  const tweenManager = new TweenManger();
  const pickHelper = new PickHelper()

  // 环境光
  var ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);
  ambientLight.layers.enable(1)
  // 平行光
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 0.5, 1).normalize();
  scene.add(directionalLight);
  directionalLight.layers.enable(1)
  // 平行光 - 补光
  var directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.2);
  directionalLight1.position.set(1, -0.5, -1).normalize();
  scene.add(directionalLight1);
  directionalLight1.layers.enable(1)
  // 平行光 2
  var directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-1, 0.5, -1).normalize();
  scene.add(directionalLight2);
  directionalLight2.layers.set(1)
  // 平行光2 - 补光
  var directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.1);
  directionalLight4.position.set(-1, -0.5, 1).normalize();
  scene.add(directionalLight4);
  directionalLight4.layers.enable(1)

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
  controls.saveState()

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

  class ClickEvent {
    constructor({originalTarget, currentTarget}) {
      this.type = 'click'
      this.cancelBubble = false
      this.cancelable = false
      this.originalTarget = originalTarget || null
      this.currentTarget = currentTarget || null
    }
    preventDefault() {
      this.cancelable = true
    }
    stopPropagation () {
      this.cancelBubble = true
    }
  }

  function dispatchAll(currentTarget, originalTarget) {
    if(currentTarget.parent) {
      currentTarget.parent.dispatchEvent( new ClickEvent({currentTarget: currentTarget.parent, originalTarget: originalTarget }))
      dispatchAll(currentTarget.parent, originalTarget)
    }
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

    if (pickedUIObject) {
      let uiClickEvent = new ClickEvent({currentTarget: pickedUIObject, originalTarget: pickedUIObject })
      pickedUIObject.dispatchEvent(uiClickEvent)
      if (!uiClickEvent.cancelBubble) {
        dispatchAll(pickedUIObject, pickedUIObject)
      }
      return
    }
    // if (!pickedObject || !camera.layers.test(pickedObject.layers)) {
    //   return
    // }
    if (pickedObject) {
      let clickEvent = new ClickEvent({currentTarget: pickedObject, originalTarget: pickedObject })
      pickedObject.dispatchEvent(clickEvent)
      if (!clickEvent.cancelBubble) {
        dispatchAll(pickedObject, pickedObject)
      }
    }
  })

  // UI
  var spriteTL, spriteTR, spriteBL, spriteBR, spriteC;
  function createHUDSprites() {

    // var width = 20;
    // var height = 20;

    spriteTL = new THREE.Group();
    // spriteTL.center.set( 0.0, 1.0 );
    // spriteTL.scale.set( width, height, 1 );
    spriteTL.name = 'spriteTL'
    sceneOrtho.add( spriteTL );

    spriteTR = new THREE.Group();
    // spriteTR.center.set( 1.0, 1.0 );
    // spriteTR.scale.set( width, height, 1 );
    spriteTR.name = 'spriteTR'
    sceneOrtho.add( spriteTR );
    
    spriteBL = new THREE.Group();
    // spriteBL.center.set( 0.0, 0.0 );
    // spriteBL.scale.set( width, height, 1 );
    spriteBL.name = 'spriteBL'
    sceneOrtho.add( spriteBL );

    spriteBR = new THREE.Group();
    // spriteBR.center.set( 1.0, 0.0 );
    // spriteBR.scale.set( width, height, 1 );
    spriteBR.name = 'spriteBR'
    sceneOrtho.add( spriteBR );

    spriteC = new THREE.Group();
    // spriteC.center.set( 0.5, 0.5 );
    // spriteC.scale.set( width, height, 1 );
    spriteC.name = 'spriteC'
    sceneOrtho.add( spriteC );

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
  createHUDSprites()


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

  const renderFunction = requestRenderIfNotRequested

  return {
    canvas,
    renderer,
    camera,
    scene,
    controls,
    cameraOrtho,
    sceneOrtho,
    renderFunction,
    tweenManager,
    commonObj
  }
}
export default main

