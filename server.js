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
			allroutes	= /(.*\/)*/;

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

			// console.log(query)
			askNeo(query, neo_getBlocksFromID);
		})
	}


	///////////////////////// master equation /////////////////////
	function action_commitChanges() {
		response.writeHead(200, {"Content-Type": "text/json"})

		request.on('data', function(data) {
			var jsonObject = JSON.parse(data);

			if (jsonObject.stage.length == 0)
			{
				jsonObject.stage.push({ id: null, content: '<br>', sort: 1 })
			}

			var	paths = jsonObject.paths,
				query = neo_getIDofEndNode(paths);

			var blockSet = jsonObject.stage;

			/////////////////////////////////////////////
			// API updateDatabases(oldModel, newModel) //
			/////////////////////////////////////////////

			// update old blocks and insert new blocks
			askNeo(query, commitLoop, blockSet)

			//delete old blocks
			askNeo(query, sortDeleteTypesForWriting, jsonObject)

		})
	}
	////////////////////////////////////////////////////////////////

	function sortDeleteTypesForWriting(results, jsonObject) {
		var oldModel = jsonObject.model,
			newModel = jsonObject.stage;

		var	newArray = [];
		for (i=0; i<newModel.length; i++)
		{
			newArray.push(newModel[i].id)
		}

		var	deleteList = [];
		for (i=0; i<oldModel.length; i++)
		{
			var oldID = oldModel[i].id,
				gotDeleted = newArray.indexOf(oldID)

			if (gotDeleted === -1)
				deleteList.push(oldID)
		}

		var parent = results.data[0];
		sql_delete(deleteList)
		neo_delete(deleteList, parent)
	}
	function sql_delete(deleteList) {
		var query = "DELETE FROM blocks WHERE id IN ("

		for (i=0; i<deleteList.length; i++)
		{
			var chunk = "'" +deleteList[i]+ "', "
			query += chunk
		}
		if (query !== "DELETE FROM blocks WHERE id IN (" )
		{
			query = removeLastComma(query);
			query += ")";
			
			askSQL(query)
			// console.log(query)
		}

	}
	function neo_delete(deleteList, parent) {
		var queryStart = "match ",
			queryEnd = "delete ";

		var char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
			char = char.split("");
		var	char2 = [];
		for (i=0;i<char.length;i++)
		{
			item = "r" + char[i]
			char2.push(item)
		}


		for (i=0; i<deleteList.length; i++)
		{
			var startChunk 	= "(" +char[i]+ ":block {id:'" +deleteList[i]+ "'})<-[" +char2[i]+ ":contains]-(), "
				endChunk	= char[i] + "," + char2[i] +", "
			queryStart 	+= startChunk
			queryEnd 	+= endChunk
		}
		if (queryStart !== "match " )
		{
			queryStart 	= removeLastComma(queryStart)
			queryEnd 	= removeLastComma(queryEnd)
			var query 	= queryStart +queryEnd
			
			askNeo(query)
			// console.log(query)
		}
	}





	function commitLoop(result, blockSet) {
		console.log(blockSet)
		var	parentID 	= result.data[0],
			
			neo_match 	= "match (parent:object {id:'" +parentID+ "'}), ",
			neo_create 	= "create ",
			neo_created = false,
			neo_sort 	= "set ",
			
			sql_deleted = false,
			sql_delete	= "DELETE FROM blocks WHERE id IN (",
			sql_insert  = "INSERT INTO blocks VALUES ";

		//construct queries
		for (i=0;i<blockSet.length;i++)
		{
			if (blockSet[i].id == null) {
				var generatedID = generateID();
				var neo_chunks	= neo_commit(blockSet, i, generatedID);				
			}
			else
				var neo_chunks	= neo_commit(blockSet, i)
			
			var sql_chunks 		= sql_commit(blockSet, i, generatedID);
			
			neo_match 	+= neo_chunks.match
			neo_create 	+= neo_chunks.create
			neo_sort 	+= neo_chunks.sort

			sql_delete 	+= sql_chunks.remove
			sql_insert 	+= sql_chunks.insert

			if (neo_chunks.create.length > 0)
				neo_created = true
			if (sql_chunks.remove.length >0)
				sql_deleted = true
		}

		neo_match 	= removeLastComma(neo_match)
		neo_create 	= removeLastComma(neo_create)
		neo_sort 	= removeLastComma(neo_sort)

		sql_insert 	= removeLastComma(sql_insert)
		sql_delete 	= removeLastComma(sql_delete)
		sql_delete += ")"

		//final queries
		var neo_query;

		if (neo_created == true)
			neo_query = neo_match + neo_create + neo_sort
		else
			neo_query = neo_match + neo_sort

		askNeo(neo_query)

		if (sql_deleted == true)
			askSQL(sql_delete, sql_again, sql_insert)
		else
			askSQL(sql_insert)

		// testQueries(neo_query)

		// if (sql_deleted == true)
		// 	testQueries(sql_delete, sql_again, sql_insert)
		// else
		// 	testQueries(sql_insert)
	
		// console.log(sql_delete)
		// console.log(sql_insert)
		// console.log(neo_query)
	}

	function testQueries(query, callback, object) {
		console.log(query)

		var result = "meh"
			if (callback)
				callback(result, object)
			else
				display404Page();
	}

	function sql_again(rows, query) {
console.log(query)

		var connection = mysql.createConnection({
			host     : 'localhost',
			user     : 'rooster',
			password : 'froffles23',
			database : 'iota',
		});

		rows ="";

		connection.query(query, function (err, rows, fields) 
		{
			if (err) throw err;

			return rows
		});
	}	
	function neo_commit(blockSet, i, generatedID) {
		var neo_chunks = {
			match: "",
			create: "",
			sort: ""
		}
		// console.log(blockSet)
		var id = blockSet[i].id;
		// console.log(id)
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
		var sql_chunks = {
			remove: "",
			insert: ""
		};

		var content = escapeSpecialCharacters(blockSet[i].content)

		//update cases
		if (blockSet[i].id)
		{
			var	id = blockSet[i].id;
			sql_chunks.remove = "'"+id+"', "
			sql_chunks.insert = "('" +id+ "','" +content+ "'), ";
		}
		else {
			var id = generatedID;
			sql_chunks.insert = "('" +id+ "','" +content+ "'), ";
		}

		return sql_chunks
	}





	function displayBlocks(rows, object) {
		var blocksArray = [];

		var sqlIDList = [];
		for (i=0;i<rows.length;i++)
		{
			var sqlID = rows[i].id
			sqlIDList.push(sqlID)
		}


		//display in the right order -- fucking sql
		var	realIDlist = object.blockIDlist;

		for (j=0;j<realIDlist.length;j++)
		{
			var num = sqlIDList.indexOf(realIDlist[j]),
				realContent = rows[num].content; 
			blocksArray.push(realContent)
		}

		var sendList = JSON.stringify({
			blocks 	: 	blocksArray,
			ids 	: 	realIDlist,
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
			blockIDorder = [];


		if (length > 1) {
			for (i=0;i<length;i++) 
			{
				if (i < length-1)
					sqlQuery += '"'+blockIDlist[i]+'",'
				else 
					sqlQuery += '"'+blockIDlist[i]+'")'
			
				blockIDorder.push({"id":blockIDlist[i], "sort": i+1})
			}
		}
		else if (length == 1)
			sqlQuery = 'SELECT * FROM blocks WHERE id='+'"'+blockIDlist[0]+'"'


		var object = {blockIDlist:blockIDlist, newPathID: newPathID, blockIDorder: blockIDorder}
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
function removeLastComma(string) {
	var length = string.length,
		str = string.substring(0,length-2);
	str += " "
	return str
};