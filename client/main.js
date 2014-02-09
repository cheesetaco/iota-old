require(['client/model.js', 'client/view.js'], function(model, view) {

//check the url location.pathname and send data to the database (from model.js)
	$(document).ready(function() 
	{
		var pathname = location.pathname,
			view_renderModel = view.renderModel;
			// path = pathCatcher(pathname);

		//check if we're at index.html, if not send the last id in the url
		if (pathname !== "/") 
		{
			var	arr = pathname.split('/'),
				pid = arr.pop();
			
			console.log(pid)

			//send the location data to the model
			model.loadModel(pid, view_renderModel)
		}
		else //if index.html was directly requested
		{
			var pid = "1";
			model.loadModel(pid, view_renderModel)
		}


	});

//ignore this - will be used to query neo4j database to get object ids and relationships
	// function pathCatcher(path) {
	// 	var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
	// 		nodeList = path.split('/'),
	// 		length = nodeList.length-1,
	// 		nodeList = nodeList.splice(1,length),
	// 	//cypher query
	// 		start = "start n=node(*) match ",
	// 		pathlist = "",
	// 		pathend = "("+ alpha[length-1] + " {id:'"+ nodeList[length-1] +"'}) return distinct ",
	// 		end = "";

	// 	for (i=0; i<(length-1); i++) 
	// 	{
	// 		var pathlist = pathlist.concat("("+ alpha[i] +" {id:'"+ nodeList[i] +"'})-[:owns]->"),
	// 			end = end.concat(alpha[i]+",");
	// 	}
	// 	var end = end.concat(alpha[length-1]),
	// 		query = start+pathlist+pathend+end;
	// }


})