var ctx;
var firstDeath;
var innerRadius;
var outerRadius;
var dieCenter;
var explosionColor;
var timer;
var deathClockSet;
var myTank;
var enemyTank;
var bullets;
var enemyBullets;
var walls;

// Assigns a tank to enemy and player, and starts the game
function startGame(myName,myColor,enemyName,enemyColor) {
  firstDeath = true;
  innerRadius = 5;
  outerRadius = 10;
  deathClockSet = false;
  bullets = [];
  enemyBullets = [];
  walls = [];

  ctx = $('#canvas')[0].getContext('2d');
  var startVars = {'#11CF00': {coordinates: {x: canvas.width/4, y: canvas.height/2}, angle: 90*3.14159/180},
                   '#D711ED': {coordinates: {x: canvas.width*3/4, y: canvas.height/2}, angle: 270*3.14159/180}};
  myTank = new Tank(myName,myColor,startVars[myColor.main].coordinates, startVars[myColor.main].angle);
  enemyTank = new Tank(enemyName,enemyColor,startVars[enemyColor.main].coordinates, startVars[enemyColor.main].angle);
  // make walls
  var wallAnchors = [{x: 100, y: 100}];
  for (var i = 0; i < wallAnchors.length; i++) {
    var wall = new Wall(wallAnchors[i].x, wallAnchors[i].y, 20, 20);
    walls.push(wall);
  }
  timer = setInterval(function() { updateCanvas(myTank,enemyTank) },15);
}

function drawWalls() {
  console.log('hi');
  for (var i = 0; i < walls.length; i++) {
    ctx.save();
    ctx.translate(walls[i].anchor.x, walls[i].anchor.y);
    ctx.fillStyle = 'lime';
    ctx.fillRect(0,0,walls[i].width,walls[i].height);
    ctx.restore();
  }
}

// Re-draws the game based on updated info
function updateCanvas(myTank,enemyTank) {
  refreshCanvas();
  drawWalls();
  drawTank(enemyTank);
  drawTurret(enemyTank);
  drawTank(myTank);
  drawTurret(myTank);
  if (bullets.length > 0) drawBullets(bullets, myTank.color.main);
  if (enemyBullets.length > 0) drawBullets(enemyBullets, enemyTank.color.main);
  if (myTank.health <= 0 && firstDeath) {
    myTank.gameOver = -1;
    dieCenter = myTank.coordinates;
    explosionColor = myTank.color.explosion;
    socket.emit('iLost', {enemy: enemyTank.player, dieCenter: dieCenter, color: myTank.color});
    firstDeath = false;
  }
  if (!myTank.gameOver) {
    myTank.updateTank();
    updatePlayerBullets(bullets);
  }
  else {
    dieAnim(dieCenter,explosionColor);
  }
  socket.emit('canvasUpdate', {enemy: enemyTank.player, attributes: myTank.getAttributes()});
  socket.emit('updateBullets', {enemy: enemyTank.player, bullets: bullets});
}


// updates all the bullets are fired by the player
function updatePlayerBullets(bulletArray) {
  bulletArray.forEach(function(bullet) {
    bullet.move();
    var hitTank = detectPointCollisions(enemyTank.collisionPoints(),bullet.coordinates);
    var hitWall = false;
    for (var i = 0; i < walls.length; i++) {
      if (detectPointCollisions(walls[i].getCorners(),bullet.coordinates)) hitWall = true;
    }
    if (hitTank || hitWall || bullet.coordinates.x < 0 || bullet.coordinates.x > canvas.width || bullet.coordinates.y < 0 || bullet.coordinates.y > canvas.height) {
      bulletArray.splice(bulletArray.indexOf(bullet),1);
      bullet = null;
      if (hitTank) {
        socket.emit('takeDamage', {enemy: enemyTank.player, damage: 5});
      }
    }
  });
}

// Draws the tank
function drawTank(tank) {
  ctx.save();
  ctx.translate(tank.coordinates.x,tank.coordinates.y);
  ctx.rotate(tank.angle);
  var fillPercent = tank.health/100;
  var emptyWidth = tank.dimensions.width - fillPercent*tank.dimensions.width;
  var fullWidth = fillPercent*tank.dimensions.width;
  ctx.fillStyle = tank.color.main;
  ctx.strokeStyle = tank.color.main;
  // Draws an empty rectangle whose height indicates missing health
  ctx.strokeRect(tank.dimensions.width*(-0.5), tank.dimensions.height*(-0.5), emptyWidth, tank.dimensions.height);
  // Draws a full rectangle whose height indicates remaining health
  ctx.fillRect(tank.dimensions.width*(-0.5) + emptyWidth, tank.dimensions.height*(-0.5), fullWidth, tank.dimensions.height);
  drawArrow(tank);
  ctx.restore();
}

// Draws an arrow on the tank indicating the front of the tank
function drawArrow(tank) {
  ctx.beginPath();
  ctx.translate(0,0);
  ctx.moveTo(-13,0);
  ctx.lineTo(-5,-6);
  ctx.lineTo(-5,6);
  ctx.closePath();
  ctx.fillStyle = tank.color.extra;
  ctx.fill();
}

// Draws the turret on the tank
function drawTurret(tank) {
  ctx.save();
  ctx.translate(tank.coordinates.x,tank.coordinates.y);
  ctx.fillStyle = tank.color.extra;
  ctx.rotate(tank.turretAngle);
  ctx.fillRect(-3,0,6,-30);
  ctx.restore();
}

// Draws bullets
function drawBullets(bulletArray,color) {
  bulletArray.forEach(function(bullet) {
    ctx.beginPath();
    ctx.arc(bullet.coordinates.x, bullet.coordinates.y, 5, 0, 2*Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// Clears the canvas and re-draws the background
function refreshCanvas() {
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

// Creates the explosion triggered upon death
function dieAnim(dieCenter,explosionColor) {
  if (!deathClockSet) {
    deathClockSet = true;
    setTimeout(function() {
      clearInterval(timer);
      endMessage();
    },2000);
  }
  var grd = ctx.createRadialGradient(dieCenter.x, dieCenter.y, innerRadius, dieCenter.x, dieCenter.y, outerRadius);
  grd.addColorStop(0, explosionColor[0]);
  grd.addColorStop(0.5, explosionColor[1]);
  grd.addColorStop(1, explosionColor[2]);
  ctx.fillStyle = grd;
  ctx.beginPath()
  ctx.arc(dieCenter.x, dieCenter.y, outerRadius, 0, Math.PI*2, true);
  ctx.closePath()
  ctx.fill();
  innerRadius*=1.02;
  outerRadius*=1.03;
}
