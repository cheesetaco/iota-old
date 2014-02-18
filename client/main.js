require([window.location.origin+'/client/model.js', window.location.origin+'/client/view.js'], function(model, view) {

//check the url location.pathname and send data to the database (from model.js)

	$(document).ready(function() 
	{
		sendPathnameToModel();
		setupEditButton();
	})

	function setupEditButton() {
		var $button = $('div#edit');
		$button.on("click.edit", function() {
			if ($button.attr("toggle") == "off")
			{
				var commitBlock = model.commitBlock;	
				view.editModeOn(commitBlock);
			}
			else if ($button.attr("toggle") == "on")
				view.editModeOff();
		})
	}

	function sendPathnameToModel() {
		var pathname = location.pathname,
			view_renderModel = view.renderModel;

		if (pathname !== "/") //check if we're at index.html, if not send the last id in the url
		{
			var	arr = pathname.split('/'),
			paths = arr.splice(1,arr.length);
			
			if (pathname[pathname.length-1] == "/") // if theres a "/" at the end of the url
				paths.pop();

			model.loadModel(paths, view_renderModel) //send the location data to the model
		}
		else //if index.html was directly requested
		{
			var path = ["home"];
			model.loadModel(path, view_renderModel)
		}
	}



})