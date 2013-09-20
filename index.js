// configure API
var format = require('util').format;
var express = require('express')
  , app = express() 
  , MongoClient = require('mongodb').MongoClient
  , port    = process.env.PORT || '1230'
  , mongo_port = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/filmProj';

MongoClient.connect(mongo_port, function(err, db) {
    "use strict";
    if(err) throw err;

    app.use(express.bodyParser());

    // default route does nothing
    app.get('/', function(req, res) {
    	res.write('welcome to filmProj 0.1');
    	res.end();
    });

    /**
    ==  ==  ==  ==  ==  ==  ==  ==  CREATE PROJECT / ACCESS PROJECTS   ==   ==  ==  ==  ==  ==
    **/

    // create project
    app.post('/proj', function(req, res) {
        var document = req.body;
        var project_identifier = document.project_id;
        var query_project = {project_id:project_identifier};
        if (project_identifier) {
        	db.collection("projects", function(err, collection) {
                if (err) {throw err};
        		collection.update(query_project, document, {upsert:true}, function(err, results) {
        			if (err) {throw err};
    				res.write(JSON.stringify(document.name) + ' project written in file');
    				res.end();
        		});
        	});
        };
    });

    // access projects
    app.get('/proj', function(req, res) {
    	db.collection("projects", function(err, collection){
            if (err) {throw err};
            collection.find().toArray(function(err, results) {
            	if (err) {throw err};
		        res.write(JSON.stringify(results));
		        res.end();
		      });    
        });    	
    });

    /**
    ==  ==  ==  ==  ==  ==  ==  ==  CREATE ACCOUNT / ACCESS ACCOUNTS   ==   ==  ==  ==  ==  ==
    **/

    // create user accounts
    app.post('/account', function(req, res) {
    	var document = req.body;
        var account_identifier = document.account_id;
        var account_type = document.type;
        var query = {"account_id":account_identifier, "type":account_type};
        if (account_identifier && account_type) {
        	db.collection("accounts", function(err, collection) {
                if (err) {throw err};
        		collection.update(query, document, {upsert:true}, function(err, results) {
        			if (err) {throw err};
    				res.write(JSON.stringify(document.name) + ' account written in file');
    				res.end();
            
        		});
        	});
        };
    });

    // access user accounts
    app.get('/account', function(req, res) {
    	db.collection("accounts", function(err, collection){
            if (err) {throw err};
            collection.find().toArray(function(err, results) {
            	if (err) {throw err};
		        res.write(JSON.stringify(results));
		        res.end();
		      });    
        });    	
    });

    /**
    ==  ==  ==  ==  ==  ==  ==  ==  FOLLOW PROJECT / PROJECT FOLLOWED BY   ==   ==  ==  ==  ==  ==
    **/

    // create follow project, known as "bid"
    app.post('/bid', function(req, res) {
        var document = req.body;
        var project_identifier = document.project_id;
        var account_identifier = document.account_id;
        var query_proj = {"project_id":project_identifier};
        var query_acc = {"account_id":account_identifier};
        if (project_identifier && account_identifier) {
            db.collection("projects", function(err, projects) {
                if (err) {throw err};
                projects.update(query_proj, {$pull:{bids:{account_id:account_identifier}}}, {upsert:true}, function(err, results) {
                    if (err) {throw err};
                    projects.update(query_proj, {$addToSet:{bids:document}}, {upsert:true}, function(err, results) {
                        if (err) {throw err};
                        res.write(JSON.stringify(document) + ' added/updated bid to file \'projects\'');
                        db.collection("accounts", function(err, accounts) {
                            if (err) {throw err};
                            accounts.update(query_acc, {$pull:{bids:{project_id:project_identifier}}}, function(err, results) {
                                if (err) {throw err};
                                accounts.update(query_acc, {$addToSet:{bids:document}}, {upsert:true}, function(err, results) {
                                    if (err) {throw err};
                                    res.write(JSON.stringify(document) + ' added/updated bid to file \'accounts\'');
                                    res.end();
                                });
                            });
                        });
                    });
                });        
            });
        };
    });

    // remove bid
    app.post('/bid/remove', function(req, res) {
        var document = req.body;
        var project_identifier = document.project_id;
        var account_identifier = document.account_id;
        var query_proj = {"project_id":project_identifier};
        var query_acc = {"account_id":account_identifier};
        if (project_identifier && account_identifier) {
            db.collection("projects", function(err, projects) {
                if (err) {throw err};
                projects.update(query_proj, {$pull:{bids:{account_id:account_identifier}}}, function(err, results) {
                    if (err) {throw err};
                    res.write('removed bid from account ' + account_identifier);
                    db.collection("accounts", function(err, accounts) {
                        if (err) {throw err};
                        accounts.update(query_acc, {$pull:{bids:{project_id:project_identifier}}}, function(err, results) {
                            if (err) {throw err};
                            res.write('removed bid from project ' + project_identifier);
                            res.end();
                        });
                    });
                });
            });
        };
    });

    /**
    ==  ==  ==  ==  ==  ==  ==  ==  FOLLOW ACCOUNT / ACCOUNT FOLLOWED BY   ==   ==  ==  ==  ==  ==
    **/

    // create follow account, known as "following"
    app.post('/follow', function(req, res) {
        var document = req.body;
        var project_identifier = document.project_id;
        var account_identifier = document.account_id;
        var query_proj = {"project_id":project_identifier};
        var query_acc = {"account_id":account_identifier};
        console.log(JSON.stringify(document));
        if (project_identifier && account_identifier) {
            db.collection("projects", function(err, projects) {
                if (err) {throw err};
                    projects.update(query_proj, {$addToSet:{following:document}}, {upsert:true}, function(err, results) {
                        if (err) {throw err};
                        console.log('in addToSet projects');
                        res.write('expressed interest in ' + JSON.stringify(account_identifier));
                        db.collection("accounts", function(err, accounts) {
                            if (err) {throw err};
                                accounts.update(query_acc, {$addToSet:{following:document}}, {upsert:true}, function(err, results) {
                                    if (err) {throw err};
                                    res.write(JSON.stringify(project_identifier) + ' is following');
                                    res.end();
                        });
                    });
                });
            });        
        };
    });

    // remove follow
    app.post('/bid/remove', function(req, res) {
        var document = req.body;
        var project_identifier = document.project_id;
        var account_identifier = document.account_id;
        var query_proj = {"project_id":project_identifier};
        var query_acc = {"account_id":account_identifier};
        if (project_identifier && account_identifier) {
            db.collection("projects", function(err, projects) {
                if (err) {throw err};
                projects.update(query_proj, {$pull:{following:{account_id:account_identifier}}}, function(err, results) {
                    if (err) {throw err};
                    res.write('no longer following actor ' + JSON.stringify(document.name));
                    db.collection("accounts", function(err, accounts) {
                        if (err) {throw err};
                        accounts.update(query_acc, {$pull:{following:{project_id:project_identifier}}}, function(err, results) {
                            if (err) {throw err};
                            res.write('no longer followed by project ' + JSON.stringify(project_identifier));
                            res.end();
                        });
                    });
                });
            });
        };
    });
        

    app.listen(port);
    console.log('Express server listening on port ' + port);
    });