/*
* Author: Jairo Caro-Accino Viciana
* e-mail: kidandcat@gmail.com
*/

var socketio = require('socket.io');
var colors = require('colors');
var fs = require('fs');
var rimraf = require('rimraf');

function trim (myString){
	return myString.replace(/^\s+/g,'').replace(/\s+$/g,'');
}

module.exports.listen = function (app, console){
	var list = [];
	var voteMSG = '';
	var randomAdmin = '';
	var voting = "false";
	var Nvotes = 0;
	var itime = null;
	var Yvotes = 0;
	var votePeople = 0;
	var LineByLineReader = require('line-by-line');
	//listen express app
	io = socketio.listen(app).of('/chat');
	//set log mode to normal, if not it is default set in debug mode
	//io.set('log level', 1);
	function time() {
		var time = new Date();
		return ((time.getHours() < 10)?"0":"") + time.getHours() +":"+ ((time.getMinutes() < 10)?"0":"") + time.getMinutes() +":"+ ((time.getSeconds() < 10)?"0":"") + time.getSeconds();
	}





	io.on('connection', function(socket){
		//new client connection
		console.log(time().grey + '   Socket connected from IP: '.cyan + socket.request.connection.remoteAddress)

		//check user and room and join the user to the room, forcing him to leave the last room before it and send confirmation msg
		socket.on('user', function(data){
			if(data.room == '' || data.user == ''){}
			else{
			console.log(time().grey + '   ***  User: '.green + data.user + '  |  Room: '.green + data.room + '  |  IP: '.green + socket.request.connection.remoteAddress + '  ***'.green)

			var ip = socket.request.connection.remoteAddress;
			socket.user = data.user;
			socket.room = data.room;
			//*********

			socket.join(socket.room);
			socket.emit('NewUserName', { user: socket.user, room: socket.room })
			socket.broadcast.to(socket.room).emit('msg', { msg: 'User ' + socket.user + ' connected' , user: 'SyStem' , color: 'orange'});
			socket.broadcast.to(socket.room).emit('firstupdate', {data: 'nothing'});

		}})


		socket.on('delete',function(data){
			if(data.filename != ""){
				rimraf('./public/uploaded/files/' + data.filename, function(err){
					if(err){console.log(err);}
					console.log('Deleted: ' + data.filename);
				});
			}
		});

		socket.on('list', function(){
			list.forEach(function(item){
				socket.emit('append', { metadata: { name: item.name, connected: 1 }, url: 'http://'+item.url, route: 1});
				console.log('append: ' + item.url);
			});
			console.log("appended");
			//list.push(filter);
		});

		socket.on('newServer', function(item){
			list.push(item);
			console.log("new server: " + item.url);
		});


		socket.on('changeroom', function(data){
			socket.leave(socket.room);
			if(data.room === 'undefined'){
				socket.join("main");
				socket.room = "main";
			}else{
				socket.join(data.room);
				socket.room = data.room;
			}
		});


		socket.on('wannaVote', function(){
			socket.canVote = true;
			votePeople++;
		});


		socket.on('voting', function(data){
			if(socket.canVote){
				votePeople--;
				if(data.msg == 'yes')
					Yvotes++;
				else if(data.msg == 'no')
					Nvotes++;
				socket.canVote = false;
				socket.broadcast.to(socket.room).emit('msg', { msg: socket.user + ' has voted.', user: 'SyStem' , color: 'orange'});
				socket.emit('msg', { msg: socket.user + ' has voted.' , user: 'SyStem' , color: 'orange'});
				if(votePeople < 1){
					socket.broadcast.to(socket.room).emit('msg', { msg: 'Vote has ended with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					socket.emit('msg', { msg: 'Vote has ended with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					voting = "false";
					clearTimeout(itime);
					Nvotes = 0;
					Yvotes = 0;
					votePeople = 0;
					console.log(voteMSG);
					console.log(voteMSG.split(" ")[0]);
					if(voteMSG.split(" ")[1] == 'kick'){
						for(index = 0; index < io.clients().length; index++)
						if(voteMSG.split(" ")[2] == io.sockets[io.clients()[index].id].user)
							io.socket(io.clients()[index].id).disconnect();
					}

				}
			}
		});


		socket.on('vote', function(data){
			if(voting == "true"){
				socket.emit('msg', { msg: 'Voting still in process...' , user: 'SyStem' , color: 'orange'});
			}else{
				voting = "true";
				socket.broadcast.to(socket.room).emit('msg', { msg: 'Vote: ' + data.msg , user: 'SyStem' , color: 'orange'});
				socket.emit('msg', { msg: 'Vote: ' + data.msg , user: 'SyStem' , color: 'orange'});
				socket.broadcast.emit('vote');
				socket.emit('vote');
				voteMSG = data.msg;
				itime = setTimeout(function(){
					if(votePeople < 1){
					socket.broadcast.to(socket.room).emit('msg', { msg: 'Vote has ended with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					socket.emit('msg', { msg: 'Vote has ended with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					voting = "false";
					Nvotes = 0;
					Yvotes = 0;
					votePeople = 0;
					console.log(voteMSG);
					console.log(voteMSG.split(" ")[0]);
					if(voteMSG.split(" ")[1] == 'kick'){
						for(index = 0; index < io.sockets.clients().length; index++)
						if(voteMSG.split(" ")[2] == io.sockets.sockets[io.sockets.clients()[index].id].user)
							io.sockets.socket(io.sockets.clients()[index].id).disconnect();
					}

				}
				}, 20000);
			}
		});


		//New msg, we retransmit it to the room users except to the user who sent it
		socket.on('sendall', function(data){

			var dat = data.msg.split('*');
			if(dat[0] == "/ban" && (socket.user == '@TheBlueKing')){
				for(index = 0; index < io.sockets.clients().length; index++)
						if(dat[1] == io.sockets.sockets[io.sockets.clients()[index].id].user && (dat[1] != 'Jairo'))
							io.sockets.socket(io.sockets.clients()[index].id).disconnect();
			}else
			if(dat[0] == '/sendto'){
					//***Se distinguen entre mayusculas y minusculas en el nombre de usuario***
					for(index = 0; index < io.sockets.clients().length; index++)
						if(dat[1] == io.sockets.sockets[io.sockets.clients()[index].id].user){
							io.sockets.socket(io.sockets.clients()[index].id).emit('msg', {msg: dat[2] , user: socket.user , color: 'red'});
					}
			}else
			if(data.msg != '') //do not send it if its an empty msg
				socket.broadcast.to(socket.room).emit('msg', { msg: data.msg, user: socket.user , color: socket.color});

		})



		socket.on('writting', function(data){
			socket.broadcast.to(socket.room).emit('writting', {user: socket.user, write: data.write});
		});

		socket.on('cancelVote', function(){
			if(socket.user == 'Jairo' || socket.user == "Maria" || socket.user == randomAdmin){
					socket.broadcast.to(socket.room).emit('msg', { msg: 'Vote has been canceled with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					socket.emit('msg', { msg: 'Vote has been canceled with ' + Yvotes + ' \'Yes\' votes and ' + Nvotes + ' \'No\' votes' , user: 'SyStem' , color: 'orange'});
					voting = "false";
					Nvotes = 0;
					Yvotes = 0;
					votePeople = 0;
			}
		})


		socket.on('update', function(data){
			editorData = data.data;
			socket.broadcast.to(socket.room).emit('update', {data: editorData});
		});

		socket.on('disconnect', function(){
			list.pop(socket.filter);
			if(!(typeof socket.user === 'undefined')){
				socket.broadcast.to(socket.room).emit('msg', { msg: 'User ' + socket.user + ' disconnected' , user: 'SyStem' , color: 'orange'});
				console.log(time().grey + '   User '.green + socket.user + ' disconnected'.green);
			}else{
				console.log(time().grey + '   Socket '.cyan + socket.request.connection.remoteAddress + ' disconnected'.cyan);
			}
			socket.user = "";
			if(socket.canVote)
				votePeople--;
		})
	})



	//read users
/*function regUser(user, password, socket){
    	lr = new LineByLineReader('routes/users.txt');
	var done = 'no';

	lr.on('error', function (err) {
	    console.log(time().grey + '   Error reading file¡! '.red + err);
	});

	lr.on('line', function (line) {
		var words = line.split(" ");
		if(words[0] == user.split(" ")[0]){
			console.log("user: " + user + " pass: " + password);
			console.log("Password in text: " + words[1]);
			if(words[1] == password){
				socket.user = user;
				socket.room = "main";
				socket.color = '#00BFFF';
				socket.join(socket.room);
				socket.emit('NewUserName', { user: socket.user, room: socket.room })
				socket.broadcast.to(socket.room).emit('msg', { msg: 'User ' + socket.user + ' connected' , user: 'SyStem' , color: 'orange'});
				socket.broadcast.emit('firstupdate', {data: 'nothing'});
				done = 'yes';
			}else{
				socket.emit('not');
				done = 'yes';
			}
		}
	});

	lr.on('end', function () {
		if(done == 'no'){
			fs.appendFile("routes/users.txt", user.split(" ")[0] + " " + password + "\n", function(err) {
			    if(err) {
				console.log(err);
			    } else {
				socket.emit('created');
			    }
			});
		}
	});
}*/



	//el interval debe estar fuera de sockets.on('connection') sino se ejecutara un interval por cada nueva conexion
	setInterval(function(){		//creamos un interval que ejecute la funcion cada X segundos
			//try{
				for (var rom in io.adapter.rooms){
					var list = '';
					for (var socketID in io.adapter.rooms[rom])
						list = list + "/" + io.connected[socketID].user;

					io.in(rom).emit('rooms', {msg: list});
				}
			/*}catch(e){
				console.log(e);
			}*/
		}, 5000);				// 5 segundos

	return io
}
