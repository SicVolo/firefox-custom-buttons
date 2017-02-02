/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var cbCustomizeToolbarHandler = {
	templateButton: null,
	palette: null,

	handleEvent: function (event) {
		if (event. type == "load") {
			window. removeEventListener ("load", this, false);
			this. hideTemplateButton ();
		} else if (event. type == "unload") {
			window. removeEventListener ("unload", this, false);
			this. restoreTemplateButton ();
		}
	},

	init: function () {
		var gToolbox;
		try	{
			if ("arguments" in window)
				gToolbox = window. arguments [0];
			else
				gToolbox = window. parent. document. getElementById ("navigator-toolbox");
			var palette = gToolbox. palette;
			this. palette = palette;
			for (var i = 0; i < palette. childNodes. length; i++) {
				if (palette. childNodes [i]. id == "custombuttons-template-button")	{
					this. templateButton = palette. childNodes [i];
					palette. removeChild (palette. childNodes [i]);
					break;
				}
			}
			window. addEventListener ("unload", this, false);
		} catch (e)	{
			window. addEventListener ("load", this, false);
		}
	},

	hideTemplateButton: function ()	{
		var templateButton = document. getElementById ("custombuttons-template-button");
		var templateButtonWrapper = templateButton;
		while (templateButtonWrapper) {
			if (templateButtonWrapper. nodeName == "toolbarpaletteitem")
				break;
			templateButtonWrapper = templateButtonWrapper. parentNode;
		}
		if (templateButtonWrapper)
			templateButtonWrapper. parentNode. removeChild (templateButtonWrapper);
	},

	restoreTemplateButton: function () {
		if (this. templateButton)
			this. palette. appendChild (this. templateButton);
	}
};

cbCustomizeToolbarHandler. init ();
