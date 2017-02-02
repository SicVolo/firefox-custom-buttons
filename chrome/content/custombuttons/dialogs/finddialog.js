/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var FindDialog = {
	init: function () {
		if (!window. arguments || !window. arguments [0]) {
			window. close ();
			return;
		}
		var dlgType = window. arguments [0]. type;
		var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */]. getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */);
		var dlgTitle = cbs. getLocaleString ("finddialogFindTitle");
		if (dlgType == "replace")
			dlgTitle = cbs. getLocaleString ("finddialogReplaceTitle");
		document. title = dlgTitle;
		if (dlgType == "replace") {
			document. getElementById ("replacebox"). removeAttribute ("hidden");
			document. getElementById ("promptreplace"). removeAttribute ("hidden");
		}
		this. setValues ();
		sizeToContent ();
		moveToAlertPosition ();
	},

	setValues: function () {
		var arg = window. arguments [0];
		document. getElementById ("findtext"). value = arg. searchString;
		document. getElementById ("replacetext"). value = arg. replaceText;
		document. getElementById ("casesensitive"). checked = arg. caseSensitive;
		document. getElementById ("promptreplace"). checked = arg. promptReplace;
		var direction = arg. searchBackwards? "backward": "forward";
		document. getElementById ("direction"). value = direction;
	},

	onAccept: function () {
		var arg = window. arguments [0];
		arg. searchString = document. getElementById ("findtext"). value;
		arg. replaceText = document. getElementById ("replacetext"). value;
		arg. caseSensitive = document. getElementById ("casesensitive"). checked;
		arg. promptReplace = document. getElementById ("promptreplace"). checked;
		var direction = document. getElementById ("direction"). value;
		arg. searchBackwards = (direction == "backward");
	}
};
