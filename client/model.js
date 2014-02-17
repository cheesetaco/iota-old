define(function() {
	
	function loadModel(paths, view_renderModel) {

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				view_renderModel(response) //send the now cached Model to the view
			}

		})
	}
	function commitBlock(parentNodes, content, sort, $prevBlock) {

		$.ajax({
			url: '/?commitBlock',
			type: "POST",
			dataType: 'json',
			data: JSON.stringify({
				parentNodes: parentNodes, 
				content:content, 
				sort:sort
			}),
			success: function(response) {
				console.log(response)
				// $prevBlock.after(response);
				// var element = $prevBlock.next('block').find('seed');

			}
		})
	}
	return {
		loadModel: loadModel,
		commitBlock: commitBlock

	}

})