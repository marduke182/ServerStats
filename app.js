
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

var CookieSchema = new Schema({
    cookie: {
        type: String
    },
    created: {
        type: Date
    }
});

function validatePresenceOf(value) {
    return value && value.length;
}

var UserSchema = new Schema({
    name: {
        type: String, 
        index: {
            unique: true
        }
    },
    login: {
        type: String
    },
    hashed_password: {
        type: String
    },
    salt: {
        type: String
    },
    redmineKey: {
        type: String
    },
    img: {
        type: String
    },
    sessions: {
        type: [CookieSchema]
    }
});

UserSchema.virtual('id')
    .get(function() {
        return this._id.toHexString();
    });

UserSchema.virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

UserSchema.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
});

UserSchema.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
});

UserSchema.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

UserSchema.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
        next(new Error('Invalid password'));
    } else {
        next();
    }
});

var ProyectSchema = new Schema({
    name: {
        type: String
    },
    idRedmine: {
        type: String
    }
});

var ActivitySchema = new Schema({
    name: {
        type: String
    },
    idProyect: {
        type: String
    },
    idRedmine: {
        type: String
    }
});

var TimeSchema = new Schema({
    name: {
        type: String
    },        
    idProyect: {
        type: String
    },
    idActivity: {
        type: String
    }
});

mongoose.model('User', UserSchema);
mongoose.model('Proyect', ProyectSchema);
mongoose.model('Activity', ActivitySchema);
mongoose.model('Time', TimeSchema);


var serverDb = mongoose.createConnection("127.0.0.1","redmine", 27017, function(err) {
    if(err instanceof Error) {
        console.log("Ocurrio un error.");
    }
});


var User = serverDb.model('User');
var Proyect = serverDb.model('Proyect');
var Activity = serverDb.model('Activity');
var Time = serverDb.model('Time');
//
//var instance = new User();
//
//instance.name = "jesus";
//instance.password = "123456";
//
//instance.save(function(err) {
//    // 
//    if(err instanceof Error) {
//        console.log(error("Ocurrio un error."));
//    }
//});


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
    app.use(function(err, req, res, next){
      // if an error occurs Connect will pass it down
      // through these "error-handling" middleware
      // allowing you to respond however you like
      err.
        res.send("fuck my dick");
    })
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

function requireLogin(req, res, next) {
    if(req.session.user) {
        next();
      
    } else {
        res.redirect("/sessions/new?redir="+req.url);
    }
};

app.get('/', requireLogin, routes.index);

app.get('/sessions/new', function(req,res) {
    res.render('sessions/new', {
        redir: req.body.redir
    });

});



app.post('/sessions', function(req,res) {
    User.findOne({
        name: req.body.login
    }, function(err,user){
        
        if(err instanceof Error) {
            console.log("Ocurrio un error buscando el usuario");   
        } else if(user && user.authenticate(req.body.password)){
            
            
            req.session.user = true;
            res.redirect(req.body.redir || "/");

        } else {
            //            req.flash('error', 'Incorrect credentials');
            res.render('sessions/new', {
                redir: req.body.redir
            });
        //          res.redirect('/sessions/new');
        }

    });
});

app.use('/prueba',function(req,res) {
    console.log(req.body.user);
    res.send("asd");
});

app.use('/account/create', function(req, res) {
    
    if(req.method == "POST") {
        
    }

    res.render('sessions/new', {
        redir: req.body.redir
    });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log(notice("Express server listening on port " + app.get('port')));
});
