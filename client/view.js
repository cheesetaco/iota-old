define(function() {
	function renderModel(model) {
		console.log(model);

		$('div#content').append(model);

		$('seed').on('click', function(event) {
			var pathTree = location.pathname,
				pathSeed = $(this).attr('name');
			
			if (pathTree[pathTree.length-1] == "/") //if theres a "/" at the end of the url
				pathTree = pathTree.slice(0, -1);

			if (pathTree !== "/")
				location.pathname = pathTree +"/"+ pathSeed;
			else
				location.pathname = pathSeed;
		})
	}


	return {
		renderModel: renderModel
	}
})