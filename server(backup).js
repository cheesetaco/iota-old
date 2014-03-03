var http = require('http'),
	fs = require('fs'),
	neo4j = require('node-neo4j'),
	mysql = require('mysql');


//load index.html on all url[GET] requests
//cache SQL query into the model on all url[GET] requests with(response.end(result))

//______________ Start Server _______________//
var server = http.createServer(requestListener);
server.listen(8080);

console.log('Server running at http://127.0.0.1:8080/');


function requestListener(request, response) {
	// console.log(__dirname);


	function routeList() {
		var location = request.url,
			// getChildren = new RegExp("/getChildren\\??.*"),
			getChildren = location.match(/\/\?getChildren\??.*/),
			commitChanges = location.match(/\/\?commitChanges/),
			allroutes= /(.*\/)*/;

		if (getChildren)
		{	console.log("ajax: "+location)
			
			action_getChildren()
		}
		else if(commitChanges)
		{	console.log("ajax: "+location)

			action_commitChanges()
		}
		else if(fileTest()) //file.js
		{	//console.log("file: " +request.url);
			var filePath = "." + location
			
			routeToFile(filePath, "text/javascript")
		}
		else if(allroutes.test(location)) // all other url requests (location.pathname) - people make these requests directly
		{	console.log("allroutes: " + location)
			
			routeToFile("index.html", "text/html")
		}
		else
			console.log("something didnt load")
		
		function fileTest() {
			var js = /.*\.js/,
				css = /.*\.css/;
			if (js.test(location) || css.test(location))
				return true
		}

	}


	function action_getChildren() {
		response.writeHead(200, {"Content-Type": "text/json"})

		request.on('data', function(data) {
			var jsonObject = JSON.parse(data),
				parentNodes = jsonObject.parentNodes,
				query = neo_getIDofEndNode(parentNodes);

			console.log(query)
			askNeo(query, neo_getBlocksFromID);
		})
	}




	function action_commitChanges() {
		response.writeHead(200, {"Content-Type": "text/json"})

		request.on('data', function(data) {
			var jsonObject = JSON.parse(data),

				paths = jsonObject.paths,
				query = neo_getIDofEndNode(paths);

			var blockSet = jsonObject.stage;

			askNeo(query, commitLoop, blockSet)
		})
	}

	function commitLoop(result, blockSet) {
		var	parentID 	= result.data[0],
			neo_match 	= "match (parent:object {id:'" +parentID+ "'}), ",
			neo_create 	= "create ",
			neo_created = false,
			neo_sort 	= "set ",
			sql_query	= "";

		for (i=0;i<blockSet.length;i++)
		{	
			if (blockSet[i].id == null)
				var generatedID = generateID();

			var sql_chunk 	= sql_commit(blockSet, i, generatedID);
				neo_chunks	= neo_commit(blockSet, i, generatedID);
			
			sql_query 	+= sql_chunk
			neo_match 	+= neo_chunks.match
			neo_create 	+= neo_chunks.create
			neo_sort 	+= neo_chunks.sort

			if (neo_chunks.create.length > 0)
				neo_created = true
		}
		var removeLastComma = function(string) {
			var length = string.length,
				str = string.substring(0,length-2);
			str += " "
			return str
		},
			neo_match = removeLastComma(neo_match),
			neo_create = removeLastComma(neo_create),
			neo_sort = removeLastComma(neo_sort);

		if (neo_created == true)
			var neo_query = neo_match + neo_create + neo_sort
		else
			var neo_query = neo_match + neo_sort

		console.log(sql_query)
		console.log(neo_query)
		// askNeo(neo_query)
		// askSQL(sql_query)
	}
	function neo_commit(blockSet, i, generatedID) {
		var neo_chunks = {
			match: "",
			create: "",
			sort: ""
		}

		var id = blockSet[i].id;

		var char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
			char = char.split(""),
			sort = i+1;

		neo_chunks.sort = char[i] + ".sort=" +sort+ ", "
		
		if (generatedID)
			neo_chunks.create = "(parent)-[:contains]->("+ char[i] + ":block {id:'" +generatedID+ "'}), "
		else
			neo_chunks.match  = "("+ char[i] + ":block {id:'" +id+ "'}), "

		return neo_chunks
	}

	function sql_commit(blockSet, i, generatedID) {
		var sql_chunk = "";

		var content = blockSet[i].content

		//update cases
		if (blockSet[i].id)
		{
			var	id = blockSet[i].id;
			sql_chunk = "UPDATE blocks SET content='" +content+ "' WHERE id='" +id+ "'; ";
		}
		else if (generatedID)
		{
			sql_chunk = "INSERT INTO blocks VALUES('" +generatedID+ "','" +content+ "'); ";
		}

		return sql_chunk
	}












	// function action_commitChanges() {
	// 	response.writeHead(200, {"Content-Type": "text/json"})

	// 	request.on('data', function(data) {
	// 		var jsonObject = JSON.parse(data),

	// 			paths = jsonObject.paths,
	// 			query = neo_getIDofEndNode(paths);

	// 		var blockSet = jsonObject.stage;

	// 		askNeo(query,commitBlocks,blockSet)
	// 	})
	// }

	// var globals = {
	// 	iteration: undefined,
	// 	ownerID: undefined,
	// 	neoQueryMatch : "match ",
	// 	neoQueryCreate : "create ",
	// 	neoQuerySort : "set ",
	// 	newBlocksToCommit : false
	// }
	// function commitBlocks(result, blockSet) {
	// 	//init
	// 	if (globals.iteration == undefined)
	// 	{
	// 		globals.ownerID 	= result.data[0]
	// 		globals.iteration 	= 0
	// 		globals.neoQueryMatch += "(a:object {id:'"+result.data[0]+"'}), "
	// 	}

	// 	//setup SQL query
	// 	var i 		= globals.iteration,		
	// 		length 	= blockSet.length,
	// 		content = escapeSpecialCharacters(blockSet[i].content),
	// 		sort 	= blockSet[i].sort;

	
	// 	var char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
	// 		char = char.split("");

	// 	if (blockSet[i].id)//update changed blocks
	// 	{
	// 		var	id 		= blockSet[i].id,
	// 			query 	= "UPDATE blocks SET content='" +content+ 
	// 						"' WHERE id='" +id+ "'";
	// 	}
	// 	else if (blockSet[i].id == undefined)//create new blocks
	// 	{
	// 		var id = generateID(),
	// 			query = "INSERT INTO blocks VALUES('"+id+"','"+content+"')";

	// 		//neo
	// 		globals.newBlocksToCommit = true;
	// 		if (globals.iteration < length)
	// 		{		
	// 			globals.neoQueryCreate += "(a)-[:contains]->("+char[i+1]+
	// 				":block {id:'"+id+"'}), "
	// 		}
	// 		else
	// 		{
	// 			globals.neoQueryCreate += "(a)-[:contains]->("+char[i+1]+
	// 				":block {id:'"+id+"'}) "
	// 		}
			
	// 		// console.log(query)
	// 	}


	// 	//loop queries
	// 	globals.iteration++
		
	// 	//setup neo query

	// 	var	i 	 = globals.iteration; 
				
	// 	//update SQL content
	// 	if (globals.iteration < length)
	// 	{
	// 		// callback(query,commitBlocks,blockSet)

	// 		askSQL(query, commitBlocks, blockSet)

	// 		globals.neoQueryMatch += "("+char[i]+":block {id:'"+id+"'}), ";
	// 		globals.neoQuerySort += char[i]+".sort="+globals.iteration+", ";

	// 	}
	// 	else if (globals.iteration == length)
	// 	{
	// 		// askSQL(query)

	// 		globals.neoQueryMatch += "("+char[i]+":block {id:'"+id+"'}) ";
	// 		globals.neoQuerySort += char[i]+".sort="+globals.iteration;			
	// 		if (globals.newBlocksToCommit)
	// 		{
	// 			var neoQuery = globals.neoQueryMatch + globals.neoQueryCreate + globals.neoQuerySort;
	// 		}
	// 		else {
	// 			var neoQuery = globals.neoQueryMatch + globals.neoQuerySort;

	// 		}
	// 		console.log(neoQuery)
	// 		// askNeo(neoQueryMatch)
	// 	}


	// }









//delete missing blocks
	// function runUpdate

	function callback(query, callback, object) {
		var rows = "garbage";
		callback(rows, object)
	}



	function neo_createBlock(result, object) {
		var parentID = result.data[0],
			id = object.id,
			sort = object.sort,
			content = object.content,

		query = 'match (a:object {id:"'+parentID+'"}) create (a)-[:contains]->(b:block {id:"'+id+'",sort:'+sort+'}) return a,b';
		console.log("create block: " + query)
		askNeo(query)
		
		var query = 'INSERT INTO blocks VALUES("'+id+'", "'+content+'")';
		// console.log("create block: " + query)
		// askSQL(query, this, displayBlocks)
	}



	function displayBlocks(rows, object) {
		var blocksArray = [];

		for(i=0;i<rows.length;i++)
		{
			var block = rows[i].content.toString();

			blocksArray.push(block);
		};

		var sendList = JSON.stringify({
			blocks 	: 	blocksArray,
			ids 	: 	object.blockIDlist,
			parentID: 	object.newPathID
		});

		response.end(sendList);
	}
	function display404Page() {
		var message = 404;
		var message = JSON.stringify(message)
		console.log(message)
		response.end(message)
	}




	function sql_getBlockContent(result, newPathID) {
		var blockIDlist = result.data,
			length = blockIDlist.length,
			sqlQuery = 'SELECT * FROM blocks WHERE id in (';
		
		if (length > 1) {
			for (i=0;i<length;i++) 
			{
				if (i < length-1)
					sqlQuery += '"'+blockIDlist[i]+'",'
				else 
					sqlQuery += '"'+blockIDlist[i]+'")'
			}
		}
		else if (length == 1)
			sqlQuery = 'SELECT * FROM blocks WHERE id='+'"'+blockIDlist[0]+'"'

		var object = {blockIDlist:blockIDlist, newPathID: newPathID}
		// console.log(sqlQuery);
		askSQL(sqlQuery, displayBlocks, object);
	}

	function neo_getBlocksFromID(result) {
		var newPathID = result.data[0],
			query = 'match (:object {id:"'+newPathID+'"})-[:contains]->(n:block) return n.id order by n.sort';

		// console.log(query)
		askNeo(query, sql_getBlockContent, newPathID)
	}
	function neo_getIDofEndNode(parentNodes) {
		var nodes = parentNodes,
			length = parentNodes.length,
			query = "match ";

		for (i=0; i<length; i++)
		{
			if (i<length-1)
			{
				var phrase = "({name:'"+nodes[i]+"'})-[:owns]->";
				query += phrase
			}
			else
			{
				var phrase = "(currentNode {name:'"+nodes[i]+"'}) return currentNode.id";
				query += phrase
			}
		}

		return query;
	}


	function askNeo(query, callback, object) {
		var db = new neo4j('http://kylerutland:froffles23@localhost:7474')

		db.cypherQuery(query, function(err, result) {
			if(err) throw err;
			
			// console.log(result);

			if (result.data[0]!==undefined && callback)
				callback(result, object)
			else
				display404Page();

		})
	}
	function askSQL(query, callback, object) {
		var connection = mysql.createConnection({
			host     : 'localhost',
			user     : 'rooster',
			password : 'froffles23',
			database : 'iota',
		});


		connection.query(query, function (err, rows, fields) 
		{
			if (err) throw err;

			if (callback)
				callback(rows, object)
			else
				return rows
		});
	}




	// local-file loader
	var routeToFile = function(filePath, MIMEtype, callback) {
		var fileName = filePath;
		
		fs.exists(fileName, function(exists) {
		if (exists) {
			fs.stat(fileName, function(error, stats) {
				fs.open(fileName, "r", function(error, fd) {
					var buffer = new Buffer(stats.size);
		 	
						fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
							var data = buffer.toString("utf8", 0, buffer.length);
			 	
							// console.log(data);
							var MIME = typeof MIMEtype !== 'undefined' ? MIMEtype : 'html';
							//////////// http package //////////////
							response.writeHead(200, {'Content-Type': MIME}); //fs load the ajax file
							response.end(data);
							///////////////////////////////////////
							fs.close(fd);							
						})
					})
				})
			}
		})
	}

	//listen for http requests
	routeList();
}




function generateID() {
	var chars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
		list = chars.split(""),
		ID = "";

	for (integer=0;integer<7;integer++)
	{
		var rand = Math.floor(Math.random() * 62);
		ID += list[rand]
	}
	return ID;
}
function escapeSpecialCharacters(string) {
	string = string.replace(/(['"\\])/g, "\\$1")
	return string
}