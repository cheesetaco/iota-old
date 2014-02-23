define(function() {
	
	var Model = {}

	function loadModel(paths, view_packageRouter) {

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				console.log(response)
				
				var model = renderModel(response);
				view_packageRouter(model) //send the now cached Model to the view
			}

		})
	}
	function renderModel(response) {
		var blocks = response.blocks,
			ids = response.ids,
			length = ids.length,

			stage = [];
		for (i=0; i<length; i++)
		{
			var block =	"<block id='"+ids[i]+"'>"+blocks[i]+"</block>";
			stage.push(block)
		}
		Model.parent = response.parentID;
		Model.blocks = stage;
		return {blocks:stage, parentID: response.parentID}
	}
	function commitChanges(parentNodes, content) {

		$.ajax({
			url: '/?commitChanges',
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
		commitChanges: commitChanges

	}

})