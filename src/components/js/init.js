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

// 资源追踪
class ResourceTracker {
  constructor() {
    this.resources = new Set();
  }
  track(resource) {
    if (!resource) {
      return resource;
    }

    // handle children and when material is an array of materials or
    // uniform is array of textures
    if (Array.isArray(resource)) {
      resource.forEach(resource => this.track(resource));
      return resource;
    }

    if (resource.dispose || resource instanceof THREE.Object3D) {
      this.resources.add(resource);
    }
    if (resource instanceof THREE.Object3D) {
      this.track(resource.geometry);
      this.track(resource.material);
      this.track(resource.children);
    } else if (resource instanceof THREE.Material) {
      // We have to check if there are any textures on the material
      for (const value of Object.values(resource)) {
        if (value instanceof THREE.Texture) {
          this.track(value);
        }
      }
      // We also have to check if any uniforms reference textures or arrays of textures
      if (resource.uniforms) {
        for (const value of Object.values(resource.uniforms)) {
          if (value) {
            const uniformValue = value.value;
            if (uniformValue instanceof THREE.Texture ||
                Array.isArray(uniformValue)) {
              this.track(uniformValue);
            }
          }
        }
      }
    }
    return resource;
  }
  untrack(resource) {
    this.resources.delete(resource);
  }
  dispose() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      }
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}

function main () {
  // canvas, renderer, camera, scene
  const canvas = document.querySelector('#d');
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

  const commonObj = {} 

  const tweenManager = new TweenManger();
  const pickHelper = new PickHelper()
  const resourceTracker = new ResourceTracker();

  // 环境光
  var ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);
  ambientLight.layers.enable(1)
  // 平行光
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);
  directionalLight.layers.enable(1)
  // 平行光 2
  // var directionalLight2 = new THREE.DirectionalLight(0xffffff);
  // directionalLight2.position.set(-1, 0.75, 0.5).normalize();
  // scene.add(directionalLight2);
  // directionalLight2.layers.set(1)

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
    // if (!pickedObject || !camera.layers.test(pickedObject.layers)) {
    //   return
    // }
    if (pickedObject) {
      pickedObject.dispatchEvent( { type: '3dclick', obj: pickedObject, pickedObject: pickedObject })
      dispatchAll(pickedObject, pickedObject)
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
    commonObj,
    resourceTracker
  }
}
export default main

