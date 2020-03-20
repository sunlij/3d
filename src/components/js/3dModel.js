import * as THREE from 'three'

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
    steps: 1,
    depth: 5,
    bevelEnabled: false
  };
  const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  geometry.translate(-600, -400, -2.5)

  const material = new THREE.MeshPhongMaterial({color: 0xffffff});
  const floor = new THREE.Mesh(geometry, material);

  floor.rotation.x = Math.PI * -.5;
  floor.position.y = -2.5

  return floor
}

// 墙
const WallMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});
const WallGlassMaterial = new THREE.MeshBasicMaterial({
  color: 0XECF1F3,
  opacity: 0.5,
  transparent: true
});
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
    steps: 1,
    depth: depth,
    bevelEnabled: false
  };
  const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  geometry.translate(-length / 2, -width / 2, -depth /2)

  const material = WallMaterial
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
    steps: 1,
    depth: depth,
    bevelEnabled: false
  };
  const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  geometry.translate(-length / 2, -width / 2, -depth /2)

  const material = WallMaterial
  const wall = new THREE.Mesh(geometry, material);

  const w_geometry = new THREE.BoxGeometry(length - w_left - w_right , width - w_top - w_bottom, 5);
  var glass_material = WallGlassMaterial
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
    steps: 1,
    depth: depth,
    bevelEnabled: false
  };
  const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
  geometry.translate(-length / 2, -width / 2, -depth /2)

  const material = WallMaterial
  const wall = new THREE.Mesh(geometry, material);

  wall.position.y = width / 2

  return wall
}

// 门
function createDoor () {
  const doorGroup = new THREE.Group()
  // 门框 先省略
  // 创建 门
  const d_left_geometry = new THREE.BoxGeometry(98, 180, 4);
  d_left_geometry.translate( 48, 0, 0 )
  var glass_material = new THREE.MeshBasicMaterial({
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

  return doorGroup
}

// 电视屏幕
function createScreen(texture){
  const geometry = new THREE.BoxGeometry(160, 90, 3);

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

  return cube
}

// 机柜容量
const makeBoxCapacity = (function () {
  var line = null,
      materials = []
  
  return function (name, x = 0, z = 0, scale = 1, callback) {
    const group = new THREE.Group()
    if (!line) {
      const geometry = new THREE.BoxGeometry(60, 200, 60);
      var edges = new THREE.EdgesGeometry( geometry );
      line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) );
      group.add(line)
    } else {
      group.add(line.clone())
    }

    group.position.set(x, 100, z)
  
    if (callback) {
      group.addEventListener( '3dclick', callback)
    }

    if (materials.length < 1) {
      [0x4caf50, 0x009688, 0xffc107, 0xf44336].forEach(item => {
        materials.push(new THREE.MeshBasicMaterial({
          color: item,
          opacity: 0.8,
          transparent: true
        }))
      })
    }

    var material
    if (scale < 1) {
      return group
    } else if (scale < 50) {
      material = materials[0]
    } else if (scale < 100) {
      material = materials[1]
    } else if (scale < 150) {
      material = materials[2]
    } else {
      material = materials[3]
    }

    const box = new THREE.BoxGeometry(60, 1, 60);
    box.translate(0, 0.5, 0)
    box.scale(1, scale, 1)
    const mesh = new THREE.Mesh(box, material);
    mesh.position.set(0, -100, 0)
    group.add(mesh)

    return group
  }
})()

const makeCabinet = (function () {
  var cabinet = null,
      material = null,
      geometry_front = null
  return function (name) {
    var group = null
    const width = 60
    const height = 200
    const depth = 60
    const thickness = 5
    if (!cabinet) {
      cabinet = new THREE.Group()
      material = new THREE.MeshPhongMaterial({color: 0x42474c});

      const ctx_2 = document.createElement('canvas').getContext('2d');
      ctx_2.canvas.width = width;
      ctx_2.canvas.height = depth - thickness;
      ctx_2.fillStyle = '#4e5052';
      ctx_2.fillRect(0, 0, ctx_2.canvas.width, ctx_2.canvas.height);
      ctx_2.lineWidth = 3;
      ctx_2.strokeStyle = '#42474c';
      ctx_2.strokeRect(0, 0, width, depth - thickness);
      const texture_2 = new THREE.CanvasTexture(ctx_2.canvas);
      texture_2.minFilter = THREE.LinearFilter;
      texture_2.wrapS = THREE.ClampToEdgeWrapping;
      texture_2.wrapT = THREE.ClampToEdgeWrapping;

      const material_top = new THREE.MeshBasicMaterial({
        map: texture_2,
      });

      // 柜顶
      const geometry_top = new THREE.BoxGeometry(width, thickness, depth - thickness);
      const mesh_top = new THREE.Mesh(geometry_top, [material, material, material_top, material, material, material])
      mesh_top.position.set(0, height/2 - thickness/2, -thickness/2)
      cabinet.add(mesh_top)

      // 柜左
      const geometry_left = new THREE.BoxGeometry(thickness, height- thickness*2, depth - thickness*2);
      const mesh_left = new THREE.Mesh(geometry_left, material)
      mesh_left.position.set(- (width/2 - thickness/2), 0, 0)
      cabinet.add(mesh_left)

      // 柜右
      const geometry_right = new THREE.BoxGeometry(thickness, height- thickness*2, depth - thickness*2);
      const mesh_right = new THREE.Mesh(geometry_right, material)
      mesh_right.position.set(width/2 - thickness/2, 0, 0)
      cabinet.add(mesh_right)

      // 柜底
      const geometry_bottom = new THREE.BoxGeometry(width, thickness, depth - thickness);
      const mesh_bottom = new THREE.Mesh(geometry_bottom, material)
      mesh_bottom.position.set(0, -(height/2 - thickness/2), -thickness/2)
      cabinet.add(mesh_bottom)

      // 柜背
      const geometry_back = new THREE.BoxGeometry(width, height- thickness*2, thickness);
      const mesh_back = new THREE.Mesh(geometry_back, material)
      mesh_back.position.set(0, 0, -(depth/2 - thickness/2))
      cabinet.add(mesh_back)

      // 柜门
      geometry_front = new THREE.BoxGeometry(width, height, thickness);
      geometry_front.translate(-width / 2, 0, thickness/2)
    } 

    group = cabinet.clone()

    // 柜门纹理
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

    const material_front = new THREE.MeshBasicMaterial({
      map: texture,
    });

    // 柜门
    const mesh_front = new THREE.Mesh(geometry_front, [material, material, material, material, material_front, material_front])
    mesh_front.position.set(width / 2 , 0, depth/2 - thickness)
    mesh_front.name = 'cabinetDoor'
    group.add(mesh_front)

    return group
  }
})()

// 机柜内设备
const makeDevice = (function () {
  var mesh = null
  return function () {
    if (!mesh) {
      const geometry = new THREE.BoxGeometry(50, 20, 50);
      const material_front = new THREE.MeshPhongMaterial({color: 0x426730});
      const material = new THREE.MeshPhongMaterial({color: 0xccd1d1});
      mesh = new THREE.Mesh(geometry, [material, material, material, material, material_front, material])
      return mesh
    } else {
      return mesh.clone()
    }
  }
})()

const makeLine = (function () {
  var mesh = null
  return function () {
    if (!mesh) {
      var curve = new THREE.CurvePath()
      curve.add(new THREE.LineCurve3(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 0, 0, -10 ),
      ))
      curve.add(new THREE.LineCurve3(
        new THREE.Vector3( 0, 0, -10 ),
        new THREE.Vector3( 0, -100, -10 ),
      ))

      const tubularSegments = 100;
      const radius = .5;
      const radialSegments = 8;
      const closed = false;
      const geometry = new THREE.TubeBufferGeometry(curve, tubularSegments, radius, radialSegments, closed);
      
      var material = new THREE.MeshPhongMaterial( { color : 0x42474c } );
      
      // Create the final object to add to the scene
      mesh = new THREE.Mesh( geometry, material );
      mesh.position.set(0, 0, -30)
      return mesh
    } else {
      return mesh.clone()
    }
  }
})()

export { createFloor, createWall, createWall2, createWall3, createDoor, createScreen, makeCabinet, makeBoxCapacity, makeDevice, makeLine}