
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, http = require('http')
, mongoose = require('mongoose')
, request= require('request')
var clc = require('cli-color');
var ejs = require('ejs');
var crypto = require('crypto');


ejs.open = '{{';
ejs.close = '}}';

var error = clc.red.bold;
var warn = clc.yellow;
var notice = clc.blue.bold;

var Schema = mongoose.Schema
, ObjectId = Schema.ObjectId;



var StatsSchema = new Schema({
    heartRate: {
        type: Array
    },
    temp: {
        type: Array
    },
    date: {
        type: Date
    }
});

mongoose.model('Stats', StatsSchema);



var serverDb = mongoose.createConnection("127.0.0.1","stats", 27017, function(err) {
    if(err instanceof Error) {
        console.log("Ocurrio un error.");
    }
});


var Stats = serverDb.model('Stats');



var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    //    app.use(express.cookieDecoder());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
//    app.use(function(err, req, res, next){
//
//        
//        res.send("fuck my dick");
//    })
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

function onlyApllicationJson(req, res, next) {
    if(req.is('application/json')) {
        next();
      
    } else {
        res.send({
            msg:"Content Type Ivalido", 
            code: "invalid_conten_type"
        });
    }
};

app.post('/hr',onlyApllicationJson,function(req,res) {
    estadisticas = req.body;
    console.log(estadisticas);

    if(estadisticas == undefined)
        res.send({
            msg:"Datos invalidos", 
            code: "invalid_data_error"
        });
    retorno = {
        msg: "prueba", 
        code: "OK"
    };
    var instance = new Stats();


    instance.heartRate = estadisticas;
    instance.temp = [];
    instance.date = Date.now();

    instance.save(function(err) {
        if(err instanceof Error) {
            console.log(error("Ocurrio un error."));
            res.send({
                msg:"Cannot save in database", 
                code: "database_error"
            });
        } else {
            res.send(retorno);
        }
    });
});

app.post('/temp',onlyApllicationJson,function(req,res) {
    console.log(req.body);
    
    estadisticas = req.body;
    if(estadisticas == undefined)
        res.send({
            msg:"Datos invalidos", 
            code: "invalid_data_error"
        });
    retorno = {
        msg: "prueba", 
        code: "OK"
    };
    var instance = new Stats();


    instance.heartRate = [];
    instance.temp = estadisticas;
    instance.date = Date.now();

    instance.save(function(err) {
        if(err instanceof Error) {
            console.log(error("Ocurrio un error."));
            res.send({
                msg:"Cannot save in database", 
                code: "database_error"
            });
        } else {
            res.send(retorno);
        }
    });
    
    
});

app.post('/all',onlyApllicationJson,function(req,res) {
    console.log(req.body);
    
    estadisticas = req.body;
    console.log(estadisticas);
    if(estadisticas == undefined || estadisticas.temp == undefined || estadisticas.temp == undefined )
        res.send({
            msg:"Datos invalidos", 
            code: "invalid_data_error"
        });

    
    retorno = {
        msg: "prueba", 
        code: "OK"
    };
    var instance = new Stats();


    instance.heartRate = estadisticas.hr;
    instance.temp = estadisticas.tmp;
    instance.date = Date.now();

    instance.save(function(err) {
        if(err instanceof Error) {
            console.log(error("Ocurrio un error."));
            res.send({
                msg:"Cannot save in database", 
                code: "database_error"
            });
        } else {
            res.send(retorno);
        }
    });
    
    
});

http.createServer(app).listen(app.get('port'), function(){
    console.log(notice("Express server listening on port " + app.get('port')));
});
