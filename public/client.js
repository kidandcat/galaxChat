/*
* Author: Jairo Caro-Accino Viciana
* e-mail: kidandcat@gmail.com
*/
var socket = io.connect();
var user;
var EDITORLIMIT = 100000;	//Para evitar ataques de spam
document.getElementById('nameLogin').focus();
var editor = ace.edit("editor");
     editor.setTheme("ace/theme/tomorrow_night_blue");
     editor.getSession().setMode("ace/mode/java");

alertify.set({ delay : 100000000 });

function ready(){
	//communicate to the server that we want to join to $room with user name $user
	socket.emit('user', { user: $('#nameLogin').val(), room: $('#nameLogin2').val() });
};



socket.on('NewUserName', function (data) {
	//Server confirms our username and room, we can send msgs now
	document.getElementById('area').innerHTML = '';
	document.getElementById('target1').innerHTML = data.user;
	user = data.user;
	document.getElementById("sendallbutton").disabled=false;
	document.getElementById("hidder1").style["display"] = "none";
	document.getElementById("hidder2").style["display"] = "block";
	document.getElementById('send').focus();
	if(user == 'Jairo' || user == 'Maria'){
		document.getElementById('deleteName').style["display"] = "block";
		document.getElementById('deleteButton').style["display"] = "block";
	}
});


document.getElementById('deleteButton').addEventListener('click', function(e){
	socket.emit('delete',{filename: document.getElementById('deleteName').value});
});


socket.on('not', function(){
	alert("Wrong User/Pass");
});

socket.on('created', function(){
	alert("New user created");
});

socket.on('firstupdate', function(data){
	if(editor.getValue() != 'Core'){
		emit();
	}
});

socket.on('msg', function(data){
	//new message from server, append it to the text area#848484
	if(data.msg.substring(0,5) == "Vote:"){
		document.getElementById("theVote").innerHTML = data.msg.split(": ");	
		document.getElementById("yesButton").setAttribute("style", "display:inline");
		document.getElementById("noButton").setAttribute("style", "display:inline");
		document.getElementById('send').focus();
	}else if(data.msg.substring(0,14) == "Vote has ended" || data.msg.substring(0,13) ==  "Vote has been"){
		document.getElementById("yesButton").setAttribute("style", "display:none");
		document.getElementById("noButton").setAttribute("style", "display:none");
		document.getElementById("theVote").innerHTML = "";	
		document.getElementById('area').innerHTML = "<a style=\"color: #848484\">" + time() + "</a>" + " <a onclick=\"context(this)\" style=\"color:" + data.color + "\">" + data.user + "</a>" + ': ' + replaceURLWithHTMLLinks(check_emotes(escapeHtml(data.msg))) + "<br>" + document.getElementById('area').innerHTML;
	var lastMSG = data.user + ":  " + data.msg;
	notifyMe(lastMSG);
	document.getElementById('send').focus();
	}else{
	
	document.getElementById('area').innerHTML = "<a style=\"color: #848484\">" + time() + "</a>" + " <a onclick=\"context(this, event)\" style=\"color:" + data.color + "\">" + data.user + "</a>" + ': ' + replaceURLWithHTMLLinks(check_emotes(escapeHtml(data.msg))) + "<br>" + document.getElementById('area').innerHTML;
	var lastMSG = data.user + ":  " + data.msg;
	notifyMe(lastMSG);
	}
});




function replaceURLWithHTMLLinks(text) {
	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	return text.replace(exp, "<a href='$1' target='_blank'>$1</a>");
}

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

socket.on('update', function(data){
	if(data.data.length > EDITORLIMIT){}
	if(user != 'Profesor'){
		var cursorPoss = editor.getCursorPosition();
		editor.setValue(data.data, 1);
		editor.gotoLine(cursorPoss.row+1, cursorPoss.column);
	}
});

function emit(){
	var god = editor.getValue();
	socket.emit('update', {data: god})
}

socket.on('rooms', function(data){		
	//recibimos la lista de rooms y la dividimos usando el caracter /
	var rooms = data.msg.split('/');
	var index;
	document.getElementById('roomstab').innerHTML = '<a style=\"color: #01DF01\">Users:</a>';
	for(index=1; index < rooms.length; index++){	//escribimos la lista en el textarea con id 'roomstab'
		var txt = document.getElementById('roomstab').innerHTML;
		if(rooms[index] == "undefined")
			document.getElementById('roomstab').innerHTML = txt + "<br>" + "Guest";
		else
			document.getElementById('roomstab').innerHTML = txt + "<br>" + '<a onclick=\"context(this, event)\">' + rooms[index] + '</a>';
	}
});

socket.on('vote', function(){
	socket.emit('wannaVote');
});

function sendAll(){
	//default send function
	if($('#send').val() != ''){
			if($('#send').val().split('*')[0] == "/sendto"){
				document.getElementById('area').innerHTML = "<a style=\"color: #848484\">" + time() + "</a>" + " <a style=\"color: #F00\">Me: </a>" + replaceURLWithHTMLLinks(check_emotes(escapeHtml($('#send').val().split('*')[2]))) + "<br>" + document.getElementById('area').innerHTML;
				$('#privateListener').css('display', 'none');
				$('#gray').css('display', 'none');
			}else if($('#send').val().split(':')[0] == "/vote"){
				if($('#send').val().split(':')[1] == " yes"){
					socket.emit('voting', { msg: 'yes' });
					console.log('voted yes');
				}else if($('#send').val().split(':')[1] == " no"){
					socket.emit('voting', { msg: 'no' });
					console.log('voted no');
				}else if($('#send').val().split(':')[1] == " cancel"){
					socket.emit('cancelVote');
					console.log('vote canceled');
				}else{
					socket.emit('vote', { msg: $('#send').val().split(':')[1] });
					console.log('vote ' + $('#send').val().split(':')[1]);
				}
			}else{
				document.getElementById('area').innerHTML = "<a style=\"color: #848484\">" + time() + "</a>" + " <a style=\"color: #01DF01\">Me: </a>" + replaceURLWithHTMLLinks(check_emotes(escapeHtml($('#send').val()))) + "<br>" + document.getElementById('area').innerHTML;
				socket.emit('sendall', { msg: $('#send').val(), user: document.getElementById('nameLogin').innerHTML });
			}
			if($('#send').val() == "clear")
				document.getElementById('area').innerHTML = "";

			
	}
};

socket.on('disconnect', function(){
	//if connection with the server is lost
	alertify.error("Disconnected, please press F5 to reload the page.");
	$('#send').attr('disabled', 'disabled');
	alert("Disconnected!!!");
});

var timeout = setTimeout(function(){$('#writting').val("|")},1000);;

socket.on('writting', function(data){
	if(data.write == "true"){
		clearTimeout(timeout);
		document.getElementById('writting').innerHTML = "|";
		document.getElementById('writting').innerHTML = "|" + data.user + " esta escribiendo...";
		timeout = setTimeout(function(){document.getElementById('writting').innerHTML = "|";},1000);
	}else{
		clearTimeout(timeout);
		document.getElementById('writting').innerHTML = "|";
		document.getElementById('writting').innerHTML = "|" + data.user + " esta borrando...";
		timeout = setTimeout(function(){document.getElementById('writting').innerHTML = "|";},1000);
	}
});


document.getElementById("listener").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13) { sendAll();
		$('#send').val('');
	}
}, false);

document.getElementById("listener1").addEventListener("keydown", function(e) {
    // Enter is pressed
    if (e.keyCode == 13 && $('#nameLogin').val() != "") { 
		ready();
		$('#send').val('');
	}
}, false);

document.getElementById("listenerEditor").addEventListener("keydown", function(e) {
	setTimeout(function(){emit()}, 50);
}, false);


$(document).ready(function(){
   $("#uploadbutton").click(function(){
	var formData = new FormData($('form')[0]);
	$.ajax({
	   type: "POST",
	   url: "upload",
	   xhr: function(){
		var myXhr = $.ajaxSettings.xhr();
		if(myXhr.upload){
			myXhr.upload.addEventListener('progress',progressHandlingFunction,false);
		}
		return myXhr;
	   },
	   data: formData,
	   cache: false,
	   contentType: false,
	   processData: false
	});
     });
});

function progressHandlingFunction(e){
	if(e.lengthComputable){
		$('progress').attr({value:e.loaded,max:e.total});
	}
	if(e.loaded == e.total)
		setTimeout(function(){$('progress').attr({value:0,max:1})}, 2000);
}

document.getElementById("send").addEventListener("keydown", function(e) {
	setTimeout(function(){
		if(e.keyCode != 8)
			socket.emit('writting', { write: "true"});
		else
			socket.emit('writting', { write: "false"});
	}, 50);
}, false);


var contextTarget = '';
function context(target, e){
	document.getElementById("show").style.display = 'block';
	document.getElementById("show").style.left = mouseX(e) + "px";
        document.getElementById("show").style.top = mouseY(e) + "px";
	//console.log(mouseX(e) + "   " + mouseY(e));
	contextTarget = target;
}

function priv(){
	//$('#gray').css('display', 'block');
	$('#privateListener').css('display', 'block');
	$('#private').focus();
	$('#privateUser').val(contextTarget.text);
	document.getElementById("show").style.display = 'none';
}

function ban(){
	socket.emit('sendall', { msg: "/ban*" + contextTarget.text, user: document.getElementById('nameLogin').innerHTML });
	document.getElementById("show").style.display = 'none';
}


function mouseX(evt) {
    if (evt.pageX) {
        return evt.pageX;
    } else if (evt.clientX) {
       return evt.clientX + (document.documentElement.scrollLeft ?
           document.documentElement.scrollLeft :
           document.body.scrollLeft);
    } else {
        return null;
    }
}

function mouseY(evt) {
    if (evt.pageY) {
        return evt.pageY;
    } else if (evt.clientY) {
       return evt.clientY + (document.documentElement.scrollTop ?
       document.documentElement.scrollTop :
       document.body.scrollTop);
    } else {
        return null;
    }
}


function channel(room1){
	socket.emit('changeroom', {room: room1});
}

var notification;
function notifyMe(text) {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check if the user is okay to get some notification
  else if (Notification.permission === "granted" && !window.document.hasFocus()) {
    // If it's okay let's create a notification
    	try{
		notification.close();
	}catch(e){
	
	}
	notification = new Notification(text);
  }

  // Otherwise, we need to ask the user for permission
  // Note, Chrome does not implement the permission static property
  // So we have to check for NOT 'denied' instead of 'default'
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // Whatever the user answers, we make sure we store the information
      if (!('permission' in Notification)) {
        Notification.permission = permission;
      }

      // If the user is okay, let's create a notification
      if (permission === "granted" && !window.document.hasFocus()) {
        notification = new Notification("Notifications activated!!");
      }
    });
  }
 

  // At last, if the user already denied any notification, and you 
  // want to be respectful there is no need to bother them any more.
}



function openBackWindow(url,popName){
        var popupWindow = window.open(url,popName,'scrollbars=1,height=650,width=1050');
          if($.browser.msie){
            popupWindow.blur();
            window.focus();
        }else{
           blurPopunder();
        }
      };

    function blurPopunder() {
            var winBlankPopup = window.open("about:blank");
            if (winBlankPopup) {
                winBlankPopup.focus();
                winBlankPopup.close()
            }
    };

function replaceAll( text, busca, reemplaza ){
  //while (text.indexOf(busca) != -1)
      text = text.replace(busca,reemplaza);
  return text;
}

function time() {
		var time = new Date();
		return ((time.getHours() < 10)?"0":"") + time.getHours() +":"+ ((time.getMinutes() < 10)?"0":"") + time.getMinutes() +":"+ ((time.getSeconds() < 10)?"0":"") + time.getSeconds();
	}

function check_emotes(text){
	text = replaceAll(text, "o.o", "<img src=\"/images/emo/OpuntoO.png\" />");
	text = replaceAll(text, "-.-", "<img src=\"/images/emo/-punto-.png\" />");
	text = replaceAll(text, ";)", "<img src=\"/images/emo/puntoycoma_parentesis.png\" />");
	text = replaceAll(text, "O_O", "<img src=\"/images/emo/O_O.png\" />");
	text = replaceAll(text, "<3", "<img src=\"/images/emo/menorque_3.png\" />");
	text = replaceAll(text, "xD", "<img src=\"/images/emo/dospuntosD.png\" />");
	text = replaceAll(text, ":_d", "<img src=\"/images/emo/dospuntos_d.png\" />");
	text = replaceAll(text, ":'(", "<img src=\"/images/emo/dospuntos_comilla_parentesis.png\" />");
	text = replaceAll(text, ":@", "<img src=\"/images/emo/dospuntos_arroba.png\" />");
	text = replaceAll(text, "*-*", "<img src=\"/images/emo/asterico-asterisco.png\" />");
	text = replaceAll(text, ":P", "<img src=\"/images/emo/32(14).png\" />");
	text = replaceAll(text, ":p", "<img src=\"/images/emo/32(15).png\" />");
	text = replaceAll(text, ":)", "<img src=\"/images/emo/32(21).png\" />");
	text = replaceAll(text, ":|", "<img src=\"/images/emo/32(25).png\" />");
	text = replaceAll(text, "¬¬", "<img src=\"/images/emo/32(26).png\" />");
	text = replaceAll(text, ":D", "<img src=\"/images/emo/xd.png\" />");
	return text;
}


//****************************************************************************************************
//****************************************************************************************************

new Enjine.Application().Initialize(new Mario.LoadingState(), 320, 240);
