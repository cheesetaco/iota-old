define(function() {
	function renderModel(model) {
		console.log(model);

		$('div#content').append(model);

		$('seed').on('click', function(event) {
			var pathTree = location.pathname,
				pathSeed = $(this).attr('name');
			
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