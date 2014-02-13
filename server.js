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
		var getChildren = new RegExp("/getChildren\\??.*"),
			allroutes= /(.*\/)*/;

		// ajax request
		if (request.url.match(getChildren))
		{	
			console.log("ajax: "+request.url);
			
			response.writeHead(200, {"Content-Type": "text/json"})

			request.on('data', function(data) {
				var jsonObject = JSON.parse(data), // parse buffer into an object
					paths = jsonObject.paths, // ['quorum', 'users', 'tomas']
					characterSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
					characterSet = characterSet.split(""),
					query = "match ";

				// match (a:object {name:"1"})-[:owns]->(b:object {name:"2"}) return b
				var length = paths.length;
				for (i=0; i<length; i++) { 
					if (i < length-1)
						query += '('+characterSet[i]+':object {name:"'+paths[i]+'"})-[:owns]->';
					else
						query += '('+characterSet[i]+':object {name:"'+paths[i]+'"}) return '+characterSet[i]+'.id';
				}

				askNeo(query);

				// askDatabase(query);
			})

		}
		//file.js
		else if(fileTest())
		{
			console.log("file: " +request.url);
			var filePath = "." + request.url;
			routeToFile(filePath, "text/javascript");
		}
		// all other url requests (location.pathname) - people make these requests directly
		else if(allroutes.test(request.url))
		{
			console.log("allroutes: " + request.url)
			routeToFile("index.html", "text/html")
		}
		
		function fileTest() {
			var req = request.url
			var js = /.*\.js/;
			if (js.test(req))
				return true
		}

	}

	var askNeo = function(query, callback) {
	
	console.log("query: "+query)
		var db = new neo4j('http://kylerutland:froffles23@localhost:7474');
		var res = db.cypherQuery(query, function(err, result) 
		{
    		if(err) throw err;
    		var currentObjID = result.data[0],
				query2 = 'match (:object {id:"'+currentObjID+'"})-[:contains]->(n:block) return n.id';

		console.log("query2"+query2);	
			db.cypherQuery(query2, function(err,result) 
			{
				if(err) throw err;
				var blockIDlist = result.data,
					length = blockIDlist.length,
					sqlQuery = 'SELECT * FROM blocks WHERE id in (';

				if (length > 1) {
					for (i=0;i<length;i++) 
					{
						if (length == 1)
							sqlQuery += '"'+blockIDlist[i]+'")';
						else if (i < length-1)
							sqlQuery += '"'+blockIDlist[i]+'",'
						else 
							sqlQuery += '"'+blockIDlist[i]+'")'
					}
				}
				else if (length == 1)
				{
					sqlQuery = 'SELECT * FROM blocks WHERE id='+'"'+blockIDlist[0]+'"'
				}
				else if (length == 0)
					throw err;

				console.log(sqlQuery);

				askDatabase(sqlQuery);
			});



		});

	}
	var askDatabase = function(query) {
		var connection = mysql.createConnection({
			host     : 'localhost',
			user     : 'rooster',
			password : 'froffles23',
			database : 'iota',
		});


		connection.query(query, function (err, rows, fields) {
			if (err) throw err;

			var blocksArray = [];
			for(i=0;i<rows.length;i++)
			{
					var block = rows[i].content.toString()
					blocksArray.push(block);
			};
			var sendList = JSON.stringify(blocksArray);

			response.end(sendList);
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
