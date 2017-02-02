/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var EXPORTED_SYMBOLS = ["CustombuttonsButton"];

var Cc = Components. classes;
var Ci = Components. interfaces;
var Cu = Components. utils;

var IO_SERVICE_CID = "@mozilla.org/network/io-service;1";
var DOM_PARSER_CID = "@mozilla.org/xmlextras/domparser;1";
var CHROME_PROTOCOL_HANDLER_CID = "@mozilla.org/network/protocol;1?name=chrome";
var APP_INFO_CID = "@mozilla.org/xre/app-info;1";
var CB_SERVICE_CID = "@xsms.nm.ru/custombuttons/cbservice;1";

var IO_SERVICE_IID = Ci. nsIIOService;
var DOM_PARSER_IID = Ci. nsIDOMParser;
var PROTOCOL_HANDLER_IID = Ci. nsIProtocolHandler;
var XUL_APP_INFO_IID = Ci. nsIXULAppInfo;
var CB_SERVICE_IID = Ci. cbICustomButtonsService;

var CB_ADDON_TYPE = "custombuttons";

Components. utils. import ("resource://gre/modules/AddonManager.jsm");
Components. utils. import ("resource://gre/modules/Services.jsm");
Components. utils. import ("resource://gre/modules/XPCOMUtils.jsm");

var AddonProvider = {
	getOverlayDocument: function (overlayFileName) {
		var overlayDocument = null;
		var ios = Cc [IO_SERVICE_CID]. getService (IO_SERVICE_IID);
		var uri = "resource://custombuttons/" + overlayFileName;
		var cbs = Components. classes [CB_SERVICE_CID]. getService (CB_SERVICE_IID);
		var xulchan = cbs. getChannel (uri);
		var instr = xulchan. open ();
		var dp = Cc [DOM_PARSER_CID]. createInstance (DOM_PARSER_IID);
		try {
			var fakeOverlayURI = ios. newURI ("chrome://custombuttons/content/buttonsoverlay.xul", null, null);
			var chromeProtocolHandler = Cc [CHROME_PROTOCOL_HANDLER_CID]. getService ();
			chromeProtocolHandler = chromeProtocolHandler. QueryInterface (PROTOCOL_HANDLER_IID);
			var fakeOverlayChannel = chromeProtocolHandler. newChannel (fakeOverlayURI);
			try {
				dp. init (fakeOverlayChannel. owner, ios. newURI (uri, null, null), null, null);
			} catch (e) {
				var dp = Cc [DOM_PARSER_CID]. createInstance (DOM_PARSER_IID);
			}
		} catch (e) {}
		overlayDocument = dp. parseFromStream (instr, null, instr. available (), "application/xml");
		return overlayDocument;
	},

	makeButtonLink: function (overlayFileName, paletteId) {
		var res = "custombutton://buttons/";
		var info = Cc [APP_INFO_CID]. getService (XUL_APP_INFO_IID);
		switch (paletteId) {
			case "BrowserToolbarPalette":
				res += info. name; // Firefox, SeaMonkey, Browser
				break;
			case "MailToolbarPalette":
				res += info. name; // Thunderbird, SeaMonkey
				if (("buttonsoverlay.xul" == overlayFileName) &&
					("SeaMonkey" == info. name))
					res += "Mail"; // SeaMonkeyMail
				else if ("mwbuttonsoverlay.xul" == overlayFileName)
					res += "MailWindow"; // ThunderbirdMailWindow, SeaMonkeyMailWindow
				break;
			case "MsgComposeToolbarPalette":
				res += info. name + "ComposeWindow"; // ThunderbirdComposeWindow, SeaMonkeyComposeWindow
				break;
			case "calendarToolbarPalette":
				res += "Sunbird"; // Sunbird, Calendar
				break;
			case "NvuToolbarPalette":
				res += "KompoZer"; // KompoZer
				break;
			default:
				res += "Browser";
				break;
		}
		res += "/";
		return res;
	},

	collectButtonsFromOverlay: function (overlayFileName) {
		var res = [];
		var doc;
		try {
			doc = this. getOverlayDocument (overlayFileName);
		} catch (e) {}
		if (!doc)
			return res;
		var btns = doc. getElementsByTagName ("toolbarbutton");
		var btn, image, btnLink, btnId;
		for (var i = 0; i < btns. length; i++) {
			btnLink = this. makeButtonLink (overlayFileName, btns [i]. parentNode. id);
			btn = new CustombuttonsButton (null);
			btnId = btns [i]. getAttribute ("id");
			btn. id = btnLink + btnId;
			btn. name = btns [i]. getAttribute ("label");
			btn. buttonLink = btnLink + "edit/" + btnId;
			btn. iconURL = "chrome://custombuttons/skin/button.png";
			if (btns [i]. hasAttribute ("cb-stdicon")) {
				btn. iconURL = btns [i]. getAttribute ("cb-stdicon");
			}
			if (btns [i]. hasAttribute ("image")) {
				btn. iconURL = btns [i]. getAttribute ("image");
			}
			res. push (btn);
		}
		return res;
	},

	getAddonsByTypes: function AddonProvider_getAddonsByTypes (aTypes, aCallback) {
		if (aTypes && (aTypes. indexOf (CB_ADDON_TYPE) == -1)) {
			aCallback ([]);
			return;
		}
		var res = [];
		var btns = this. collectButtonsFromOverlay ("buttonsoverlay.xul");
		res = res. concat (btns);
		btns = this. collectButtonsFromOverlay ("mwbuttonsoverlay.xul");
		res = res. concat (btns);
		btns = this. collectButtonsFromOverlay ("mcbuttonsoverlay.xul");
		res = res. concat (btns);
		aCallback (res);
	},

	getAddonByID: function AddonProvider_getAddonByID (aId, aCallback) {
		var res = null;
		if (aId. indexOf ("custombutton://buttons/") == 0) {
			var cbs = Cc [CB_SERVICE_CID]. getService (CB_SERVICE_IID);
			var param = cbs. getButtonParameters (aId);
			param = param. wrappedJSObject;
			if (!param. newButton) {
				res = new CustombuttonsButton (null);
				res. id = aId;
				res. name = param. name;
				res. iconURL = param. image;
			}
		}
		aCallback (res);
	},

	getInstallsByTypes: function (aTypes, aCallback) {
		aCallback ([]);
	}
};

function CustombuttonsButton (aButton) {}
// TODO: implement aboutURL, size, sourceURI
CustombuttonsButton. prototype = {
	id: null,
	type: CB_ADDON_TYPE,
	isCompatible: true,
	blocklistState: 0,
	appDisabled: false,
	scope: AddonManager. SCOPE_PROFILE,
	name: "",
	pendingOperations: AddonManager. PENDING_NONE,
	permissions: AddonManager. PERM_CAN_UNINSTALL,
	operationsRequiringRestart: AddonManager. OP_NEEDS_RESTART_NONE,
	description: null,
	isActive: true,

	_button: null,

	_iconURL: "chrome://custombuttons/skin/button.png",

	get iconURL () {
		return this. _iconURL;
	},

	set iconURL (url) {
		switch (url) {
			case "":
			case "custombuttons-stdicon-1":
				this. _iconURL = "chrome://custombuttons/skin/button.png";
				break;
			case "custombuttons-stdicon-2":
				this. _iconURL = "chrome://custombuttons/skin/stdicons/rbutton.png";
				break;
			case "custombuttons-stdicon-3":
				this. _iconURL = "chrome://custombuttons/skin/stdicons/gbutton.png";
				break;
			case "custombuttons-stdicon-4":
				this. _iconURL = "chrome://custombuttons/skin/stdicons/bbutton.png";
				break;
			default:
				this. _iconURL = url;
				break;
		}
	},

	uninstall: function () {
		var cbs = Cc [CB_SERVICE_CID]. getService (CB_SERVICE_IID);
		cbs. uninstallButton (this. buttonLink);
	}
};

var firstRun = true;
if (firstRun) {
	firstRun = false;
	AddonManagerPrivate. registerProvider (
		/* AddonProvider,
		   [{ id: CB_ADDON_TYPE,
		   name: "Custom Buttons",
		   uiPriority: 3500,
		   viewType: AddonManager. VIEW_TYPE_LIST,
		   flags: AddonManager. TYPE_UI_HIDE_EMPTY }] */
		AddonProvider,
		[{ id: CB_ADDON_TYPE }]
	);
}
