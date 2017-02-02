/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var cbPromptDialog = {
	type: "",
	valueAttr: "",
	itemName: "",
	itemIndex: 0,
	groupCounter: -1,

	getParameterByName: function (name)	{
		var parametersMap = {
			"param": 0,
			"array": 1,
			"title": 2,
			"label": 3,
			"head": 4,
			"description": 5,
			"acceptlabel": 6,
			"cancellabel": 7,
			"helplabel": 8,
			"help": 9,
			"disclosurelabel": 10,
			"disclosure": 11
		};
		return window. arguments [parametersMap [name]];
	},

	onAccept: function () {
		var groups = document. getElementsByTagName ("groupbox");
		var param = this. getParameterByName ("param");
		param. out = {
			chosen: [],
		};
		var caption, items, ci, to, group, groupLabel, items;
		for (var i = 0; i < groups. length; i++) {
			group = groups [i];
			caption = group. getElementsByTagName ("caption") [0];
			groupLabel = caption. getAttribute ("label");
			var items = group. getElementsByAttribute (this. valueAttr, "true");
			for (var j = 0; j < items. length; j++)	{
				ci = items [j];
				to = {};
				to ["label"] = ci. getAttribute ("label");
				to [this. valueAttr] = ci [this. valueAttr];
				to ["group"] = groupLabel;
				to ["index"] = ci. getAttribute ("value");
				param. out. chosen. push (to);
			}
		}
		param. out ["length"] = param. out. chosen. length;
		return true;
	},

	onCancel: function () {
		return true;
	},

	alert: function (msg) {
		var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
		var title = this. getParameterByName ("title");
		ps. alert (window, title, msg);
	},

	onDisclosure: function () {
		this. alert (this. getParameterByName ("disclosure"));
	},

	onHelp: function () {
		this. alert (this. getParameterByName ("help"));
	},

	init: function () {
		var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
		var url = ios. newURI (document. documentURI, null, null);
		url = url. QueryInterface (Components. interfaces. nsIURL);
		var q = url. query || "";
		var dlgType = q. match (/type=(\w*)/);
		dlgType = dlgType? dlgType [1]: "";
		if (!dlgType || ((dlgType != "checkbox") && (dlgType != "radiobox"))) {
			window. close ();
			return;
		}
		this. type = dlgType;
		if (this. type == "checkbox") {
			this. valueAttr = "checked";
			this. itemName = "checkbox";
		} else {
			this. valueAttr = "selected";
			this. itemName = "radio";
		}
		document. title = this. getParameterByName ("title");
		this. makeButtons ();
		this. makeHeader ();
		this. makeDialog ();
	},

	destroy: function () {},

	makeGroup: function (index)	{
		this. groupCounter++;
		var group = document. createElement ("groupbox");
		var caption = document. createElement ("caption");
		var captionLabel = this. getParameterByName ("label");
		if (typeof (captionLabel) == "string")
			caption. setAttribute ("label", captionLabel);
		else
			caption. setAttribute ("label", captionLabel [index]);
		group. appendChild (caption);
		document. documentElement. appendChild (group);
		if (this. type == "radiobox") {
			var radiogroup = document. createElement ("radiogroup");
			group. appendChild (radiogroup);
			group = radiogroup;
		}
		return group;
	},

	makeItem: function (label, value) {
		var item = document. createElement (this. itemName);
		item. setAttribute ("label", label);
		if (value)
			item. setAttribute (this. valueAttr, value);
		item. setAttribute ("value", this. groupCounter + this. itemIndex++);
		return item;
	},

	makeDialog: function () {
		var index = 0;
		var group = this. makeGroup (index);
		var arr = this. getParameterByName ("array");
		var ce, label, value;
		for (var i = 0; i < arr. length; i++) {
			ce = arr [i];
			label = ce [0];
			if (typeof (label) == "undefined") {
				index++;
				group = this. makeGroup (index);
				continue;
			}
			value = ce [1] || false;
			group. appendChild (this. makeItem (label, value));
		}
	},

	makeButton: function (button, label) {
		if (!label)
			button. setAttribute ("hidden", "true");
		else
			button. setAttribute ("label", label);
	},

	makeButtons: function () {
		var dialog = document. documentElement;
		var acceptButton = dialog. getButton ("accept");
		var cancelButton = dialog. getButton ("cancel");
		var disclosureButton = dialog. getButton ("disclosure");
		var helpButton = dialog. getButton ("help");
		var extra1Button = dialog. getButton ("extra1");
		var extra2Button = dialog. getButton ("extra2");
		this. makeButton (acceptButton, this. getParameterByName ("acceptlabel"));
		this. makeButton (cancelButton, this. getParameterByName ("cancellabel"));
		this. makeButton (helpButton, this. getParameterByName ("helplabel"));
		this. makeButton (disclosureButton, this. getParameterByName ("disclosurelabel"));
	},

	makeHeader: function ()	{
		var hdr = document. getElementById ("dialogheader");
		hdr. setAttribute ("title", this. getParameterByName ("head"));
		hdr. setAttribute ("description", this. getParameterByName ("description"));
	}
};
