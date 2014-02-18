define(function() {
	var globals = {
		$button : $('div#edit'),
		$contentContainer : $('div#content')
	}

	function renderModel(model) {
		console.log(model);

		$('div#content').append(model);

		setSeedHandlers();
	}
	function setSeedHandlers(elements) {
		var $seed = elements ? elements : $('seed');

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

	function editModeOn(model_commitBlock) {
		unsetSeedHandlers();
		setEffects();
		setFormHandler(model_commitBlock);
	}
	function editModeOff() {
		setSeedHandlers();
		unsetEffects();
		unsetFormHandler();
	}

		function closeForm() {
			var $form = $('form#addBlock');
			$form.empty();
			$form.remove();

		}
		function setFormHandler(model_commitBlock) {
			var clickedAlready = false;

			globals.$contentContainer.on('click.addForm', 'block', function() 
			{
				var $prevBlock = $(this);

				if (clickedAlready == false) {
					var 
						$form = $('<form id="addBlock"><input type="text"></input><div class="close-form">x</form>'),
						newSort = $prevBlock.prevAll('block').length+2,
						parentPath = getPathTree(),
						parentNodes = parentPath.split('/'),
						parentNodes = parentNodes.splice(1,parentNodes.length);

					$form
						.insertAfter($prevBlock)
						.on('submit', function(event) {
							var input = $(this).find('input'),
								content = $(input).attr('value');
							
							event.preventDefault()

							closeForm();

							model_commitBlock(parentNodes, content, newSort, $prevBlock);
						})

					clickedAlready = true;
				}
			})

		}
		function unsetFormHandler() {
			globals.$contentContainer.unbind('click.addForm');

		}
		function setEffects() {
			globals.$button.attr('toggle', 'on')
			globals.$button.css('background-color', 'yellow')
			globals.$contentContainer.on('mouseover', 'block', function() {
				$(this).css('border-bottom', '1px solid green')
			})
			globals.$contentContainer.on('mouseout', 'block', function() {
				$(this).css('border-bottom', 'none')
			})
		}
		function unsetEffects() {
			globals.$button.attr('toggle', 'off')
			globals.$button.css('background-color', 'green')
			globals.$contentContainer.unbind('mouseover')
			globals.$contentContainer.unbind('mouseout')
		}


	function getPathTree() {
		var pathTree = location.pathname;

		if (pathTree[pathTree.length-1] == "/") //if theres a "/" at the end of the url
			pathTree = pathTree.slice(0, -1);

		return pathTree
	}

	return {
		renderModel: renderModel,
		editModeOn:editModeOn,
		editModeOff:editModeOff
	}
})





