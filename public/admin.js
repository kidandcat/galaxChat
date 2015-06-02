/*
* Author: Jairo Caro-Accino Viciana
* e-mail: kidandcat@gmail.com
*/
var socket = io.connect('https://192.168.6.167', {secure: true});	//al admin se le restringe  el acceso desde cualquier ip que no sea 127.0.0.1

socket.on('disconnect', function(){
	//if connection with the server is lost
	$('#target1').text('Disconnected, please press F5 to reload the page.');
	$('#target1').css('color', 'red');
});

socket.on('systemmsg', function(data){
	document.getElementById('area').innerHTML = 'System: ' + data.msg + "<br>" + document.getElementById('area').innerHTML;
});

function checkfromroom(){
	socket.emit('system', { command: '/users', room: $('#send').val() });
};

function sendto(){
	socket.emit('system', { command: '/sendto', msg: $('#send').val() });
};

function sendall(){
	socket.emit('system', { command: '/sendall', msg: $('#send').val() });
};

socket.on('rooms', function(data){		
	//recibimos la lista de rooms y la dividimos usando el caracter /
	var rooms = data.msg.split('/');
	var index;
	document.getElementById('roomstab').innerHTML = 'Rooms:';
	for(index=1; index < rooms.length; index++){	//escribimos la lista en el textarea con id 'roomstab'
		var txt = document.getElementById('roomstab').innerHTML;
		document.getElementById('roomstab').innerHTML = txt + "<br>" + rooms[index];
	}
});

document.getElementById("listener").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) { sendAll();
		$('#send').val('');
	}
}, false);
