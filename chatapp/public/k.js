  var query=chat.find({});
  query.sort('-created').limit(5).exec(function(err,docs){
    if(err){
      throw err;
    }
    console.log(docs);
    socket.emit('loadold',docs);
  })


   var newmessage=new chat({msg:msg,nick:socket.nickname});
      newmessage.save(function(err){
        if(err){
          console.log(err);
        }
      io.sockets.emit('new-message',{msg: msg,nick: socket.nickname});

      });
      43.248