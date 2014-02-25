require([window.location.origin+'/client/model.js', window.location.origin+'/client/view.js'], function(model, view) {

//check the url location.pathname and send data to the database (from model.js)
	"use strict"

	$(document).ready(function() 
	{
		sendPathnameToModel();
		setupEditButton();
	})

	function setupEditButton() {
		var $button = $('div#edit div#editButton');
		$button.on("click.edit", function() {
			if ($button.attr("toggle") == "off")
			{
				new editMode("on");
			}
			else if ($button.attr("toggle") == "on")
				new editMode("off");
		})
	}

	function sendPathnameToModel() {
		var pathname = location.pathname,
			view_packageRouter = view.packageRouter;

		if (pathname !== "/") //check if we're at index.html, if not send the last id in the url
		{
			//clean up array
			var	arr = pathname.split('/'),
				paths = arr.splice(1,arr.length); //remove blank array item
			
			if (pathname[pathname.length-1] == "/")
				paths.pop(); //remove blank array item

			model.requestModel(paths, view_packageRouter) //send the location data to the model
		}
		else //if index.html was directly requested
		{
			var path = ["home"];
			model.requestModel(path, view_packageRouter)
		}
	}

	function editMode(mode) {
		return this.init(mode)
	}
	editMode.prototype = {
		init: function(mode) 
		{
			if (mode == "on")
			{
				view.armSeedHandlers();

				view.globals.$editButton.attr('toggle', 'on')
				view.globals.$editButton.css('background-color', 'yellow')
				view.globals.$contentContainer.attr('contenteditable', 'true');

				this.startupTextEditor();

				this.armCommitButton();
			}
			else if (mode == "off")
			{
				view.armSeedHandlers(false);

				view.globals.$editButton.attr('toggle', 'off')
				view.globals.$editButton.css('background-color', 'green')	
				view.globals.$contentContainer.removeAttr('contenteditable');

				this.shutdownTextEditor();
				this.disarmCommitButtion();
			}
		},
		startupTextEditor: function() 
		{
			var that = this;
			view.globals.$contentContainer.on("keydown.enter", function(e){
				//handle enter key
				if (e.which == 13) {
					e.preventDefault();
					that.newlineEnter();
				}
			});
		},
		shutdownTextEditor: function() 
		{
			view.globals.$contentContainer.off("keydown.enter")
		},
		armCommitButton: function() 
		{
			view.globals.$commitButton.on('click.commit', function() {
				var blockList = view.globals.$contentContainer.children('block'),
					paths = view.getPathTree();

				model.commitChanges(blockList, paths)
			})
		},
		disarmCommitButtion: function() 
		{
			view.globals.$commitButton.off('click.commit')
		},
		newlineEnter: function()
		{
			var block = document.createElement("block"),
				range = document.createRange(),
				userSelection = window.getSelection(),
				selectionStart = userSelection.baseOffset,
				selectionStartNode = userSelection.baseNode;
				

			//blinking cursor cases
			if (selectionStartNode === userSelection.extentNode
				&& selectionStart === userSelection.extentOffset)
			{
				caretCases()
			}

			function caretCases() {

				var cursorPosition = selectionStart,
						cursorNode = selectionStartNode,
						nodeEndPosition = cursorNode.length;

				//modify selection: select all text to the right of user caret						
				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, nodeEndPosition)

				//cursor is at the beginning of a paragraph
				if (cursorPosition == 0)
				{
					var documentFragment = '<br>';	
					// move selected content into block						
					block.innerHTML = documentFragment;

					//
					if (cursorNode.innerHTML == '<br>')
						var selectionNode = cursorNode;
					else
						var selectionNode = cursorNode.parentNode;

					$(selectionNode).before(block)


					//recalibrate range to include the new block
					range.setEnd(cursorNode, cursorPosition);					
				}
				else
				{
					var selectionLength = range.endOffset - range.startOffset
				//cursor is at the end of a paragraph
					if (selectionLength == 0)
					{	
						var documentFragment = '<br>';
					}
				//cursor is in middle of paragraph
					else
					{	
						var documentFragment = range.extractContents(),
							documentFragment = documentFragment.textContent;
					}
					// move selected content into block						
					block.innerHTML = documentFragment;

					//append new block
					var selectionNode = cursorNode.parentNode;
					$(selectionNode).after(block)

					//recalibrate range to include the new block
					range.setEnd(cursorNode.parentNode.nextSibling, 0);	
				}

				//reposition caret based on the new range
				range.collapse(false) //send caret to end of range
				userSelection.removeAllRanges()
				userSelection.addRange(range) //select the range
			}
		}
	}

})