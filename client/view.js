define(function() {
	var globals = {
		$editButton : $('div#edit div#editButton'),
		$contentContainer : $('div#content'),
		$commitButton : $('div#edit div#commitChanges')
	}

	function packageRouter(packageType) {
		if (packageType==404)
			console.log('wrongobongos')
		else
			renderModel(packageType)
	}
	function renderModel(model) {
		globals.$contentContainer.append(model.blocks);

		armSeedHandlers();
	}
	function armSeedHandlers(bool) {
		var bool = typeof bool !== undefined ? bool : true,
			$seed = $('seed');
		if (bool = true)
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
		else if (bool = false)
			$seed.unbind('click.seed')

	}

	function getPathTree() {
		var pathTree = location.pathname;

		if (pathTree[pathTree.length-1] == "/") //if theres a "/" at the end of the url
			pathTree = pathTree.slice(0, -1);

		return pathTree
	}

	return {
		packageRouter	: packageRouter,
		armSeedHandlers	: armSeedHandlers,
		globals 		: globals
	}
})





