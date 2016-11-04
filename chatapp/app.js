var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var http = require('http');
var fs=require('fs');
var mysql=require('mysql');
var redis=require('redis');
var session = require('express-session');
var redisStore = require('connect-redis')(session);
var SessionStore = require('express-mysql-session');
var client  = redis.createClient();


var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'chat'
});

connection.connect(function(err){
  if(err){
    console.log(err);
  }else{
    console.log('success');
  }
});

mongoose.connect('mongodb://127.0.0.1:27017/loginapp');
var db = mongoose.connection;
var chatschema=mongoose.Schema({
    nick:String,
    msg:String,
    created:{type:Date,default:Date.now}
});
var chat=mongoose.model('message',chatschema);

var routes = require('./routes/index');
var users = require('./routes/users');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'ssshhhhh',
     store: new redisStore({ host: 'localhost', port: 6379, client: client,ttl :  260}),
    saveUninitialized: false,
    resave: false
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash

// Global Vars



app.use('/', routes);
app.use('/users', users);

// Set Port
app.set('port', (process.env.PORT || 3000));

var server=http.createServer(app).listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});


app.get('/chat',function(req,res){
  res.writeHead(200,{"Content-Type":"text/html"});
  fs.readFile('./public/chat.html','utf8',function(err,content){
    if(err){
      console.log(err);
    }else{
      res.end(content);
    }
  });
});

app.get('/360',function(req,res){
  res.writeHead(200,{"Content-Type":"text/html"});
  fs.readFile('./public/test.html','utf8',function(err,content){
    if(err){
      console.log(err);
    }else{
      res.end(content);
    }
  });
});




app.get('/success',function(req,res){
  res.writeHead(200,{"Content-Type":"text/html"});
  fs.readFile('./public/success.html','utf8',function(err,content){
    if(err){
      console.log(err);
    }else{
      res.end(content);
    }
    var query='SELECT * FROM admin';
  connection.query(query,function(err,row){
    if(err){
      console.log(err);
    }else{
      var i=row.length;
      console.log(i);
      for(var j=0;j<row.length;j++){
        console.log(row[j].fname);
      }
    }
  })
  });
});

app.post('/indexst',function(req,res){
  var fname=req.body.firstname;
  var lname=req.body.lastname;
  var email=req.body.email;
  var pass=req.body.password;
  var mon=req.body.month;
  var day=req.body.day;
  var year=req.body.year;
  var tim=req.body.registration_time;
  var query='INSERT INTO admin VALUES("","'+req.body.firstname+'","'+req.body.lastname+'","'+req.body.username+'","'+req.body.email+'","'+req.body.password+'","'+req.body.month+'","'+req.body.day+'","'+req.body.year+'","'+req.body.registration_time+'")';
  var msgc='INSERT INTO msc VALUES("","'+req.body.username+'","")';
  connection.query(msgc,function(err){
    if(err){
      console.log(err);
    }else{
      console.log('msc');
    }
  })
  connection.query(query,function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect('/chat');
    }
  })
  console.log(fname);
  console.log(lname);
});

//chat
var io=require('socket.io').listen(server);
var ss=require('socket.io-stream');

var users={};
var nickname;
io.sockets.on('connection',function(socket){
//query here
var loadquerr="SELECT cha.id,cha.nam,cha.msg,cha.tim,im.id,im.nam,im.imaged,im.tim FROM im LEFT OUTER JOIN cha USING (tim) UNION ALL SELECT cha.id,cha.nam,cha.msg,cha.tim,im.id,im.nam,im.imaged,im.tim FROM cha RIGHT OUTER JOIN im USING (nam)";
var loadquer="SELECT * FROM cha ORDER BY tim DESC";
connection.query(loadquer,function(err,rows,fields){
  if(err)
    console.log(err);
  console.log(fields);
  console.log(rows);
  socket.emit('loadold',rows);
})



socket.on('cuname',function(data,callback){
  var cquery="SELECT * FROM admin WHERE uname='"+data+"'";
  connection.query(cquery,function(err,row){
    if(row.length>0){
      console.log(err);
      callback(false);
    }else{
      callback(true);
    }
  })
})

    socket.on('newuser',function(data,dat,callback){
    
      var uch="SELECT * FROM admin WHERE uname='"+data+"' AND pass='"+dat+"'";
      connection.query(uch,function(err,row){
        if(row.length>0){
       callback(true);
        socket.nickname=data;
        users[socket.nickname]=socket;
      updatenicknames();
      socket.emit('user',{obj:socket.nickname});
     }else{
      callback(false);
     }
      })
      
     
          });

socket.on('user video', function (msg) {
        //Received an image: broadcast to all
        socket.broadcast.emit('user video', msg);
    });

socket.on('user image', function (msg) {
        //Received an image: broadcast to all
        socket.broadcast.emit('user image', msg);
    });



  socket.on('private-message',function(user,msg,callback){
    console.log(user);
    console.log(msg);
    for(i=0;i<user.length;i++){
    users[user[i]].emit('private',{msg:msg,nick:socket.nickname});
  }
  })
  socket.on('send-message',function(data,callback){
    var msg=data.trim();
    if(msg.substr(0,3)==='/w '){
      var msg=msg.substring(3);
      var ind=msg.indexOf(' '); 
      if(ind!==-1){
        var name=msg.substring(0,ind);
        var msg=msg.substring(ind+1);   

          users[name].emit('whisper',{msg: msg,nick:socket.nickname});

        if(name in users){
      console.log('whisper');
      console.log(name);
      console.log(data);
      console.log(msg);
    }else{
      callback('Error: Not a Valid User');
    }
    }else{
      callback('Error: Please Enter a Message');
    }
    }else{
      //save
      var dt = new Date();

      var savquer='INSERT INTO cha VALUES("","'+socket .nickname+'","'+msg+'","'+dt+'")';
      connection.query(savquer,function(err){
        if(err){
          console.log(err);
        }else{
          console.log('inserted');
        }
      })
      io.sockets.emit('new-message',{msg: msg,nick: socket.nickname});

  }
  });
 
socket.on('user image', function (msg) {
        socket.broadcast.emit('user image', socket.nickname, msg);
    });

  function updatenicknames(){
        io.sockets.emit('username',Object.keys(users));
    }

socket.on('newimg',function(data){
   var dt = new Date();

  var savimg='INSERT INTO im VALUES("","'+socket.nickname+'","'+data.obj+'","'+dt+'")';
  connection.query(savimg,function(err){
    if(err){
      console.log(err);
    }else{
      console.log('img inserted');
    }
  })
socket.broadcast.emit('chimg',{dat:data.obj,nam:socket.nickname});
socket.emit('chimg',{dat:data.obj,nam:socket.nickname});

})

socket.on('newvid',function(data){
socket.broadcast.emit('chvid',{dat:data.obj,nam:socket.nickname});
})


  socket.on('disconnect',function(data){
    if(!socket.nickname)
      return;
    delete users[socket.nickname];
        updatenicknames();
    });

  });

//chat