// nodejs packages
var express = require("express");
var app = express();
var bodyParser= require("body-parser");
var methodOverride = require("method-override");
app.set("view engine","ejs");
app.use(express.static("Public"));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
//import of external js file
let functions = require("./Public/stylesheets/main");
let reviewindex = functions.reviewindex;
let roomindex = functions.roomindex;
let waitingindex = functions.waitingindex;
// db connection
var mongoose= require("mongoose");
const uri = "mongodb://localhost/db_holdhand"
mongoose
    .connect(uri, {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true})
    .then(() => {
        console.log(`Connected to DB ${uri}`)
	})
    .catch((err) => {
        console.log(`Error: ${err.message}`)
    });
// user data schema-model : name, Categories, score,type,roomid,position, maxscore, totalscore
var user = new mongoose.Schema({
		name: String,
		Categories:{
			color:String,
			Name: String,
			city: String,
			fruit: String
		},
		maxscore:Number,
		totalscore:Number,
		score:{
			colorscore:Number,
			Namescore:Number,
			cityscore:Number,
			fruitscore:Number
		},
		type:String,
		roomid:Number,
		position:Number
});
var User = mongoose.model("User",user);
// room data schema-model : number, users(schema>user), character, roundnumber
var room = new mongoose.Schema({
	number:Number,
	users:[user],
	character:String,
	players:Number,
	roundnumber:Number
});
var Room = mongoose.model("Room",room);
//landing get route: show user registration form 
app.get("/",function(req,res){
	res.render("landing");
});
// landing post route: create user and added to an existence room or create it
app.post("/",function(req,res){
	waitingindex=0;
	var name = req.body.username;
	var room = req.body.roomnumber;
	console.log(name);
	console.log(room);
	var userscore= {colorscore:0,Namescore:0,cityscore:0,fruitscore:0};
	var roomnumber = {number:room};
	//check the room  if it exists, return value or false
	Room.exists(roomnumber,function(err,roomexist){
		if(err){
			console.log(err);
		}else{
			// case to access where the room exist (join mode)
			if(true == roomexist){
				console.log("true validation of room");
			// find existed room on the rooms collections
				Room.findOne(roomnumber,function(err,roomfind){
					if(err){
						console.log(err);
					}else{
	// add new user to existed room data
						var userdatatypeB = {name:name,type:"User",roomid:room,score:userscore,totalscore:0,maxscore:0};
						roomfind.users.push(userdatatypeB);
						roomfind.save(function(err,newtoroom){
							if(err){
								console.log(err);
							}else{
	// create/add the new user to the users collections
								User.create(userdatatypeB,function(err,userdata){
									if(err){
										console.log(err);
									}else{
										//console.log(userdata);
										res.redirect("/waiting/"+roomfind._id+"/"+userdata._id);
									}
								});
							}
						});
					}
				});
			}else{
				// case to access where the room does not exist (create mode)
				console.log("false validation of room");
				var randomindex=0;
				var randomnumber = functions.getRandomNumber();
				console.log(randomnumber);
				// randomnumber comparison with roomdata number of rooms collection
				Room.find({},function(err,roomdata){
				// compare the roomnumber until the comparisons are satisfied to all rooms
					let maxcomparisons = roomdata.length -1;
					if(maxcomparisons <0){
						maxcomparisons =0;
					};
					console.log(maxcomparisons);
					while(randomindex != maxcomparisons){
								if(randomnumber == roomdata[randomindex].number){
									randomnumber = functions.getRandomNumber();
									randomindex = 0;
								}else{
								    randomindex++;	
								}
					}
					console.log(randomnumber);
					var userdatatypeA = {name:name,type:"Admin",roomid:randomnumber,score:userscore,totalscore:0,maxscore:0};
				// once the comparison if finished create/add new room to rooms collection
					Room.create({number:randomnumber,roundnumber:1},function(err,newroom){
						if(err){
						console.log(err);
						}else{
				// add new admin to new room added
							newroom.users.push(userdatatypeA);
							newroom.save(function(err,newtoroom){
								if(err){
								console.log(err);
								}else{
				// create/add new admin to users collection
									User.create(userdatatypeA,function(err,userdata){
									if(err){
										console.log(err);
									}else{
										res.redirect("/waiting/"+newtoroom._id+"/"+userdata._id);
									}
									});
								}
							});
						}
					});
				});
			}
		}	
	});	
});
//Waiting get route: show users in the room 
app.get("/waiting/:roomid/:id",function(req,res){
	console.log("enter waiting page");
	var userid = req.params.id;
	var roomid = req.params.roomid;
	// set user and room id to a variable
	var ids = {userid,roomid};
	//Identified specified room by its id 
	Room.findById(roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
	// set on specified room the number of players
			roomdata.players = roomdata.users.length;
			var playersnumber = roomdata.players;
			roomdata.save();
			User.findById(req.params.id,function(err,user){
				if(err){
					console.log(err);
				}else{
					res.render("waiting",{user:user,roomdata:roomdata,ids:ids,playersnumber:playersnumber,index:waitingindex});
				}
			});	
		}
	});
});
//Ready button waiting page : give access to players to room
app.post("/ready/:roomid/:id",function(req,res){
	console.log("ready button clicked");
	waitingindex =1;
	res.redirect("/waiting/"+req.params.roomid+"/"+req.params.id);
});
// room get route:show user info and data registration form
app.get("/room/:roomid/:id",function(req,res){
	console.log("enter room page");
	var roomid= req.params.roomid;
	// find specified room by its id
	Room.findById(roomid,function(err,roomdata){
	//find an specified user on the specified room by its id
		User.findById(req.params.id,function(err,user){
		if(err){
			console.log(err);
		}else{
			res.render("room",{user:user,roomdata:roomdata});
		}
	});		
	});	
});
// room post route: add user data to a user
app.post("/room/:roomid/:id",function(req,res){
	console.log("enter room post")
	var datacolor = req.body.color;
	var dataname = req.body.Name;
	var datacity = req.body.city;
	var datafruit = req.body.fruit;
	var datauser = {color:datacolor,Name:dataname,city:datacity,fruit:datafruit};
	//const timestamp = Math.round(new Date() / 1000);
 	// find the specified user on the users collection
	User.findById(req.params.id,function(err,user){
		if(err){
			console.log(err);
		}else{
	// add the user data on the specified user founded
	// add position to the user
			user.position = roomindex;
			roomindex = parseInt(roomindex) + 1;
	// add data categories
			user.Categories = datauser;
			user.save(function(err,userdata){
				if(err){
					console.log(err);
				}else{
	// determined if the player is the admin and show the review page 
					if(userdata.type == "Admin"){
						res.redirect("/room/"+req.params.roomid+"/"+req.params.id+"/review");	
					}else{
	// if not is the admin, show the results page
						res.redirect("/room/"+req.params.roomid+"/"+req.params.id+"/results");		
						}
				}
			});
		}
	});
});
// room new character button: find room and add a random character to the room and reset the maxscore
app.post("/char/:roomid/:id",function(req,res){
	console.log("button character clicked");
	reviewindex =0;
	roomindex = 1;
	var userid = req.params.id;
	var roomid = req.params.roomid;
	//find specified room and save the generated letter
	Room.findById(req.params.roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			//console.log(roomdata.number);
			roomdata.character = functions.getRandomString(1);
			roomdata.save();
			//console.log(roomdata);
	//find users on the specified room and reset the maxscore
			User.find({roomid:roomdata.number},function(err,roomusers){
				if(err){
					console.log(err);
				}else{
					for(var i=0;i<roomusers.length;i++){
						roomusers[i].Categories.color="";
						roomusers[i].Categories.Name="";
						roomusers[i].Categories.city="";
						roomusers[i].Categories.fruit="";
						roomusers[i].maxscore =0;
						roomusers[i].save();
					} 
					res.redirect("/room/"+req.params.roomid+"/"+req.params.id);
				}
			});
		}
	});
});
// review route get: identified users to a specified room and show them with its data
app.get("/room/:roomid/:id/review",function(req,res){
	console.log("enter get review page");
	console.log(reviewindex);
	var userid = req.params.id;
	var roomid = req.params.roomid;
	// set user and room id to a variable
	var ids = {userid,roomid};
	//Identified specified room
	Room.findById(roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			var roomnumber = roomdata.number;
	//identified users with specified room by its id number 
			User.find({roomid:roomnumber},function(err,roomusers){
				if(err){
					console.log(err);
				}else{
					res.render("review",{roomusers:roomusers,ids,index:reviewindex,roomdata:roomdata});
				}
			});
		}
	});
});
// review post route: identified users in a room and add a score to the user selected
app.post("/room/:roomid/:id/review",function(req,res){
	console.log("enter post review");
	reviewindex =1;
	var colorscore = req.body.score_color;
	var Namescore = req.body.score_Name;
	var cityscore = req.body.score_city;
	var fruitscore = req.body.score_fruit;
	var bonusscore = req.body.score_bonus;
	//Identified specified room
	Room.findById(req.params.roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			var roomnumber = roomdata.number;
	// Identified user in the room by the roomid and add the scores :totalscore, maxscore
			User.find({roomid:roomnumber},function(err,roomusers){
				if(err){
					console.log(err);
				}else{
					for(var i=0;i<roomusers.length;i++){
	// set the maxscore to be the sum of the categories score for the round
						roomusers[i].maxscore = parseInt(colorscore[i])+parseInt(Namescore[i])+parseInt(cityscore[i])+parseInt(fruitscore[i])+parseInt(bonusscore[i]);
	// set the totalscore to be an autosum of the maxscore
						roomusers[i].totalscore += roomusers[i].maxscore;
						roomusers[i].save();
					};
						res.redirect("/room/"+req.params.roomid+"/"+req.params.id+"/review");
				}
			});
		}	
	});
});
// review position button: set on specified room a new roundnumber
app.post("/position/:roomid/:id/review",function(req,res){
	console.log("click position button");
	Room.findById(req.params.roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			roomdata.roundnumber=  parseInt(roomdata.roundnumber)+1;
			roomdata.save();
			res.redirect("/room/"+req.params.roomid+"/"+req.params.id+"/position");
		}
	});
});
// results get route: 
app.get("/room/:roomid/:id/results",function(req,res){
	console.log("enter get results")
	var userid = req.params.id;
	var roomid = req.params.roomid;
	// set user and room id to a variable
	var ids = {userid,roomid};
	//Identified specified room
	Room.findById(roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			var roomnumber = roomdata.number;
	//identified users with specified room by its number
			User.find({roomid:roomnumber},function(err,roomusers){
				if(err){
					console.log(err);
				}else{
					res.render("results",{roomusers:roomusers,ids});
				}
			});
		}
	});
});
// position get route: 
app.get("/room/:roomid/:id/position",function(req,res){
	console.log("enter get position")
	var userid = req.params.id;
	var roomid = req.params.roomid;
	// set user and room id to a variable
	var ids = {userid,roomid};
	//Identified specified room
	Room.findById(roomid,function(err,roomdata){
		if(err){
			console.log(err);
		}else{
			var roomnumber = roomdata.number;
			console.log(roomnumber);
			//identified users with specified room by its id number   
			const query = {roomid: roomnumber};
			User.find(query, function(err,result){
				res.render("position",{result,ids});
			}).sort({totalscore: -1});
		}
	});
});
app.listen(3000, function() { 
  console.log('Server listening on port 3000'); 
});
