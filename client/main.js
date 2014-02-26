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
			var paths = view.getPathTree()

			model.requestModel(paths, view_packageRouter) //send the location data to the model
		}
		else //root location
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

				//arm commit button
				view.globals.$commitButton.on('click.commit', function() {
				var blockList = view.globals.$contentContainer.children('block'),
					paths = view.getPathTree();

				model.commitChanges(blockList, paths)
			})

			}
			else if (mode == "off")
			{
				view.armSeedHandlers("false");

				view.globals.$editButton.attr('toggle', 'off')
				view.globals.$editButton.css('background-color', 'green')	
				view.globals.$contentContainer.removeAttr('contenteditable');

				this.shutdownTextEditor();
				//disarm commitButton
				view.globals.$commitButton.off('click.commit')

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
		newlineEnter: function()
		{
			var block = {},
				range = document.createRange(),
				userSelection = window.getSelection(),
				selectionStart = userSelection.baseOffset,
				selectionEnd = userSelection.extentOffset,
				selectionStartNode = userSelection.baseNode;
				

			//blinking cursor cases
			if (selectionStartNode === userSelection.extentNode
				&& selectionStart === selectionEnd)
			{
				var cursorPosition = selectionStart,
					cursorNode = selectionStartNode,
					nodeEndPosition = cursorNode.length;
				
				caretCases()
			}

			function caretCases() {

				//modify selection: select all text to the right of user caret						
				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, nodeEndPosition)

				///cursor is at the beginning of a paragraph
				if (cursorPosition == 0)
				{
					//create block
					var documentFragment = '<br>';
					block.outerHTML = "<block>"+documentFragment+"</block>";

					//append new block
					if (cursorNode.innerHTML == '<br>') // 
						var selectionNode = cursorNode;
					else
						var selectionNode = cursorNode.parentNode;
					$(selectionNode).before(block.outerHTML)

					//recalibrate range to include the new block
					range.setEnd(cursorNode, cursorPosition);
				}
				else
				{
					//create block
				/// cursor is at the end of a paragraph
					var selectionLength = range.endOffset - range.startOffset
					if (selectionLength == 0) 
						var documentFragment = '<br>';
				/// cursor is in middle of paragraph
					else 
						var documentFragment = cutDocumentFragment()		
					
					//catch nbsp
					if (documentFragment.charAt(0) == " ")
						documentFragment = "&nbsp;" + documentFragment.substr(1)

					block.outerHTML = "<block>"+documentFragment+"</block>";
					//append new block
					var selectionNode = cursorNode.parentNode;
					$(selectionNode).after(block.outerHTML)

					//recalibrate range to include the new block
					range.setEnd(cursorNode.parentNode.nextSibling, 0);	
				}

				//reposition caret based on the new range
				range.collapse(false) //send caret to end of range
				userSelection.removeAllRanges()
				userSelection.addRange(range) //select the range
			}

			function cutDocumentFragment() {

				//grab the remainder of the paragraph following the cursor
				var	documentFragment = cursorNode.textContent.slice( cursorPosition, nodeEndPosition ),
					startSlice 	= 0,
					endSlice 	= cursorPosition;
				cursorNode.textContent = cursorNode.textContent.slice(0,endSlice)

				//is there a sibling?
				var nextNode;
				if (cursorNode.parentNode.nodeName == 'BLOCK') 
				{	
					if (cursorNode.nextSibling !== null)
						var nextNode = cursorNode.nextSibling
				}
				else if (cursorNode.parentNode.nodeName == 'SEED')
				{	
					if (cursorNode.parentNode.nextSibling !== null)
						var nextNode = cursorNode.parentNode.nextSibling
				}

				//go get the siblings
				if (nextNode !== undefined)
					var documentFragment = crawlSiblings(nextNode, documentFragment)

				return documentFragment
			}

			function crawlSiblings(focusNode, documentFragment)
			{
				var workingFragment = documentFragment
				var hasSibling = true;

				while(hasSibling)
				{
					hasSibling = false;

					//grab the html from the sibling, also remove those contents from the previous paragraph
					if (focusNode.nodeName == "SEED")
					{
						workingFragment += focusNode.outerHTML
						focusNode.parentNode.removeChild(focusNode) 
					}
					else if (focusNode.nodeName == "#text")
					{
						workingFragment += focusNode.textContent
						focusNode.parentNode.removeChild(focusNode)						
					}

					//is there another sibling?
					if (focusNode.nextSibling)
					{
						focusNode = focusNode.nextSibling;
						hasSibling = true
					}
				}

				//send the final contents back to be injected
				return workingFragment;
			}

		}
	}

})