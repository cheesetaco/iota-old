define(function() {
	
	function loadModel(paths, view_renderModel) {

		$.ajax({
			url: '/getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({paths: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				view_renderModel(response) //send the now cached Model to the view
			}

		})
	}

	return {
		loadModel: loadModel

	}
})