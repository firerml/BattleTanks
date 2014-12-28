var username;
var enemyid;

$(function() {

	// Make lobby appear
	$('#splashbutton').on('click', function() {
		$('#splashpage').hide();
		socket.emit('get users', "getting users");
		socket.emit('welcome message', "Welcome to the Super Battle Fun Time lobby chat. " +
			"Here you can see other users connected, send messages to each other, and challenge them to a battle!" +
			" Have fun!");
		$('#splashpage').hide();
		$('#lobby').show();
		$('#loginpage').show();
	});

	// Submit username to server with enter
	$('#login-input').keypress(function(event) {
		if(event.keyCode == 13) {
			username = $('#login-input').val();
			if (username == '') {
				alert('Please input a name');
			} else {
				var allUsersNames = $('.userscontainer').find('p');
				var copyName = false;
				if (allUsersNames.length > 0) {
					for (var i = 0; i < allUsersNames.length; i++) {
						if (allUsersNames.eq(i).text() === username) {
							alert("That username is taken!");
							copyName = true;
						}
					}
				}
				if (!copyName) {
					socket.emit('add user', username);
					$('#login-input').val('');
					$('#loginpage').hide();
				}
			}
		}
	});

	// Submit message to server when you press enter
	$('#messageinput').keypress(function(event) {
		if(event.keyCode == 13) {
			var message = $('#messageinput').val();
			if (message == '') {
				alert('Please input a message');
			} else {
				socket.emit('send message', {name: username, message: message});
				$('#messageinput').val('');
			}
		}
	});

	// Sends a challenge when you press the challenge button
	$('body').on('click', '.challenge-button', function() {
	  enemyid = $(this).parent().attr('socketid');
	  socket.emit('send challenge', {enemy: enemyid, player: socket.io.engine.id});
	});

		var greens = {main: '#11CF00', extra: '#D711ED', explosion: ['lime','#2BB31E','#1C8212']}
		var purples = {main: '#D711ED', extra: '#11CF00', explosion: ['#D711ED','#AC0DBD','#6B0876']}
	// Starts a game when you accept the challenge by clicking on the challenge message
	$('body').on('click', '.challenge-message', function(event) {
		var enId = $(this).attr('invitation-id');
		socket.emit('commence game',{enemy: enId, enemyColor: greens, player: socket.io.engine.id, playerColor: purples});
	});

	// Sends a rematch message to the enemy when the rematch button is clicked
	$('body').on('click', '#rematch', function(event) {
		$('#rematch').remove();
		$('#return-to-lobby').remove();
		$('#end-message').text('Rematch request sent! Awaiting a response...');
		socket.emit('rematch', {enemy: enemyTank.player, player: username});
	});

	$('body').on('click', '#accept', function(event) {
		socket.emit('commence game',{enemy: enemyTank.player, enemyColor: greens, player: socket.io.engine.id, playerColor: purples});
	});

	// Moves turret based on mouse movement
	$('canvas').mousemove(function(event) {
		if (!myTank.gameOver) {
			myTank.moveTurret(event.pageX,event.pageY);
		}
	});

	// Fires a bullet during game on click
	$('body').on('click','#canvas', function() {
		if (!myTank.gameOver) {
			myTank.createBullet()
		}
	});

	// Move tank when buttons are pressed
	$('body').on('keydown', function(event) {
    // event.preventDefault();
    if (myTank && !myTank.gameOver) {
      if (event.keyCode === 38 || event.keyCode === 87) myTank.upPressed = true;
      if (event.keyCode === 39 || event.keyCode === 68) myTank.rightPressed = true;
      if (event.keyCode === 37 || event.keyCode === 65) myTank.leftPressed = true;
      if (event.keyCode === 40 || event.keyCode === 83) myTank.downPressed = true;
    }
  });

  // Stop moving tank when buttons are not pressed
  $('body').on('keyup', function(event) {
    if (myTank && !myTank.gameOver) {
      if (event.keyCode === 38 || event.keyCode === 87) myTank.upPressed = false;
      if (event.keyCode === 39 || event.keyCode === 68) myTank.rightPressed = false;
      if (event.keyCode === 37 || event.keyCode === 65) myTank.leftPressed = false;
      if (event.keyCode === 40 || event.keyCode === 83) myTank.downPressed = false;
    }
  });
});
