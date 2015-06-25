/*
* Author: Jairo Caro-Accino Viciana
* e-mail: kidandcat@gmail.com
*/

var express = require('express');
var path = require('path');
var fs = require('fs');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');
var favicon = require('static-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var colors = require('colors');
var http = require('http');
var routes = require('./routes/index');
var session = require('express-session');
var users = require('./routes/users');
var index = serveIndex('public/uploaded/files', {'icons': true})
var serve = serveStatic('public/uploaded/files');
var evh = require('express-vhost');
var socketio = require('socket.io');
var sessionStore = require('sessionstore');
var cookie = require('cookie');

var app = express();
var httpsserver = http.createServer(app);

var allowCrossDomain = function(req, res, next){
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', '*');

	next();
}



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(allowCrossDomain);

// *************************************************************
// *************************************************************
app.use(evh.vhost(app.enabled('trust proxy')));

evh.register('isy.galax.be', require('/home/ftp/ISY/app.js'));
// *************************************************************
// *************************************************************
var COOKIE_SECRET = 'secret';
var COOKIE_NAME = 'sid';


var secureserver = httpsserver.listen(80);
app.use(cookieParser(COOKIE_SECRET));
app.use(session({
    name: COOKIE_NAME,
    store: sessionStore.createSessionStore(),
    secret: COOKIE_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: null
    }
}));
var galaxIO = socketio.listen(secureserver);


app.use('/files', serveIndex('public/uploaded/files', {'icons': true}))
app.use('/files', express.static(path.join(__dirname, 'public/uploaded/files')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//var server = app.listen(443);

//var io = require('./routes/socket').listen(server, console);
var io = require('./routes/socket').listen(galaxIO, console);
var io2 = require('/home/ftp/ISY/routes/socket').listen(galaxIO, console, cookieParser, session);
module.exports = app;
console.log('           SERVER  RUNNING'.magenta);
console.log('          developed by Asky'.rainbow);
