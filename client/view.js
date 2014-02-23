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

		setSeedHandlers();
	}
	function setSeedHandlers(elements) {
		var $seed = elements ? elements : $('seed'); //refresh select seeds else all

		$seed.on('click.seed', function(event) {
			var	pathTree = getPathTree(),
				pathSeed = $(this).attr('name');

			if (pathTree !== "/")
				location.pathname = pathTree +"/"+ pathSeed;
			else
				location.pathname = pathSeed;
		})
	}
	function unsetSeedHandlers() {
		$('seed').unbind('click.seed')
	}

	function editMode(mode, model_commitChanges) {
		return this.init(mode, model_commitChanges)
	}
	editMode.prototype = {
		init: function(mode, model_commitChanges) 
		{
			if (mode == "on")
			{
				unsetSeedHandlers();

				globals.$editButton.attr('toggle', 'on')
				globals.$editButton.css('background-color', 'yellow')
				globals.$contentContainer.attr('contenteditable', 'true');

				this.startupTextEditor();
				var stage = this.armCommitButton(model_commitChanges);
				return stage
			}
			else if (mode == "off")
			{
				setSeedHandlers();

				globals.$editButton.attr('toggle', 'off')
				globals.$editButton.css('background-color', 'green')	
				globals.$contentContainer.removeAttr('contenteditable');

				this.shutdownTextEditor();
				this.disarmCommitButtion();
			}
		},
		startupTextEditor: function() 
		{
			globals.$contentContainer.on("keydown.enter", function(e){
				if (e.which == 13) {
					e.preventDefault();
					
					var	block = document.createElement("block"),
						range = document.createRange(),
						selection = window.getSelection(),
						previousBlock = selection.anchorNode.parentElement;
						
					range.setStartAfter(previousBlock, 0);
					
					block.innerHTML = '&#8203';
					range.insertNode(block)
					range.collapse(false) // send cursor to end of selection
					
					selection.removeAllRanges();
					selection.addRange(range);
				}
			});
		},
		shutdownTextEditor: function() 
		{
			globals.$contentContainer.off("keydown.enter")
		},
		armCommitButton: function(model_commitChanges) 
		{
			globals.$commitButton.on('click.commit', function() {

				var stage = globals.$contentContainer.children('block')
				console.log(stage)
				return stage
			})
		},
		disarmCommitButtion: function() 
		{
			globals.$commitButton.off('click.commit')
		}
	}

	function getPathTree() {
		var pathTree = location.pathname;

		if (pathTree[pathTree.length-1] == "/") //if theres a "/" at the end of the url
			pathTree = pathTree.slice(0, -1);

		return pathTree
	}

	return {
		packageRouter: packageRouter,
		editMode:editMode
	}
})





