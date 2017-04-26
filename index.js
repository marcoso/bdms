//Node modules required
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketIO = require('socket.io');
var http = require('http');
var mongoose = require('mongoose');
var db = mongoose.connection;
var app = express();

db.on('error', console.error);

//Local modules required
var configs = require('./config');
var donorModel = require('./models/donor');

// parse application/x-www-form-urlencoded.
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json.
app.use(bodyParser.json());

//connecting to mongoDB
mongoose.connect('mongodb://'+configs.dbHost+'/'+configs.dbName);

//Serve client side code, folders, etc.
app.use('/dist',express.static('dist'));
app.use('/',express.static('client'));
app.use('/public',express.static('public'));

//Enable CORS on ExpressJS (Necessary to interact with sockets.io)
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Node server and SocketIO starts listening 
var server = http.createServer(app);
var io = socketIO.listen(server);

server.listen(configs.applicationPort, function () {
  console.log('App listening on port ' + configs.applicationPort + '!');
});

io.set("origins", "*:*");

//Event definition for when the connection is established with SocketIO, here we define also the events that can be emmited
io.on('connection', function (socket) {
  socket.on('getDonors', function(extent){     
    var xFilter;    
    var xMaxSign = Math.sign(extent.xmax);
    var xMinSign = Math.sign(extent.xmin);
    var yFilter;
    var yMaxSign = Math.sign(extent.ymax);
    var yMinSign = Math.sign(extent.ymin);
    
    // Filtering depending on the sign of the x coordinates
    if(xMaxSign > 0 && xMinSign > 0){
      xFilter = {$gt: extent.xmin, $lt: extent.xmax};
    
    }else if (xMaxSign < 0 && xMinSign < 0){
      xFilter = {$lt: extent.xmin, $gt: extent.xmax};
    }else if(xMaxSign > 0 && xMinSign < 0){
      xFilter = {$gt: extent.xmin, $lt: extent.xmax};
    }else if(xMaxSign < 0 && xMinSign > 0){
      xFilter = {$gt: extent.xmin, $lt: extent.xmax};
    }

    // Filtering depending on the sign of the y coordinates
    if(yMaxSign > 0 && yMinSign > 0){
      yFilter = {$gt: extent.ymin, $lt: extent.ymax};
    }else if (yMaxSign < 0 && yMinSign < 0){
      yFilter = {$lt: extent.ymin, $gt: extent.ymax};
    }else if(yMaxSign > 0 && yMinSign < 0){
      yFilter = {$gt: extent.ymin, $lt: extent.ymax};
    }else if(yMaxSign < 0 && yMinSign > 0){
      yFilter = {$lt: extent.ymin, $gt: extent.ymax};
    }

    donorModel.find({ 
        xCoordinate: xFilter,
        yCoordinate: yFilter
     }, function(err, dbDonors) {
        if (err){
          socket.emit('getDonorsFailed', 'Donors data could not be retrieved');
        }        
        if(dbDonors){
          socket.emit('donorsObtained', dbDonors);          
        } 	
      }); 
  });

  //Event: getDonor - Used to query the database for an existing Donor
  socket.on('getDonor', function (id) {              
      if(!id){        
        socket.emit('getDonorFailed', 'Donor could not be retrieved as an id was not supplied');
      }

      donorModel.findOne({_id:id}, function(err, dbDonor) {
        if (err){
          socket.emit('getDonorFailed', 'Donor data could not be retrieved');
        } 
        
        if(dbDonor){
          socket.emit('donorObtained', dbDonor);          
        } 	
      });     
  });  
  
  //Event: saveDonor - Used to save a new Donor
  socket.on('saveDonor', function (data) {                  
    var instance = new donorModel();    
    instance.firstName = data.firstname;
    instance.lastName = data.lastname;
    instance.contactNumber = data.contactnumber;
    instance.emailAddress = data.emailaddress;
    instance.bloodGroup = data.bloodgroup;
    instance.address = data.address;
    instance.ip =  socket.request.connection.remoteAddress;
    instance.xCoordinate = data.xcoordinate;
    instance.yCoordinate = data.ycoordinate;
    instance.locationWkid = data.locationWkid;    
        
    instance.save(function (err, product, numAffected) {      
      if(err){        
        socket.emit('donorSaveFailed', 'Donor could not be saved');    
      }else{        
        console.log('Donor has been saved to MongoDB with id: ' + product._id);      
        io.emit('donorSaved', product._id);            
      } 
    });
  });

  //Event: updateDonor - Used to update a Donor
  socket.on('updateDonor', function (data) {              
    donorModel.findById(data.id, function (err, donor) {
      if (err) io.emit('donorUpdateFailed', 'Donor could not be found to be updated, it seems it has removed ');
      
      donor.firstName = data.firstname;
      donor.lastName = data.lastname;
      donor.contactNumber = data.contactnumber;
      donor.emailAddress = data.emailaddress;
      donor.bloodGroup = data.bloodgroup;
      donor.address = data.address;
      donor.ip =  socket.request.connection.remoteAddress;
      donor.xCoordinate = data.xcoordinate;
      donor.yCoordinate = data.ycoordinate;
      donor.locationWkid = data.locationWkid;

      donor.save(function (err, updatedDonor) {
        if (err) {
          socket.emit('donorUpdateFailed', 'Donor could not be updated');  
        }else{
          console.log('Donor has been updated to MongoDB with id: ' + updatedDonor._id);      
          io.emit('donorUpdated', updatedDonor._id); 
        }        
      });
    });
  });  

  //Event: deleteDonor - Used to delete a Donor
  socket.on('deleteDonor', function (id) { 
    donorModel.remove({ _id: id }, function (err) {
      if (err) {
        socket.emit('donorRemoveFailed', 'Donor could not be removed');  
      }else{
        console.log('Donor has been removed from MongoDB with id: ' + id);      
        io.emit('donorRemoved', id); 
      }   
    });                 
  });
})

// // Catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // Error handlers

// // Development error handler, will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// // Production error handler so no stacktraces are leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });