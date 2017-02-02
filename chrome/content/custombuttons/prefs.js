/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

function Prefs () {}
Prefs. prototype =	{
	_ps: null,
	get ps () {
		if (!this. _ps)	{
			this. _ps = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
			this. _ps = this. _ps. QueryInterface (Components. interfaces. nsIPrefBranch);
		}
		return this. _ps;
	},

	cbs: Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */]. getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */),

	handleCheckboxes: function (mode) {
		var setCheckboxesFlag = (mode || (mode == 0));
		var cbks = document. getElementsByTagName ("checkbox");
		var mask, num, result = 0;
		for (var i = 0; i < cbks. length; i++) {
			num = cbks [i]. id. match (/modebit(\d+)$/);
			if (!num)
				continue;
			mask = 1 << num [1];
			if (setCheckboxesFlag)
				cbks [i]. checked = ((mode & mask) == mask);
			else
				result |= cbks [i]. checked? mask: 0;
		}
		return result;
	},

	removeAttribute: function (oElement, sAttributeName) {
		if (oElement. hasAttribute (sAttributeName))
			oElement. removeAttribute (sAttributeName);
	},

	getTopLevelWindow: function () {
		var res;
		try	{
			res = window. QueryInterface (Components. interfaces. nsIInterfaceRequestor).
				getInterface (Components. interfaces. nsIWebNavigation).
				QueryInterface (Components. interfaces. nsIDocShellTreeItem).
				rootTreeItem. QueryInterface (Components. interfaces. nsIInterfaceRequestor).
				getInterface (Components. interfaces. nsIDOMWindow);
		} catch (e) {}
		return res;
	},

	sizeWindowToContent: function (forced) {
		if (window != this. getTopLevelWindow ()) // the preferences dialog is opened in some other window
			return;
		var oDialog = document. getElementById ("custombuttonsPrefsDialog");
		if (oDialog. hasAttribute ("width"))
			this. removeAttribute (oDialog, "width");
		if (oDialog. hasAttribute ("height"))
			this. removeAttribute (oDialog, "height");
		window. sizeToContent ();
	},

	onLoad: function ()	{
		var mode = this. cbs. mode;
		this. handleCheckboxes (mode);
		this. sizeWindowToContent (true);
	},

	onAccept: function () {
		window. removeEventListener ("command", this, false);
		var mode = this. handleCheckboxes (null);
		this. cbs. mode = mode;
		return true;
	},

	onCancel: function () {
		window. removeEventListener ("command", this, false);
		return true;
	}
};

function TBPrefs () {}
TBPrefs. prototype = {
	_checkbox: null,
	get checkbox ()	{
		if (!this. _checkbox)
			this. _checkbox = document. getElementById ("modebit7");
		return this. _checkbox;
	},

	sizeWindowToContent: function (forced) {
		this. __super. prototype. sizeWindowToContent. apply (this, []);
		if (forced)
			setTimeout (window. sizeToContent, 0);
	},

	onLoad: function ()	{
		this. __super. prototype. onLoad. apply (this, []);
		this. checkbox. removeAttribute ("hidden"); // checkbox visible only in Thunderbird
		return true;
	}
};
TBPrefs. prototype. __proto__ = Prefs. prototype; TBPrefs. prototype. __super = Prefs;

var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
var cbPrefs;
if (["Thunderbird", "SeaMonkey"]. indexOf (info. name) != -1)
	cbPrefs = new TBPrefs ();
else
	cbPrefs = new Prefs ();
