define(function() {
	var globals = {
		$editButton : $('div#edit div#editButton'),
		$contentContainer : $('div#content'),
		$commitButton : $('div#edit div#commitChanges')
	}

	function packageRouter(model) {
		if (model==404)
			console.log('wrongobongos')
		else
			renderModel(model)
	}
	function renderModel(model) {
		globals.$contentContainer.append(model.blocks);

		armSeedHandlers(true);
	}
	function armSeedHandlers(bool) {
		// var bool = typeof bool !== undefined ? bool : true,
		var	$seed = $('seed');

		if (bool == true)
		{
			$seed.on('click.seed', function(event) {
				var	pathTree = getPathTree(),
					pathSeed = $(this).attr('name');

				if (pathTree !== "/")
					location.pathname = pathTree +"/"+ pathSeed;
				else
					location.pathname = pathSeed;
			})

		}
		else if (bool = "false")
			$seed.unbind('click.seed')

	}

	function getPathTree() {
		var pathTree = location.pathname;

		var	arr = pathTree.split('/'),
			pathTree = arr.splice(1,arr.length); //remove first
		
		if (pathTree[pathTree.length-1] == "") // if location had a trailing "/"
			pathTree.pop(); 

		return pathTree
	}

	return {
		packageRouter	: packageRouter,
		armSeedHandlers	: armSeedHandlers,
		globals 		: globals,
		getPathTree 	: getPathTree
	}
})





