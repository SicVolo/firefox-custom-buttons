/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var repprompt = {
	editor: null,

	init: function () {
		if (!window. arguments || !window. arguments [0]) {
			window. close ();
			return;
		}
		this. editor = window. arguments [0];
		sizeToContent ();
		moveToAlertPosition ();
	},

	find: function () {
		if (!this. editor. find (false))
			this. closeDialog ();
		else
			this. editor. wrapSelection ();
	},

	onAccept: function () {
		this. editor. makeReplace ();
		this. find ();
		return false;
	},

	onCancel: function () {
		this. closeDialog ();
		return true;
	},

	onSkip: function () {
		if (!this. editor. skipReplace ())
			this. closeDialog ();
		else
			this. editor. wrapSelection ();
	},

	onReplaceAll: function () {
		this. editor. replaceAll ();
		this. closeDialog ();
	},

	destroy: function () {
		if (this. editor) {
			this. editor. stopReplace ();
			this. editor = null;
		}
	},

	closeDialog: function () {
		this. destroy ();
		window. close ();
	}
};
