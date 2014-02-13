require([window.location.origin+'/client/model.js', window.location.origin+'/client/view.js'], function(model, view) {

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
				paths = arr.splice(1,arr.length);
				// pid = arr.pop();
			
			console.log(paths)

			//send the location data to the model
			model.loadModel(paths, view_renderModel)
		}
		else //if index.html was directly requested
		{
			var path = ["home"];
			model.loadModel(path, view_renderModel)
		}

		
	})

})