/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

function init () {
	custombutton. buttonInit (this);
}

function destroy (reason) {
	custombutton. buttonDestroy (this, reason);
}

this.__defineGetter__ (
	"parameters",
	function () {
		return custombutton. buttonGetParameters (this);
	}
);

this.__defineGetter__ (
	"cbAccelKey",
	function () {
		return custombutton. buttonGetCbAccelKey (this);
	}
);

this.__defineGetter__ (
	"image",
	function () {
		return custombutton. buttonGetImage (this);
	}
);

this.__defineSetter__ (
	"image",
	function (val) {
		if (custombutton. allowedSource (val))
			this. setAttribute ("image", val);
		else
			this. setAttribute ("image", "");
	}
);

this.__defineGetter__ (
	"cbStdIcon",
	function () {
		return this. getAttribute ("cb-stdicon") || "";
	}
);

this.__defineSetter__ (
	"cbStdIcon",
	function (val) {
		this. setAttribute ("cb-stdicon", val);
		return val;
	}
);

this.__defineGetter__ (
	"Help",
	function () {
		return custombutton. buttonGetHelp (this);
	}
);

this.__defineSetter__ (
	"Help",
	function (val) {
		this. setAttribute ("Help", val);
	}
);

this.__defineGetter__ (
	"cbMode",
	function () {
		return custombutton. buttonGetCbMode (this);
	}
);

function setText (doc, nodeName, text, make_CDATASection) {
	custombutton. buttonSetText (doc, nodeName, text, make_CDATASection);
}

this.__defineGetter__ (
	"URI",
	function () {
		return custombutton. buttonGetURI (this);
	}
);

var _name = "";

this.__defineGetter__ (
	"name",
	function () {
		if (this. hasAttribute ("cb-name"))
			return this. getAttribute ("cb-name");
		else
			return this. _name;
	}
);

this.__defineSetter__ (
	"name",
	function (val) {
		if (!val)
			return;
		if (!this. hasAttribute ("label") ||
			!this. getAttribute ("label"))
			this. setAttribute ("label", val);
		this. _name = val;
		this. setAttribute ("cb-name", val);
	}
);

var _cbCommand = null;
var _initPhase = false;

this.__defineGetter__ (
	"cbCommand",
	function () {
		return this. getAttribute ("cb-oncommand") || "";
	}
);

this.__defineSetter__ (
	"cbCommand",
	function (val) {}
);

var _cbInitCode = null;

this.__defineGetter__ (
	"cbInitCode",
	function () {
		return this. getAttribute ("cb-init") || "";
	}
);

this.__defineSetter__ (
	"cbInitCode",
	function (val) {
		if (this. hasAttribute ("initialized"))
			this. removeAttribute ("initialized");
	}
);

function cbExecuteCode () {
	custombutton. buttonCommand ({}, this);
}

var _ctxtObj = false;
var _handlers = [];
var _destructors = [];
