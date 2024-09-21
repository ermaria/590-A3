//jshint esnext:true
var keysdown = {};

// Event listener for when the user presses a key
window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }
  keysdown[event.key] = true;
  event.preventDefault();
}, true);

// Event listener for when the user releases a key
window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }
  keysdown[event.key] = false;
  event.preventDefault();
}, true);

var maxFps = 60;
var frameCount = 0;
window.onload = function () {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");

  var yspeed = 4;
  var coinInterval = 750;
  var stripeInterval = 500;
  var lastCoinTime = 0;
  var lastStripeTime = 0;

  var fps = 60;
  var framesThisSecond = 0;
  var lastFpsUpdate = 0;

  var lastFrameTimeMs = 0;
  var timeStep = 1000 / 60; // Fixed time step (60 updates per second)
  var delta = 0;
  var score = 0;
  var stripeCollision = false;
  var gameOver = false;
  var missedCoins = 0;
  
  
  var ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    fillColor: "red",
    strokeColor: "black",
    velocity_x: 0,
    velocity_y: 0,
    speed: 6, 
  };
  
  /*var control = {x:canvas.width/2, //the x location of the ball
						y:canvas.height/2, //the y location of the ball
						radius:10, //the radius of the ball
						fillColor:"red", //what color should the ball be
						strokeColor:"grey", //what color should the outline of the ball be
						velocity_x:.2, //how fast the ball will move in the x direction
						velocity_y:.1};*/

  class Coin {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = 0;
      this.radius = 14;
      this.color = "gold";
      this.isVisible = true;
      this.yspeed = yspeed;
    }

    move() {
      this.y += this.yspeed;
      if (this.y >= canvas.height) {
        this.isVisible = false;
        if(!gameOver){ 
          missedCoins++;
        }
      }
    }
  }
  

  class Stripe { //creates squares that the user can't hit
    constructor() {
      this.x = Math.random()*canvas.width;
      this.y = 0;
      this.width = 28;
      this.height = 28;
      this.color = "orange";
      this.isVisible = true;
      this.yspeed = yspeed;
    }

    move() {
      this.y += this.yspeed;
      if (this.y >= canvas.height) {
        this.isVisible = false;
      }
    }
  }

  var coins = [];
  var stripes = [];

  requestAnimationFrame(mainLoop);

  function mainLoop(timestamp) {
    
    if (timestamp > lastFpsUpdate + 1000) {
      fps = 0.25 * framesThisSecond + (1 - 0.25) * fps; // compute the new FPS
 
        lastFpsUpdate = timestamp;
        framesThisSecond = 0;
    }
    framesThisSecond++;

    delta += timestamp - lastFrameTimeMs;
    lastFrameTimeMs = timestamp;

    
    while (delta >= timeStep) {
      processInput();
      update(timeStep);
      delta -= timeStep;
      
    }
  var interpolation = delta / timeStep;
    
    draw(interpolation);

    requestAnimationFrame(mainLoop);
  }

  function processInput() {
    ball.velocity_x = 0;
    ball.velocity_y = 0;

    if (keysdown.ArrowLeft) {
      ball.velocity_x = -ball.speed;
    }
    if (keysdown.ArrowUp) {
      ball.velocity_y = -ball.speed;
    }
    if (keysdown.ArrowRight) {
      ball.velocity_x = ball.speed;
    }
    if (keysdown.ArrowDown) {
      ball.velocity_y = ball.speed;
    }
  }

  function update(timeStep) {
    
    /*control.x = control.x + control.velocity_x * timeStep;
				control.y = control.y + control.velocity_y * timeStep;
				
				if (control.x > canvas.width) {
					control.velocity_x = -control.velocity_x;
                    control.x = canvas.width;
				}
				
				if (control.x < 0) {
					control.velocity_x = -control.velocity_x;
                    control.x = 0;
				}
				
				if (control.y > canvas.height) {
					control.velocity_y = -control.velocity_y;
                    control.y = canvas.height;
				}
				
				if (control.y < 0) {
					control.velocity_y = - control.velocity_y;
                    control.y = 0;
				}
				
                if (frameCount < 100) {
                  console.log("ball.x: " + control.x);
                }*/
    //interpolate
    ball.previousX = ball.x;
    ball.previousY = ball.y;

    
    ball.x += ball.velocity_x * (timeStep/15); 
    ball.y += ball.velocity_y * (timeStep/15);

    if (ball.x > canvas.width) ball.x = canvas.width;
    if (ball.x < 0) ball.x = 0;
    if (ball.y > canvas.height) ball.y = canvas.height;
    if (ball.y < 0) ball.y = 0;

    if (Date.now() - lastCoinTime > coinInterval) {
      createCoin();
      lastCoinTime = Date.now();
    }

    if (Date.now() - lastStripeTime > stripeInterval) {
      createStripe();
      lastStripeTime = Date.now();
    }

    for (i = 0; i < coins.length; i++) {
      coin = coins[i];
      if (coin.isVisible) {
        coin.move();
        if (detectCoinCollision(ball, coin)) {
          if(!stripeCollision && !gameOver){
            coin.isVisible = false;
            score += 1;
          }
        }
      }
    }

    for (i = 0; i < stripes.length; i++) {
      stripe = stripes[i];
      if (stripe.isVisible) {
        stripe.move();
        if (detectStripeCollision(ball, stripe)) {
          //stripe.isVisible = false;
          stripeCollision = true;
          ball.speed = 0;
          if(stripeCollision && !gameOver){
            stripe.yspeed = 0;
            gameOver = true;
          }
        }
      }
    }
    
    if(missedCoins >= 10){
      gameOver = true;
      
    }

    coins = coins.filter((coin) => coin.isVisible);
    stripes = stripes.filter((stripe) => stripe.isVisible);
  }

  function createCoin() {
    coins.push(new Coin());
  }

  function createStripe() {
    stripes.push(new Stripe());
  }

  function detectCoinCollision(ball, coin) {
    var distanceX = ball.x - coin.x;
    var distanceY = ball.y - coin.y;
    var distance = Math.hypot(distanceX, distanceY);
    return distance < ball.radius + coin.radius;
  }
  
  function detectStripeCollision(ball, stripe) {
    var closestX = Math.max(stripe.x, Math.min(ball.x, stripe.x + stripe.width));
    var closestY = Math.max(stripe.y, Math.min(ball.y, stripe.y + stripe.height));
    var xdist = ball.x - closestX;
    var ydist = ball.y - closestY;
    var distance = Math.hypot(xdist, ydist);
    return distance < ball.radius;
  }

  function draw(interpolation) {
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = "#8ead94";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    var interpolatedX = ball.previousX + (ball.x - ball.previousX) * interpolation;
    var interpolatedY = ball.previousY + (ball.y - ball.previousY) * interpolation;


    for (let i = 0; i < coins.length; i++) {
      let coin = coins[i];
      if (coin.isVisible) {
	context.save();
	context.translate(coin.x, coin.y);
        context.beginPath();
        context.arc(0, 0, coin.radius, 0, 2 * Math.PI, false);
	context.restore();
        context.fillStyle = coin.color;
        context.fill();
      }
    }

    for (let i = 0; i < stripes.length; i++) {
      let stripe = stripes[i];
      if (stripe.isVisible) {
        context.beginPath();
        context.rect(stripe.x, stripe.y, stripe.width, stripe.height);
        context.fillStyle = "orange";
        context.fill();
      }
    }
    //context.fillText("FPS: " + fps, 10, 80);
    /*
    context.beginPath();
				//context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI, false);
				context.save();
				context.translate(control.x, control.y);
				context.arc(0, 0, control.radius, 0, 2 * Math.PI, false);
				context.fillStyle = control.fillColor;
				context.fill();
				context.lineWidth = 1;
				context.strokeStyle = control.strokeColor;
				context.stroke();
				context.restore();
    */

     context.save();
    context.translate(interpolatedX, interpolatedY);
    context.beginPath();
    context.arc(0, 0, ball.radius, 0, 2 * Math.PI, false);
    context.fillStyle = ball.fillColor;
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = ball.strokeColor;
    context.stroke();
    context.restore();
    context.font = "30px Arial"
    context.fillText("score: " + score, 10, 30);
 
    context.fillText("circles missed: " + missedCoins, 10, 80);
    
    if(stripeCollision || missedCoins >= 10){
      context.font = "bold 50px Arial"
      context.fillStyle = "orange";
      context.strokeStyle = "black";
      context.fillText("GAME OVER", 55,  canvas.height/2);
      context.strokeText("GAME OVER", 55, canvas.height/2);
      
    }
    
    
    //framesThisSecond++;
    frameCount++;
   /*if (frameCount < 100) {
                  console.log("frame: " + frameCount);
                }*/
  }
};
