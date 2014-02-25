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
			var jsonObject = JSON.parse(data)
			console.log(jsonObject)
			// var length = stage.length;
			// for (i=0;i<length;i++)
			// {
			// 	var id = stage[i].id,
			// 		content = stage[i].content,
			// 		sort = stage[i].sort;

			// 	if (id == undefined)
			// 	{

			// 	}		
			// 	//commit changes
			// 	//changing current objects sort
			// 	//creating new objects + sort
			// }

			// var jsonObject = JSON.parse(data),
			// 	parentNodes = jsonObject.parentNodes,
			// 	query = neo_getIDofEndNode(parentNodes),

			// 	content = jsonObject.content,
			// 	id = generateID(),
			// 	sort = jsonObject.sort,
			// 	object = {content:content, id:id, sort:sort};

			// askNeo(query, neo_createBlock, object)
		})
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
		askSQL(query, displayBlocks)
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
			
			console.log(result);

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

	for (i=0;i<7;i++)
	{
		var rand = Math.floor(Math.random() * 62);
		ID += list[rand]
	}
	return ID;
}
