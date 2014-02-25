define(function() {
	
	var Model = {}

	function requestModel(paths, view_packageRouter) {

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				// console.log(response)
				
				var model = renderModel(response);
				view_packageRouter(model) //send the now cached Model to the view
			}

		})
	}

	function commitChanges(blockList, paths) {
		console.log(blockList)
		console.log(paths)

		var	stage = [];

		for (i=0; i<blockList.length;i++)
		{
			var obj = {},
				block = blockList[i];

			obj.id = block.getAttribute('data-id');
			obj.content = block.innerHTML;
			obj.sort = i+1;
			
			stage.push(obj)
		}

		$.ajax({
			url: '/?commitChanges',
			type: "POST",
			dataType: 'json',
			data: JSON.stringify({
				paths : paths,
				stage: stage
			}),
			success: function(response) {
				// console.log(response)
				// $prevBlock.after(response);
				// var element = $prevBlock.next('block').find('seed');

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
			var block =	"<block data-id='"+ids[i]+"'>"+blocks[i]+"</block>";
			stage.push(block)
		}
		Model.parent = response.parentID;
		Model.blocks = stage;
		return {blocks:stage, parentID: response.parentID}
	}



	return {
		requestModel: requestModel,
		commitChanges: commitChanges

	}

})