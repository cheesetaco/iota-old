define(function() {
	function renderModel(model) {
		var objectSpace = [];

		for (i=0;i<model.length;i++)
		{
			var content = model[i].content,
				id = model[i].id,
				template = "<seed id='"+ id +"'>"+ content +"</seed>";

			objectSpace.push(template);
		}
		// console.log(objectSpace)
		var parent = $('div#content');
		parent.children().remove()
		parent.append(objectSpace)
	}


	return {
		renderModel: renderModel
	}
})