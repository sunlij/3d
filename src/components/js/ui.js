import * as THREE from 'three'
import { makeSprite } from './2dCanvas.js'
import ClosePng from '../img/close.png';
import { commonTracker } from './resourceTracker.js'

function main ({
  // canvas,
  renderer,
  // camera,
  // scene,
  controls,
  // cameraOrtho,
  sceneOrtho,
  renderFunction,
  // tweenManager,
  commonObj
}, vueCom) {
  const textureLoader = new THREE.TextureLoader();

  let spriteTL = sceneOrtho.getObjectByName('spriteTL')
  let spriteTR = sceneOrtho.getObjectByName('spriteTR')
  let spriteBR = sceneOrtho.getObjectByName('spriteBR')
  // let spriteC = sceneOrtho.getObjectByName('spriteC')

  let button1 = makeSprite('button', {text: '刷新'})
  button1.center.set(0.0, 1.0)
  button1.position.set(10, -50, 1)
  button1.addEventListener( 'click', function ( event ) {
    console.log(event)
    vueCom.clearRenderer()
    window.location.reload()
  })
  let button2 = makeSprite('button', {text: 'DOM'})
  button2.center.set(0.0, 1.0)
  button2.position.set(10, -100, 1)
  button2.addEventListener( 'click', function ( event ) {
    console.log(event)
    vueCom.toggleHtml()
    // const labelContainerElem = document.querySelector('#labels');
    // const elem = document.createElement('div');
    // elem.textContent = 'HTML Elements';
    // labelContainerElem.appendChild(elem);

    // const tempV = new THREE.Vector3();
    // let cube = scene.getObjectByName('A05')
    // // get the position of the center of the cube
    // cube.updateWorldMatrix(true, false);
    // cube.getWorldPosition(tempV);
    // // get the normalized screen coordinate of that position
    // // x and y will be in the -1 to +1 range with x = -1 being
    // // on the left and y = -1 being on the bottom
    // tempV.project(camera);

    // // convert the normalized position to CSS coordinates
    // const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
    // const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

    // // move the elem to that position
    // elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
  })
  let button3 = makeSprite('button', {text: '容量'})
  button3.center.set(0.0, 1.0)
  button3.position.set(10, -150, 1)
  button3.addEventListener( 'click', function ( event ) {
    console.log(event)
    vueCom.showBoxCapacity()
  })

  let button4 = makeSprite('button', {text: 'info'})
  button4.center.set(0.0, 1.0)
  button4.position.set(10, -200, 1)
  button4.addEventListener( 'click', function ( event ) {
    console.log(event)
    console.log(renderer.info)
  })
  spriteTL.add(button1, button2, button3, button4)

  textureLoader.load( ClosePng, function (texture) {
    var material = new THREE.SpriteMaterial( { map: texture } );
    let sprite = new THREE.Sprite( material );
    // var width = material.map.image.width;
    // var height = material.map.image.height;
    var width = 20;
    var height = 20;
    sprite.center.set( 1.0, 1.0 );
    sprite.scale.set( width, height, 1 );
    spriteTR.add(sprite)

    let sprite1 = new THREE.Sprite( material );
    sprite1.center.set( 1.0, 0.0 );
    sprite1.scale.set( width, height, 1 );
    spriteBR.add(sprite1)

    sprite.addEventListener( 'click', function ( event ) {
      console.log(event)
      sceneOrtho.remove(sceneOrtho.getObjectByName('spriteC'))
      renderFunction()
    })

    sprite1.addEventListener( 'click', function ( event ) {
      console.log(event)
      if (commonObj.layerszObj) {
        commonObj.layerszObj.close()
        commonObj.layerszObj.clearDevice()
        commonObj.layerszObj.layers.disable(1)
        commonObj.layerszObj.traverse(function (child) {
          child.layers.disable(1)
        });
      }
      
      controls.object.layers.set(0)
      controls.reset()
      spriteTL.visible = true
      let dialog = spriteTR.getObjectByName('dialog')
      if (dialog) {
        commonTracker.deviceDetail.dispose()
        // spriteTR.remove(dialog)
        // dialog.material.dispose()
        // dialog.material.map.dispose()
      }
      
      renderFunction()
    })

  });
}

export default main