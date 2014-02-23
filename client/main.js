require([window.location.origin+'/client/model.js', window.location.origin+'/client/view.js'], function(model, view) {

//check the url location.pathname and send data to the database (from model.js)

	$(document).ready(function() 
	{
		sendPathnameToModel();
		setupEditButton();
	})

	function setupEditButton() {
		var $button = $('div#edit div#editButton');
		$button.on("click.edit", function() {
			if ($button.attr("toggle") == "off")
			{
				var stage = new view.editMode("on", model.commitChanges);
				console.log(stage)
			}
			else if ($button.attr("toggle") == "on")
				new view.editMode("off");
		})
	}

	function sendPathnameToModel() {
		var pathname = location.pathname,
			view_packageRouter = view.packageRouter;

		if (pathname !== "/") //check if we're at index.html, if not send the last id in the url
		{
			//clean up array
			var	arr = pathname.split('/'),
			paths = arr.splice(1,arr.length); //remove blank array item
			
			if (pathname[pathname.length-1] == "/")
				paths.pop(); //remove blank array item

			model.loadModel(paths, view_packageRouter) //send the location data to the model
		}
		else //if index.html was directly requested
		{
			var path = ["home"];
			model.loadModel(path, view_packageRouter)
		}
	}



})