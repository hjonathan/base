var md5 = require('MD5');
module.exports = function(app, mongodb,io) {
	var message={
	         "connected" : "[{ip}] has connected",
	         "disconnected" : "[{ip}] has disconnected",
	         "create" : "[{ip}] added new user {msg}",
	         "update" : "[{ip}] update user {msg}",
	         "delete" : "[{ip}] delete new user {msg}",
	         "search" : "[{ip}] perform search with filter {msg}"         
	    },
	    tableUser = "Users",
		tableBoard = "Board",
		obj = {}, 
        type, 
        action,
	    makeInput = function (ip, type, action){
			return {
		    	"ip": ip,
		    	"type": type,
		    	"action": action
		    };		 
		};		


	app.get('/api/users', function(req, res) {	
		mongodb.dbmongo.collection(tableUser).find().toArray(function(err, result) {
		    if (err) throw err;		   	
		   	res.json(result);
		});		
	});

	app.get('/api/users/:id', function(req, res) {		
		mongodb.dbmongo.collection(tableUser).find({_id: require('mongoskin').helper.toObjectID(req.params["id"]) }).toArray(function(err, result) {
		    if (err) throw err;		   	
		   	res.json(result[0]);
		});		
	});

	app.post('/api/user', function(req, res) {		
		var pw = req.body.password,obj;
		req.body.password = md5(pw);
		type = "CREATE";
	    action =  message["create"].replace("{ip}", req["_remoteAddress"]);
	    action =  action.replace("{msg}", req.body.userName);	   
	    
		mongodb.dbmongo.collection(tableBoard).insert(makeInput(req["_remoteAddress"],type,action), function(err, result) {
			if (err) throw err;		   				
		});

		mongodb.dbmongo.collection(tableUser).insert(req.body, function(err, result) {
			io.emit('new conn', action);		
			mongodb.dbmongo.collection(tableUser).find().toArray(function(err, result) {
			    if (err) throw err;		   	
			   	res.json(result);
			});		
		});
	});

	app.put('/api/user/:id', function(req, res) {				
		delete req.body["_id"];
		
		type = "UPDATE";
	    action =  message["update"].replace("{ip}", req["_remoteAddress"]);
	    action =  action.replace("{msg}", req.body.userName);	   
	    
		mongodb.dbmongo.collection(tableBoard).insert(makeInput(req["_remoteAddress"],type,action), function(err, result) {
			if (err) throw err;		   				
		});

		mongodb.dbmongo.collection(tableUser).update({_id: require('mongoskin').helper.toObjectID(req.params["id"]) },
			req.body,
			function(err, result) {
			io.emit('new conn', action);		
			mongodb.dbmongo.collection(tableUser).find().toArray(function(err, result) {
			    if (err) throw err;		   	
			   	res.json(result);
			});		
		});
		
	});
	


	app.delete('/api/user/:id', function(req, res) {
		var obj;
		type = "DELETE";
	    action =  message["delete"].replace("{ip}", req["_remoteAddress"]);
	    action =  action.replace("{msg}", req.params["id"]);

		mongodb.dbmongo.collection(tableBoard).insert(makeInput(req["_remoteAddress"],type,action), function(err, result) {
			if (err) throw err;		   				
		});

		mongodb.dbmongo.collection(tableUser).remove({_id: require('mongoskin').helper.toObjectID(req.params["id"]) }, function(err, result) {		    		    
		    io.emit('new conn', action);
		    mongodb.dbmongo.collection(tableUser).find().toArray(function(err, result) {
			    if (err) throw err;		   	
			   	res.json(result);
			});	
		});
	});

	app.get('*', function(req, res) {
		res.sendfile('./public/index.html'); 
	});
};