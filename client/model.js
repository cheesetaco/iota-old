define(function() {
	
	function sendUpstream(packet, callback) {
		var model;
		if (packet==404)
			model = 404
		else
		{
			model = renderModel(packet)

		}
			callback(model)	
	}

	var Model = {
		parent: "",
		blocks: []
	}


	function requestModel(paths, callback) {

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				// console.log(response)
				var packet = response
				sendUpstream(packet, callback) //send the now cached Model to the view
			}

		})
	}

	function commitChanges(blockList, paths) {
		console.log(blockList)
		// console.log(paths)
		// console.log(Model)

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
		console.log(stage)

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
		console.log(response)
		var blocks = response.blocks,
			ids = response.ids,
			length = ids.length,

			stage = [];
		for (i=0; i<length; i++)
		{
			var block = {
				id: ids[i],
				content: blocks[i]
			}
			Model.blocks.push(block)

			var block =	"<block data-id='"+ids[i]+"'>"+blocks[i]+"</block>";
			stage.push(block)
		}
		Model.parent = response.parentID;
		// Model.blocks = stage;
		return {blocks:stage, parentID: response.parentID}
	}



	return {
		requestModel: requestModel,
		commitChanges: commitChanges

	}

})