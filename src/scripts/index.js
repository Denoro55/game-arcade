const canvas = document.getElementById('myApp');
const ctx = canvas.getContext('2d');

const gameWidth = canvas.width;
const gameHeight = canvas.height;

const checkSize = 15;

const playerSpeedX = 6;
const gravity = 22;
const size = 30;
const jumpForce = 10;

const maps = [
  [
    "                      ",
    "                      ",
    "  x                x  ",
    "  x   o  @  o o    x  ",
    "  x        xxxxx   x  ",
    "  xxxxx            x  ",
    "      x            x  ",
    "      x  x         x  ",
    "      !    v       x  ",
    "      xxxxxxxx!!xxxx  ",
    "                      ",
    "                      ",
    "                      "
  ]
];

const objectsFromMap = {
	' ':  null,
	'x': 'wall',
  '!': 'lava'
}

const objectsColor = {
	null: 'transparent',
  'wall': 'white',
  'player': 'blue',
  'coin': 'yellow',
  'lava': 'red'
}

const actors = {
	'@': Player,
  'o': Coin,
  'v': Lava
}

function Player(pos) {
	this.pos = pos.plus(new Vector(0.2, 0.2));
  this.size = new Vector(0.6, 0.6);
  this.speed = new Vector(0, 0);
  this.color = 'blue';
  this.touched = false;
  this.touchedColor = 'red'
}

Player.prototype.act = function(step, level, keys) {
	this.moveX(step, level, keys);
  this.moveY(step, level, keys);
  
  const otherActor = level.actorAt(this);
  if (otherActor) {
  	otherActor.touched = true;
  	level.playerTouched(otherActor);
  }
}

Player.prototype.moveX = function(step, level, keys) {
	this.speed.x = 0;
  if (keys.left) this.speed.x -= playerSpeedX;
  if (keys.right) this.speed.x += playerSpeedX;
 	const motion = new Vector(this.speed.x * step, 0);
  const newPos = this.pos.plus(motion);
  const obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle.type) {
  	this.collides(level, obstacle);
  	level.playerTouched(obstacle.type);
    if (this.speed.x > 0) {
      this.pos.x = obstacle.pos.x - this.size.x;
    } else if (this.speed.x < 0) {
      this.pos.x = obstacle.pos.x + 1;
    }
  	this.speed.x = 0;
  } else {
  	this.pos = newPos;
  }
}

Player.prototype.moveY = function(step, level, keys) {
	this.speed.y += step * gravity;
  const motion = new Vector(0, this.speed.y * step);
  const newPos = this.pos.plus(motion);
  if (newPos.y + this.size.y > level.height - 1) {
  	level.status = 'lost';
  }
  const obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle.type) {
  	this.collides(level, obstacle);
  	level.playerTouched(obstacle.type);
    if (keys.up && this.speed.y > 0) {
    	this.speed.y = -jumpForce;
    } else {
    	if (this.speed.y > 0) {
      	this.pos.y = obstacle.pos.y - this.size.y;
      }
    	this.speed.y = 0;
    }
  } else {
  	this.pos = newPos;
  }
}

Player.prototype.collides = function(level, obstacle) {
	obstacle.actors.forEach(type => {
    if (type === 'lava') {
      level.status = 'lost';
    }
  });
}

function Lava(pos) {
	this.pos = pos;
  this.size = new Vector(1, 1);
  this.speed = new Vector(1.2, 0);
  this.color = 'red';
  this.touched = false;
  this.touchedColor = 'red'
}

Lava.prototype.type = 'lava'

Lava.prototype.act = function(step, level, keys) {
  const newPos = this.pos.plus(this.speed.times(step));
  const obstacle = level.obstacleAt(newPos, this.size);
  if (!obstacle.type) {
  	 this.pos = newPos;
  } else {
  	this.speed = this.speed.times(-1)
  }
}

function Coin(pos) {
	this.pos = this.basePos = pos.plus(new Vector(0.25, -0.25));
  this.size = new Vector(0.5, 0.5);
  this.speed = new Vector(0, 0);
  this.wobble = Math.random() * Math.PI * 2;
  this.color = 'yellow';
  this.touched = false;
  this.touchedColor = 'red'
}

Coin.prototype.type = 'coin';

Coin.prototype.act = function(step, level, keys) {
	this.wobble += step * 7;
  const wobblePos = Math.sin(this.wobble) * 0.1;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
}

function Vector(x, y) {
	this.x = x;
  this.y = y;
}

Vector.prototype.plus = function(other) {
	return new Vector(this.x + other.x, this.y + other.y);
}

Vector.prototype.times = function(factor) {
	return new Vector(this.x * factor, this.y * factor);
}

function DOMDisplay(level) {
	this.level = level;
  this.drawBackground();
}

const arrowCodes = {37: "left", 38: "up", 39: "right"};
const keys = trackKeys(arrowCodes);

function trackKeys(codes) {
	const pressed = {};
	const handler = (e) => {
  	if (codes.hasOwnProperty(e.keyCode)) {
    	const down = e.type === 'keydown'
    	pressed[codes[e.keyCode]] = down;
      e.preventDefault();
    }
  }
	addEventListener('keydown', handler);
  addEventListener('keyup', handler);
  return pressed;
}

DOMDisplay.prototype.drawBackground = function() {
	const ylen = this.level.grid.length;
  const xlen = this.level.grid[0].length;
  
  // check
  if (!this.level.status) {
  	ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(checkSize, checkSize);
    ctx.lineTo(checkSize * 2, checkSize * 2);
    ctx.moveTo(checkSize * 2, checkSize);
    ctx.lineTo(checkSize, checkSize * 2);
    ctx.stroke();
  } else if (this.level.status == 'win') {
    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = '#33f526';
    ctx.beginPath();
    ctx.moveTo(checkSize * 2, checkSize);
    ctx.lineTo(checkSize + 5, checkSize * 2 - 5);
    ctx.lineTo(checkSize , checkSize * 2 - 10);
    ctx.stroke();
  }
  
	for (let i = 0; i < ylen; i++) {
  	for (let n = 0; n < xlen; n++) {
    	const cellType = this.level.grid[i][n];
    	ctx.beginPath();
      ctx.lineWidth = "2";
      ctx.strokeStyle = objectsColor[cellType];
      ctx.rect(n * size, i * size, size, size);
      ctx.stroke();
  	}
  }
}

DOMDisplay.prototype.drawActors = function() {
	this.level.actors.forEach(actor => {
  	ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = actor.touched ? actor.touchedColor : actor.color;
    ctx.rect(actor.pos.x * size, actor.pos.y * size, actor.size.x * size, actor.size.y * size);
    ctx.stroke();
    
    actor.touched = false;
  })
}

DOMDisplay.prototype.drawCheck = function() {
  if (!this.level.status) {
  	ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(checkSize, checkSize);
    ctx.lineTo(checkSize * 2, checkSize * 2);
    ctx.moveTo(checkSize * 2, checkSize);
    ctx.lineTo(checkSize, checkSize * 2);
    ctx.stroke();
  } else if (this.level.status == 'win') {
    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = '#33f526';
    ctx.beginPath();
    ctx.moveTo(checkSize * 2, checkSize);
    ctx.lineTo(checkSize + 5, checkSize * 2 - 5);
    ctx.lineTo(checkSize , checkSize * 2 - 10);
    ctx.stroke();
  }
}

DOMDisplay.prototype.drawFrame = function() {
	ctx.clearRect(0, 0, gameWidth, gameHeight);
	this.drawActors();
  this.drawBackground();
  this.drawCheck();
  // this.scrollPlayerIntoView();
}

/* DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var margin = gameWidth / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
}; */

function Level(currentMap) {
	this.width = currentMap[0].length;
  this.height = currentMap.length;
	this.grid = [];
  this.actors = [];
  this.fail = false;
  
  for (let i = 0; i < this.height; i++) {
  	let gridLine = []
  	for (let n = 0; n < this.width; n++) {
    	const currentCell = currentMap[i][n];
			const Actor = actors[currentCell];
      if (Actor) {
      	this.actors.push(new Actor(new Vector(n, i)));
      }
    	objectType = objectsFromMap[currentCell] || null;
  		gridLine.push(objectType)
  	}
    this.grid.push(gridLine);
  }
  
  console.log(this.grid, this.actors);
}

Level.prototype.animate = function(step, arrows) {
	this.actors.forEach(actor => {
  	actor.act(step, this, arrows);
  });
}

Level.prototype.obstacleAt = function(pos, actorSize) {
	const startX = Math.floor(pos.x);
  const endX = Math.ceil(pos.x + actorSize.x);
  const startY = Math.floor(pos.y);
  const endY = Math.ceil(pos.y + actorSize.y);
  
  let result = {
  	actors: [],
    pos: {}
  };
  
  if (startX < 0 || endX > this.width || startY < 0 || startY > this.height)
    return "wall";
  
  for (let i = startY; i < endY; i++) {
    for (let n = startX; n < endX; n++) {
      const cellType = this.grid[i][n];
      if (cellType) {
      	result.actors.push(this.grid[i][n]);
        if (!result.type) {
          result.type = cellType;
          result.pos.x = n;
          result.pos.y = i;
        }
      }
    }
  }
  
  return result;
}

Level.prototype.actorAt = function(actor) {
	for (let i = 0; i < this.actors.length; i++) {
  	const other = this.actors[i];
  	if (other != actor &&
    	actor.pos.x + actor.size.x > other.pos.x &&
      actor.pos.x < other.size.x + other.pos.x &&
      actor.pos.y + actor.size.y > other.pos.y &&
      actor.pos.y < other.size.y + other.pos.y) {
    	return other;
    }
  }
}

Level.prototype.playerTouched = function(other) {
	if (other.type === 'coin') {
  	this.actors = this.actors.filter(actor => actor != other);
    if (!this.actors.some(actor => {
    	return actor.type === 'coin';
    })) {
    	this.status = 'win';
    }
  } else if (other.type === 'lava') {
  	this.status = 'lost'
  }
}

function runAnimation(frameFunc) {
	let lastTime = null;
	const frame = (time) => {
  	let stop = false;
  	if (lastTime != null) {
    	const timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
  	lastTime = time;
    if (!stop)
  		requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function runLevel(level, Display) {
	const display = new Display(level);
  runAnimation(function(step) {
  	display.drawFrame();
    level.animate(step, keys);
    if (level.status == 'lost') {
    	runGame(maps, Display);
      return false;
    }
  })
}

function runGame(maps, Display) {
	const startLevel = (levelIndex) => {
  	runLevel(new Level(maps[levelIndex]), Display);
  }
	startLevel(0)
}

runGame(maps, DOMDisplay)