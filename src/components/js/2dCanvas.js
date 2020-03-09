import * as THREE from 'three'

const spriteName = {
	button: makeButton,
	dialog: makeDialog
}
const color = {
	default: '#000000',
	info: '#009688',
	success: '#4caf50',
	error: '#f44336',
	warning: '#ffc107'
}
function getColor(name = 'default'){
	if (color[name]) {
		return color[name]
	}
	return name
}
function makeSprite(name, option) {

	if (!name || !spriteName[name]) {
		return
	}

	const ctx = document.createElement('canvas').getContext('2d');
	const canvas = spriteName[name](ctx, option)
	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.x = canvas.width;
  sprite.scale.y = canvas.height;

  return sprite
}

function makeButton (ctx, option) {
	
	let text = option.text || '',
			fontSize = option.fontSize || 14,
			height = 32,
			width = option.width,
			color = getColor(option.color),
			margin = 5,
			radius = 5

	ctx.font = `${fontSize}px bold sans-serif`
	const textWidth = ctx.measureText(text).width
	ctx.canvas.width = width || Math.max( 64, textWidth + margin*2)
  ctx.canvas.height = height
  // need to set font again after resizing canvas
  ctx.font = `${fontSize}px bold sans-serif`
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
	ctx.strokeStyle = color
	ctx.lineWidth = 2
	ctx.globalAlpha = 0.8
	roundedRect(ctx, 2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4, radius)
	ctx.fillStyle = color
	ctx.globalAlpha = 0.1
	ctx.fill()
	ctx.globalAlpha = 1
	ctx.fillStyle = color
	ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.fillText(text, 0, 0);

  return ctx.canvas
}

function makeDialog (ctx, option) {
	let text = option.text || [],
			fontSize = option.fontSize || 14,
			color = getColor(option.color),
			margin = 10,
			radius = 5

	ctx.font = `${fontSize}px bold sans-serif`
	const textWidth = []
	text.forEach( t => {
		textWidth.push(ctx.measureText(t).width)
	});

	ctx.canvas.width = Math.max( 100, ...textWidth) + margin*2
	ctx.canvas.height = text.length * 30 + margin*2
	// need to set font again after resizing canvas
	ctx.font = `${fontSize}px bold sans-serif`
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.strokeStyle = color
	ctx.lineWidth = 2
	ctx.globalAlpha = 0.8
	roundedRect(ctx, 2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4, radius)
	ctx.fillStyle = color
	ctx.globalAlpha = 0.1
	ctx.fill()
	ctx.globalAlpha = 1
	ctx.fillStyle = color
	ctx.translate(ctx.canvas.width / 2, 0);

	text.forEach( (item, index) => {
		ctx.fillText(item, 0, 15 + margin + index * 30);
	});
	
	return ctx.canvas
}

function roundedRect(ctx,x,y,width,height,radius){
  ctx.beginPath();
  ctx.moveTo(x,y+radius);
  ctx.lineTo(x,y+height-radius);
  ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
  ctx.lineTo(x+width-radius,y+height);
  ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
  ctx.lineTo(x+width,y+radius);
  ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
  ctx.lineTo(x+radius,y);
  ctx.quadraticCurveTo(x,y,x,y+radius);
  ctx.stroke();
}

export { makeSprite }





