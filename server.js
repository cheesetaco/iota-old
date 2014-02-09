var http = require('http'),
	fs = require('fs'),
	mysql = require('mysql');


//load index.html on all url[GET] requests
//cache SQL query into the model on all url[GET] requests with(response.end(result))

//______________ Start Server _______________//
var server = http.createServer(requestListener);
server.listen(8080);

console.log('Server running at http://127.0.0.1:8080/');


function requestListener(request, response) {
	// console.log(__dirname);
	console.log("Q: "+request.url);

	function routeList() {
		var getChildren = new RegExp("/getChildren\\??.*");
		var allroutes= /(.*\/)*/;

		// index.html
		if (request.url == "/"){
			
			console.log('S: ' + request.url)
			
			routeToFile('index.html');	
		}
		// ajax request
		else if (request.url.match(getChildren))
		{	
			console.log('S: ' + "getChildren")
			
			response.writeHead(200, {"Content-Type": "text/json"})

			request.on('data', function(data) {
				// console.log(data);
				var jsonObject = JSON.parse(data); // parse buffer into an object
				var pid = jsonObject.pid;
				var pid = pid.split('/').pop();
				console.log(pid);
				var query = "SELECT * FROM objects WHERE id='"+pid+"'";
				
				askDatabase(query);
			})

		}
		//file.js
		else if(fileTest())
		{
			console.log('S: ' + "file")
			var filePath = "." + request.url;
			routeToFile(filePath, "text/javascript");
		}
		// all other url requests (location.pathname) - people make these requests directly
		else if(allroutes.test(request.url))
		{
			console.log('S: ' + "allroutes" + request.url)
			routeToFile("index.html", "text/html")
		}
		
		function fileTest() {
			var req = request.url
			var js = /.*\.js/;
			if (js.test(req))
				return true
		}

	}
	var askDatabase = function(query) {
		var connection = mysql.createConnection({
			host     : 'localhost',
			user     : 'rooster',
			password : 'froffles23',
			database : 'iota',
		});

		// console.log(query);
		connection.query(query, function (err, rows, fields) {
			if (err) throw err;

			for(i=0;i<rows.length;i++)
			{
				var content = rows[i].content.toString()
				// console.log(content);
				rows[i].content = content;
				// console.log(content);
			};
			
			var result = JSON.stringify(rows);
			// console.log(result);

			response.end(result);
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
