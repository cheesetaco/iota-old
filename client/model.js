define(function() {

	// cached model of the returned database data
	var Model = [];
	
	function loadModel(pid, view_renderModel) {

		$.ajax({
			url: '/getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({pid: pid}),//send as a Buffer? so node can read it
			success: function(response) {
				for (i=0; i<response.length; i++) 
				{
					Model[i] = response[i];

				};
				view_renderModel(Model) //send the now cached Model to the view
			}

		})
	}

	return {
		loadModel: loadModel,
		Model: Model

	}
})