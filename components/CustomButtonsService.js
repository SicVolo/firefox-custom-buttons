/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

// ***** BEGIN LICENSE BLOCK *****
// Version: MPL 1.1
//
// The contents of this file are subject to the Mozilla Public License Version
// 1.1 (the "License"); you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
// http://www.mozilla.org/MPL/
//
// Software distributed under the License is distributed on an "AS IS" basis,
// WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
// for the specific language governing rights and limitations under the
// License.
//
// Custom Buttons:
// - Gives a possibility to create custom toolbarbuttons.
// - This component is intended to provide common extension's service
//
// Author: Anton Glazatov (c) 2009-2010
//
// ***** END LICENSE BLOCK *****




function backupProfile (phase) {
	var ext, nump, bdp;
	var pbs = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
	pbs = pbs. QueryInterface (Components. interfaces. nsIPrefBranch);
	var ps = pbs. getBranch ("extensions.custombuttons.");
	var profileDir = Components. classes ["@mozilla.org/file/directory_service;1"]. getService (Components. interfaces. nsIProperties). get ("ProfD", Components. interfaces. nsIFile);
	profileDir. append ("custombuttons");
	var backupDir = profileDir. clone ();
	backupDir. append ("backup");
	if (!backupDir. exists ()) {
		try	{
			backupDir. create (Components. interfaces. nsIFile. DIRECTORY_TYPE, (7 << 6) | (5 << 3) | 5 /* 0755 */);
		} catch (e)	{
			var msg = 'Custom Buttons error.]' +
				'[Event: Creating custombuttons backup directory]' +
				'[ ' + e;
			Components. utils. reportError (msg);
			return;
		}
	}
	var num = 2;
	var forceBackup = true;
	var makeFlag = true;
	switch (phase) {
		case "profile-after-change":
			num = 1;
			ext = ".sbk";
			nump = "onSessionStartBackups";
			bdp = "onSessionStartBackupsDirectory";
			forceBackup = false;
			break;
		case "profile-change-teardown":
			num = 1;
			ext = ".sbk2";
			nump = "onSessionEndBackups";
			bdp = "onSessionEndBackupsDirectory";
			makeFlag = false;
			forceBackup = false;
			break;
		case "before-save-button":
			ext = ".bak";
			nump = "backups";
			bdp = "backupsDirectory";
			break;
		case "after-save-button":
			num = 0;
			ext = ".cop";
			nump = "postSaveBackups";
			bdp = "postSaveBackupsDirectory";
			break;
		default:
			return;
	}
	try	{
		num = Math. abs (ps. getIntPref (nump));
		makeFlag = true;
	} catch (e) {}
	try	{
		bdp = ps. getCharPref (bdp);
		var d = Components. classes ["@mozilla.org/file/local;1"]. createInstance (Components. interfaces. nsILocalFile);
		d. initWithPath (bdp);
		if (!d. exists ())
			return;
		if (d. isDirectory ())
			backupDir = d;
		makeFlag = true;
	} catch (e) {}
	if (!makeFlag)
		return;
	makeBackup (profileDir, "buttonsoverlay.xul", backupDir, ext, num, forceBackup);
	makeBackup (profileDir, "mwbuttonsoverlay.xul", backupDir, ext, num, forceBackup);
	makeBackup (profileDir, "mcbuttonsoverlay.xul", backupDir, ext, num, forceBackup);
}

function makeBackup (profileDir, fileName, backupDir, ext, num, forceBackup) {
	var bcnt = Math. abs (num);
	if (bcnt > 32)
		bcnt = 5;
	var f1, f2, fn1, fn2;
	f1 = profileDir. clone ();
	f1. append (fileName);
	if (f1. exists () && !forceBackup) {
		fn2 = fileName + ext;
		f2 = backupDir. clone ();
		f2. append (fn2);
		if (f2. exists () && f2. isFile () && (f2. lastModifiedTime >= f1. lastModifiedTime))
			return;
	}
	for (var i = bcnt; i > 0; i--) {
		fn1 = fileName + i + ext;
		f1 = backupDir. clone ();
		f1. append (fn1);
		fn2 = fileName + (i - 1 || "") + ext;
		f2 = backupDir. clone ();
		f2. append (fn2);
		if (f2. exists () && f2. isFile ())	{
			if (f1. exists () && f2. isFile ())
				f1. remove (false);
			if (!f1. exists ())
				f2. copyTo (backupDir, fn1);
		}
	}
	fn2 = fileName + ext;
	f2 = backupDir. clone ();
	f2. append (fn2);
	f1 = profileDir. clone ();
	f1. append (fileName);
	if (f1. exists () && f1. isFile ())	{
		if (f2. exists () && f2. isFile ())
			f2. remove (false);
		if (!f2. exists ())
			f1. copyTo (backupDir, fn2);
	}
}

function allowedSource (src) {
	var res = true;
	if (src. indexOf ("custombuttons-stdicon") == 0)
		return res;
	var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
	try	{
		var scheme = ios. extractScheme (src);
		var pfs = ios. getProtocolFlags (scheme);
		if (Components. interfaces. nsIProtocolHandler. URI_DOES_NOT_RETURN_DATA) { // Firefox 3
			if (pfs & Components. interfaces. nsIProtocolHandler. URI_DOES_NOT_RETURN_DATA) // Firefox 3
				res = false;
		}
		else if (["http:", "file:", "data:", "resource:", "chrome:", "http", "file", "data", "resource", "chrome"]. indexOf (scheme) == -1) // Firefox 1.5, 2.0
			res = false;
	} catch (e)	{
		res = false; // malformed URI
	}
	return res;
}

function makeSupportsArray () {
	var array = Components. classes ["@mozilla.org/supports-array;1"]. createInstance (Components. interfaces. nsISupportsArray);
	var elt;
	for (var i = 0; i < arguments. length; i++)	{
		elt = Components. classes ["@mozilla.org/supports-string;1"]. createInstance (Components. interfaces. nsISupportsString);
		elt. data = arguments [i];
		array. AppendElement (elt);
	}
	return array;
}

function getParamBlock () {
	return {
		windowId: "",
		id: "",
		name: "",
		image: "",
		code: "",
		initCode: "",
		accelkey: "",
		mode: 0,
		help: "",
		newButton: false,
		updateButton: false
	};
}

function ImageConverter (imageURL, id, topic) {
	this. topic = topic;
	this. id = id;
	if (!allowedSource (imageURL)) {
		var array = makeSupportsArray ("", "");
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. notifyObservers (array, this. topic, this. id);
		return;
	}
	this. imageURL = imageURL;
	var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"]. getService (Components. interfaces. cbICustomButtonsService);
	this. channel = cbs. getChannel (imageURL, Components. interfaces. nsIContentPolicy. TYPE_IMAGE);
	this. channel. notificationCallbacks = this;
	this. channel. asyncOpen (this, null);
}
ImageConverter. prototype =	{
	topic: "",
	id: "",
	imageURL: "",
	countRead: null,
	channel: null,
	bytes: [],
	stream: null,
	data: "",

	// nsISupports
	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. nsISupports) &&
			!iid. equals (Components. interfaces. nsIInterfaceRequestor) &&
			!iid. equals (Components. interfaces. nsIRequestObserver) &&
			!iid. equals (Components. interfaces. nsIStreamListener) &&
			!iid. equals (Components. interfaces. nsIProgressEventSink)) {
			throw Components. results. NS_ERROR_NO_INTERFACE;
		}
		return this;
	},

	// nsIInterfaceRequestor
	getInterface: function (iid) {
		return this. QueryInterface (iid);
	},

	// nsIRequestObserver
	onStartRequest: function (aRequest, aContext) {
		this. stream = Components. classes ["@mozilla.org/binaryinputstream;1"]. createInstance (Components. interfaces. nsIBinaryInputStream);
	},

	onStopRequest: function (aRequest, aContext, aStatusCode) {
		var array = makeSupportsArray (this. channel. contentType, String. fromCharCode. apply (null, this. bytes));
		this. channel = null;
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. notifyObservers (array, this. topic, this. id);
	},

	// nsIStreamListener
	onDataAvailable: function (aRequest, aContext, aInputStream, aOffset, aCount) {
		this. stream. setInputStream (aInputStream);
		var chunk = this. stream. readByteArray (aCount);
		this. bytes = this. bytes. concat (chunk);
	},

	// nsIProgressEventSink
	onProgress: function (aRequest, aContext, progress, progressMax) {},
	onStatus: function (aRequest, aContext, status, statusArg) {}
};

function Overlay (path, fileName) {
	this. path = path;
	this. fileName = fileName;
}
Overlay. prototype = {
	path: "",
	fileName: "",
	_overlayDocument: null,

	get overlayDocument () {
		if (!this. _overlayDocument) {
			var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
			var uri = this. path + this. fileName;
			var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"]. getService (Components. interfaces. cbICustomButtonsService);
			var xulchan = cbs. getChannel (uri);
			var instr = xulchan. open ();
			var dp = Components. classes ["@mozilla.org/xmlextras/domparser;1"]. createInstance (Components. interfaces. nsIDOMParser);
			try	{
				var fakeOverlayURI = ios. newURI ("chrome://custombuttons/content/buttonsoverlay.xul", null, null);
				var chromeProtocolHandler = Components. classes ["@mozilla.org/network/protocol;1?name=chrome"]. getService ();
				chromeProtocolHandler = chromeProtocolHandler. QueryInterface (Components. interfaces. nsIProtocolHandler);
				var fakeOverlayChannel = chromeProtocolHandler. newChannel (fakeOverlayURI);
				try	{
					dp. init (fakeOverlayChannel. owner, ios. newURI (uri, null, null), null, null);
				} catch (e)	{
					dp = Components. classes ["@mozilla.org/xmlextras/domparser;1"]. createInstance (Components. interfaces. nsIDOMParser);
				}
			} catch (e) {}
			this. _overlayDocument = dp. parseFromStream (instr, null, instr. available (), "application/xml");
		}
		return this. _overlayDocument;
	},

	getNumber: function (id) {
		if (id. indexOf ("custombuttons-button") != -1)
			return id. substring ("custombuttons-button". length);
		return "";
	},

	minButtonNumber: function (paletteId) {
		var palette = this. overlayDocument. getElementById (paletteId);
		var bt = new Object ();
		var buts = palette. childNodes;
		var butscount = buts. length;
		var n, id;
		for (var j = 0; j < butscount; j++)	{
			if (buts [j]. nodeName == "#text")
				continue;
			id = buts [j]. getAttribute ("id");
			n = this. getNumber (id);
			if (n)
				bt [n] = true;
		}
		var z = 0;
		while (typeof bt [z] != "undefined")
			z++;
		return z;
	},

	saveOverlayToProfile: function () {
		var serializer = Components. classes ["@mozilla.org/xmlextras/xmlserializer;1"]. createInstance (Components. interfaces. nsIDOMSerializer);
		var data = serializer. serializeToString (this. overlayDocument);

		//beautifull output
		try	{
			var oldPrettyPrinting = XML. prettyPrinting;
			XML. prettyPrinting = true;
			data = (new XML (data)). toXMLString ();
			XML. prettyPrinting = oldPrettyPrinting;
		} catch (e) {
			data = data. replace (/ xmlns=""/g, ""). replace (
					/="[^"]+"/g,
				function (s) {
					return s. replace (
							/[\x00-\x19]/g,
						function (chr) {
							return "&#x" + chr. charCodeAt (0). toString (16). toUpperCase () + ";";
						});
				});
		}

		var uniConv = Components. classes ["@mozilla.org/intl/scriptableunicodeconverter"]. createInstance (Components. interfaces. nsIScriptableUnicodeConverter);
		uniConv. charset = "utf-8";
		data = uniConv. ConvertFromUnicode (data);

		var dir = Components. classes ["@mozilla.org/file/directory_service;1"]. getService (Components. interfaces. nsIProperties). get ("ProfD", Components. interfaces. nsIFile); // get profile folder
		dir. append ("custombuttons");
		if (!dir. exists ()) {
			try	{
				dir. create (Components. interfaces. nsIFile. DIRECTORY_TYPE, (7 << 6) | (5 << 3) | 5 /* 0755 */);
			} catch (e)	{
				var msg = 'Custom Buttons error.]' +
					'[ Event: Creating custombuttons directory]' +
					'[ ' + e;
				Components. utils. reportError (msg);
			}
		}

		var file = dir. clone ();
		file. append (this. fileName);
		backupProfile ("before-save-button");

		var foStream = Components. classes ["@mozilla.org/network/file-output-stream;1"]. createInstance (Components. interfaces. nsIFileOutputStream);
		var flags = 0x02 /* PR_WRONLY */ | 0x08 /* PR_CREATE_FILE */ | 0x20 /* PR_TRUNCATE */;
		foStream. init (file, flags, (6 << 6) | (6 << 3) | 4 /* 0664 */, 0);
		foStream. write (data, data. length);
		foStream. close ();
		backupProfile ("after-save-button");
	}
};

function AppObject (sWindowId, overlayPath) {
	if (overlayPath)
		this. overlayPath = overlayPath;
	this. windowId = sWindowId;
}
AppObject. prototype =	{
	_windowId: "",
	overlayPath: "resource://custombuttons/",
	overlayFileName: "",
	paletteId: "",
	_palette: null,
	notificationPrefix: "",
	overlay: null,

	set windowId (val) {
		var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
		if (!val)
			val = info. name;
		this. _windowId = val;
		switch (val) {
			case "SeaMonkeyMail":
			case "Thunderbird":
				this. overlayFileName = "buttonsoverlay.xul";
				this. paletteId = "MailToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d28:";
				break;
			case "SeaMonkeyMailWindow":
			case "ThunderbirdMailWindow":
				this. overlayFileName = "mwbuttonsoverlay.xul";
				this. paletteId = "MailToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d29:";
				this. _windowId = "ThunderbirdMailWindow";
				break;
			case "SeaMonkeyComposeWindow":
			case "ThunderbirdComposeWindow":
				this. overlayFileName = "mcbuttonsoverlay.xul";
				this. paletteId = "MsgComposeToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d2a:";
				this. _windowId = "ThunderbirdComposeWindow";
				break;
			case "Sunbird":
				this. overlayFileName = "buttonsoverlay.xul";
				this. paletteId = "calendarToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d27:";
				break;
			case "KompoZer":
				this. overlayFileName = "buttonsoverlay.xul";
				this. paletteId = "NvuToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d27:";
				break;
			case "Firefox":
			case "SeaMonkey":
			case "Browser":
			default:
				this. overlayFileName = "buttonsoverlay.xul";
				this. paletteId = "BrowserToolbarPalette";
				this. notificationPrefix = "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d27:";
				break;
		}
		this. overlay = new Overlay (this. overlayPath, this. overlayFileName);
	},

	get palette () {
		if (!this. _palette)
			this. _palette = this. overlay. overlayDocument. getElementById (this. paletteId);
		return this. _palette;
	},

	getNewID: function () {
		var minButtonNumber = this. overlay. minButtonNumber (this. paletteId);
		return "custombuttons-button" + minButtonNumber;
	},

	getButton: function (sButtonId)	{
		var doc = this. overlay. overlayDocument;
		var palette = doc. getElementById (this. paletteId);
		var overlayButton = palette. getElementsByAttribute ("id", sButtonId) [0];
		return overlayButton;
	},

	createNewButton: function () {
		var doc = this. overlay. overlayDocument;
		return doc. createElement ("toolbarbutton");
	},

	saveButtonToOverlay: function (button) {
		var doc = this. overlay. overlayDocument;
		var palette = doc. getElementById (this. paletteId);
		var id = button. getAttribute ("id");
		var overlayButton = palette. getElementsByAttribute ("id", id) [0];
		if (overlayButton)
			palette. removeChild (overlayButton);
		palette. appendChild (button);
		this. overlay. saveOverlayToProfile ();
	},

	notifyObservers: function (oSubject, sTopic, sData)	{
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. notifyObservers (oSubject, this. notificationPrefix + sTopic, sData);
		os. notifyObservers (oSubject, "custombuttons:cb499e37-9269-407e-820f-edc9ab0dd698:" + sTopic, sData + "+" + this. notificationPrefix);
	}
};

function CustombuttonsURIParser (uri) {
	this. parse (uri);
}
CustombuttonsURIParser. prototype =	{
	doc: null,
	parameters: {},

	getText: function (nodeName) {
		var result = "";
		var node = this. doc. getElementsByTagName (nodeName) [0];
		if (!node)
			return result;
		if (!node. firstChild || (node. firstChild &&
								  (node. firstChild. nodeType == node. TEXT_NODE)))
			result = node. textContent;
		else // CDATA
			result = node. firstChild. textContent;
		return result;
	},

	parse: function (uri) {
		var sProtocolPrefix = "custombutton:";
		if (uri. indexOf (sProtocolPrefix) == 0)
			uri = uri. substring (sProtocolPrefix. length);
		var button_code = unescape (uri);
		if (button_code. substring (0, 2) == "//")
			button_code = button_code. substring (2);
		var values = getParamBlock ();
		values. newButton = true;
		if (button_code. indexOf ("<?xml ") == 0) {
			var xp = Components. classes ["@mozilla.org/xmlextras/domparser;1"]. createInstance (Components. interfaces. nsIDOMParser);
			this. doc = xp. parseFromString (button_code, "text/xml");
			if (this. doc. documentElement. namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")
				throw new Error ("Malformed custombutton:// URI");;
			values. name = this. getText ("name");
			values. mode = this. getText ("mode");
			values. image = this. getText ("image") ||
				this. getText ("stdicon") || "";
			values. code = this. getText ("code");
			values. initCode = this. getText ("initcode");
			values. accelkey = this. getText ("accelkey");
			values. help = this. getText ("help");
			var attsNode = this. doc. getElementsByTagName ("attributes") [0];
			if (attsNode) {
				values. attributes = {};
				var attr, aName, aValue;
				for (var i = 0; i < attsNode. childNodes. length; i++) {
					attr = attsNode. childNodes [i];
					aName = attr. getAttribute ("name");
					aValue = attr. getAttribute ("value");
					values. attributes [aName] = aValue;
				}
			}
		} else {
			var az = ["%5D%E2%96%B2%5B", "]\u00e2\u0096\u00b2[", "\x5d\u25b2\x5b", "%5D%u25B2%5B"], idx = -1;
			for ( var i = 0; i < az.length; i++) {
				idx = (idx >= 0)? idx : (( button_code.indexOf(az[i]) != -1 )? i : idx);
			} // End for
			var sep = (idx >= 0)? az[idx] : "][";
			var ar = button_code.split( sep ); // Split button
			if (ar.length >= 3) { // some old buttons may have only 3 fields
				values. name = ar [0] || "";
				values. image = ar [1] || "";
				values. code = ar [2] || "";
				values. initCode = ar [3] || "";
				values. help = ar [4] || "";
			} else {
				throw new Error ("Malformed custombutton:// URI");;
			}
		}
		this. parameters = values;
	}
};

function cbCustomButtonsService () {}
cbCustomButtonsService. prototype =	{
	_refcount: 0,
	_ps: null,

	CUSTOM_BUTTONS_EXTENSION_ID: "custombuttons@xsms.org",
	pathToEditor: "chrome://custombuttons/content/editor.xul",
	beingUninstalled: false,

	get ps () {
		if (!this. _ps)	{
			var pbs = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
			pbs = pbs. QueryInterface (Components. interfaces. nsIPrefBranch);
			this. _ps = pbs. getBranch ("extensions.custombuttons.");
		}
		return this. _ps;
	},

	get mode ()	{
		return this. ps. getIntPref ("mode");
	},

	set mode (val) {
		this. ps. setIntPref ("mode", val);
	},

	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. cbICustomButtonsService) &&
			!iid. equals (Components. interfaces. nsIObserver) &&
			!iid. equals (Components. interfaces. nsISupportsWeakReference) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return this;
	},

	register: function (win) {
		this. _refcount++;
	},

	editors: [],

	closeEditorDialogs: function ()	{
		var mode = this. ps. getIntPref ("mode");
		if (mode & 16 /* CB_MODE_DO_NOT_CLOSE_EDITORS_ON_APPLICATION_CLOSE */)
			return;
		for (var i = 0; i < this. editors. length; i++)	{
			try	{
				this. editors [i]. close ();
			} catch (e) {}
		}
	},

	unregister: function ()	{
		this. _refcount--;
		if (this. _refcount == 0)
			this. closeEditorDialogs ();
	},

	getButtonParameters: function (buttonLink) {
		var link = this. parseButtonLink (buttonLink);
		var app = new AppObject (link. windowId);
		var param = getParamBlock ();
		param. buttonLink = buttonLink;
		param. windowId = link. windowId;
		if (!link. buttonId)
			param. newButton = true;
		var button = app. getButton (link. buttonId);
		if (button)	{
			param. id = button. getAttribute ("id");
			param. name = button. getAttribute ("name") ||
				button. getAttribute ("label") || "";
			param. image = button. getAttribute ("image") ||
				button. getAttribute ("cb-stdicon") || "";
			param. code = button. getAttribute ("cb-oncommand") || "";
			param. initCode = button. getAttribute ("cb-init") || "";
			param. accelkey = button. getAttribute ("cb-accelkey") || "";
			param. mode = button. getAttribute ("cb-mode") || 0;
			param. help = button. getAttribute ("Help") || "";
		} else
			param. newButton = true;
		if (link. line)	{
			var editorParameters = makeSupportsArray (link. phase, link. line);
			param ["editorParameters"] = editorParameters;
		}
		param. wrappedJSObject = param;
		return param;
	},

	editButton: function (opener, buttonLink, param) {
		if (opener)
			opener = opener. QueryInterface (Components. interfaces. nsIDOMWindow);
		var oButtonParameters = this. getButtonParameters (buttonLink);
		if (param) {
			for (var i in param. wrappedJSObject)
				oButtonParameters. wrappedJSObject [i] = param. wrappedJSObject [i];
		}
		this. openEditor (opener, oButtonParameters. windowId, oButtonParameters);
	},

	getEditorId: function (uri, param) {
		var sEditorId = "custombuttons-editor@" + uri + ":";
		sEditorId += param. id || param. name || (new Date (). valueOf ());
		return sEditorId;
	},

	findEditor: function (opener, uri, param) {
		var sEditorId = this. getEditorId (uri, param);
		var wws = Components. classes ["@mozilla.org/embedcomp/window-watcher;1"]. getService (Components. interfaces. nsIWindowWatcher);
		var cbedw = wws. getWindowByName (sEditorId, opener);
		return cbedw;
	},

	openEditor: function (opener, uri, param) {
		var cbedw = this. findEditor (opener, uri, param);
		var wws = Components. classes ["@mozilla.org/embedcomp/window-watcher;1"]. getService (Components. interfaces. nsIWindowWatcher);
		var sEditorId = this. getEditorId (uri, param);
		param. wrappedJSObject = param;
		if (cbedw) {
			cbedw. focus ();
			var app = new AppObject (param. windowId);
			app. notifyObservers (param, "setEditorParameters", "");
		} else {
			var editorUri = this. pathToEditor;
			var mode = this. ps. getIntPref ("mode");
			if (mode & 64 /* CB_MODE_SAVE_EDITOR_SIZE_SEPARATELY */)
				editorUri += "?editorId=" + sEditorId;
			cbedw = wws. openWindow (
				opener,
				editorUri,
				sEditorId,
				"chrome,resizable,dialog=no",
				param
			);
			this. editors. push (cbedw);
		}
	},

	makeButton: function (button, param) {
		button. setAttribute ("id", param. id);
		button. setAttribute ("label", param. name || "");
		button. setAttribute ("tooltiptext", param. name || "");
		button. setAttribute ("class", "toolbarbutton-1 chromeclass-toolbar-additional");
		button. setAttribute ("context", "custombuttons-contextpopup");
		if (param. image. indexOf ("custombuttons-stdicon") == 0)
			button. setAttribute ("cb-stdicon", param. image);
		else if (allowedSource (param. image))
			button. setAttribute ("image", param. image || "");
		else
			button. setAttribute ("image", "");
		button. setAttribute ("cb-oncommand", param. code || "");
		button. setAttribute ("cb-init", param. initCode || "");
		if (param. accelkey)
			button. setAttribute ("cb-accelkey", param. accelkey);
		button. setAttribute ("cb-mode", param. mode);
		if (param. help)
			button. setAttribute ("Help", param. help);
		if (param. attributes) {
			for (var i in param. attributes)
				button. setAttribute (i, param. attributes [i]);
		}
	},

	installButton: function (param)	{
		param = param. wrappedJSObject;
		var app = new AppObject (param. windowId);
		var button = app. createNewButton ();
		if (!param. id)
			param. id = app. getNewID ();
		this. makeButton (button, param);
		app. saveButtonToOverlay (button);
		app. notifyObservers (button, param. newButton? "installButton": "updateButton", "");
		if (param. newButton)
			this. alert ("ButtonAddedAlert");
	},

	updateButton: function (buttonLink, uri) {
		var parameters = this. getButtonParameters (buttonLink);
		parameters = parameters. wrappedJSObject;
		var param = this. parseButtonURI (uri);
		if (!param) {
			this. alert ("ButtonErrors");
			return 1; // Cancel
		}
		param = param. wrappedJSObject;
		var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
		var msg = this. getLocaleString ("UpdateConfirm"). replace (/%s/, parameters. name);
		msg = msg. replace (/%n/, param. name);
		var link = this. parseButtonLink (buttonLink);
		param. newButton = false;
		param. windowId = link. windowId;
		param. id = link. buttonId;
		param ["updateButton"] = true;
		param. wrappedJSObject = param;
		var sEditButtonLabel = this. getLocaleString ("OpenInEditor");
		var buttonFlags = (ps. BUTTON_POS_0 * ps. BUTTON_TITLE_OK) |
			(ps. BUTTON_POS_2 * ps. BUTTON_TITLE_IS_STRING) |
			(ps. BUTTON_POS_1 * ps. BUTTON_TITLE_CANCEL);
		var checkState = { value: false };
		var res = ps. confirmEx (null, "Custom Buttons", msg, buttonFlags, "", "", sEditButtonLabel, null, checkState);
		if (res == 1) // Cancel pressed
			return res;
		if ((res == 2) || this. findEditor (null, param. windowId, param)) // Edit... pressed or Ok pressed and Editor already opened
			this. openEditor (null, param. windowId, param);
		else
			this. installButton (param);
		return res;
	},

	getLocaleString: function (stringId) {
		var ls = Components. classes ["@mozilla.org/intl/nslocaleservice;1"]. getService (Components. interfaces. nsILocaleService);
		var appLocale = ls. getApplicationLocale ();
		var sbs = Components. classes ["@mozilla.org/intl/stringbundle;1"]. getService (Components. interfaces. nsIStringBundleService);
		var sb = sbs. createBundle ("chrome://custombuttons/locale/custombuttons.properties", appLocale);
		return sb. GetStringFromName (stringId);
	},

	alert: function (msgId)	{
		var msg = this. getLocaleString (msgId);
		var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
		ps. alert (null, "Custom Buttons", msg);
	},

	convertImageToRawData: function (windowId, buttonId, imageURL) {
		var topic = this. getNotificationPrefix (windowId) + "updateImage";
		var converter = new ImageConverter (imageURL, buttonId, topic);
	},

	getNotificationPrefix: function (windowId) {
		var app = new AppObject (windowId);
		return app. notificationPrefix;
	},

	parseButtonURI: function (uri) {
		try	{
			var param = new CustombuttonsURIParser (uri). parameters;
			param. wrappedJSObject = param;
			return param;
		} catch (e)	{
			return null;
		}
	},

	cloneButton: function (clonedButton, asEmpty) {
		clonedButton = clonedButton. QueryInterface (Components. interfaces. nsIDOMNode);
		var documentURI = clonedButton. ownerDocument. documentURI;
		var buttonId = clonedButton. getAttribute ("id");
		var parentId = clonedButton. parentNode. getAttribute ("id");
		var windowId = this. getWindowId (documentURI);
		var app = new AppObject (windowId);
		var button = app. getButton (buttonId);
		var newId = app. getNewID ();
		var newButton;
		if (asEmpty) {
			var param = getParamBlock ();
			newButton = app. createNewButton ();
			this. makeButton (newButton, param);
		} else
			newButton = button. cloneNode (true);
		newButton. setAttribute ("id", newId);
		app. notifyObservers (newButton, "cloneButton", parentId + ":" + buttonId);
		app. saveButtonToOverlay (newButton);
		return newId;
	},

	removeRDFResource: function (ds, res) {
		var alo = ds. ArcLabelsOut (res);
		var ca, ta;
		while (alo. hasMoreElements ())	{
			ca = alo. getNext ();
			if (ca instanceof Components. interfaces. nsIRDFResource) {
				ta = ds. GetTarget (res, ca, true);
				if (ta instanceof Components. interfaces. nsIRDFResource)
					this. removeRDFResource (ds, ta);
				else if (ta instanceof Components. interfaces. nsIRDFLiteral)
					ds. Unassert (res, ca, ta);
			}
		}
	},

	unPersist: function (resId)
	{
		try	{
			var rs = Components. classes ["@mozilla.org/rdf/rdf-service;1"]. getService (Components. interfaces. nsIRDFService);
			var ds = rs. GetDataSource ("rdf:local-store");
			var res1 = rs. GetResource (resId);
			var res2 = rs. GetResource ("http://home.netscape.com/NC-rdf#persist");
			var targets = ds. GetTargets (res1, res2, true);
			var cta;
			ds. beginUpdateBatch ();
			while (targets. hasMoreElements ())	{
				cta = targets. getNext ();
				if (cta instanceof Components. interfaces. nsIRDFResource) {
					this. removeRDFResource (ds, cta);
					ds. Unassert (res1, res2, cta);
				}
			}
			ds. endUpdateBatch ();
		} catch (e) {}
	},

	unPersistAll: function () {
		var rs = Components. classes ["@mozilla.org/rdf/rdf-service;1"]. getService (Components. interfaces. nsIRDFService);
		var ds = rs. GetDataSource ("rdf:local-store");
		var rss = ds. GetAllResources ();
		var cre, cnt = 0, s = "", s2 = "";
		var resid = this. pathToEditor + "?";
		while (rss. hasMoreElements ()) {
			cre = rss. getNext ();
			if (cre instanceof Components. interfaces. nsIRDFResource)
				s2 += cre. Value + "\n";
			if ((cre instanceof Components. interfaces. nsIRDFResource) &&
				(cre. Value. indexOf (resid) == 0))	{
				cnt++;
				s += cre. Value + "\n";
				this. unPersist (cre. Value);
			}
		}
	},

	_removeButton: function (windowId, toolbarId, buttonId, removeFromOverlay) {
		var app = new AppObject (windowId);
		var button = app. getButton (buttonId);
		if (button && removeFromOverlay) {
			button. parentNode. removeChild (button);
			app. overlay. saveOverlayToProfile ();
		}
		app. notifyObservers (null, "removeButton", toolbarId + ":" + buttonId);
		var am = {}, addon;
		try {
			addon = {
				id: "custombutton://buttons/" + windowId + "/" + buttonId
			};
			Components. utils ["import"] ("resource://gre/modules/AddonManager.jsm", am);
			am. AddonManagerPrivate. callAddonListeners ("onUninstalling", addon, false);
			am. AddonManagerPrivate. callAddonListeners ("onUninstalled", addon);
		} catch (e) {}
		var editorId = this. pathToEditor + "?editorId=custombuttons-editor@" + windowId + ":" + buttonId;
		var mode = this. ps. getIntPref ("mode");
		if (mode & 64 /* CB_MODE_SAVE_EDITOR_SIZE_SEPARATELY */)
			this. unPersist (editorId);
	},

	removeButton: function (removedButton, removeFromOverlay) {
		removedButton = removedButton. QueryInterface (Components. interfaces. nsIDOMNode);
		var documentURI = removedButton. ownerDocument. documentURI;
		var buttonId = removedButton. getAttribute ("id");
		var parentId = removedButton. parentNode. getAttribute ("id");
		var windowId = this. getWindowId (documentURI);
		this. _removeButton (windowId, parentId, buttonId, removeFromOverlay);
	},

	uninstallButton: function (buttonLink) {
		var link = this. parseButtonLink (buttonLink);
		this. _removeButton (link. windowId, "", link. buttonId, true);
	},

	makeOverlay: function () {
		var app = new AppObject ("", "chrome://custombuttons/content/");
		try	{
			var numbers = this. ps. getChildList ("button", {});
			if (numbers. length > 0) {
				var data, param, button, i, id;
				var palette = app. palette;
				for (i = 0; i < numbers. length; i++) {
					id = "custombuttons-" + numbers [i];
					data = this. ps. getComplexValue (numbers [i], Components. interfaces. nsISupportsString). data;
					param = this. parseButtonURI (data);
					if (param) {
						param = param. wrappedJSObject;
						param. id = id;
						button = app. createNewButton ();
						this. makeButton (button, param);
						palette. appendChild (button);
					}
				}
			}
		} finally {
			try	{
				app. overlay. saveOverlayToProfile ();
			} finally {
				for (var i = 0; i < numbers. length; i++)
					this. ps. deleteBranch (numbers [i]);
			}
		}
	},

	installWebButton: function (parameters, buttonURI, showConfirmDialog) {
		var param = this. parseButtonURI (buttonURI);
		if (!param)	{
			this. alert ("ButtonErrors");
			return false;
		}
		param = param. wrappedJSObject;
		if (parameters)	{
			parameters = parameters. wrappedJSObject;
			param. windowId = parameters. windowId;
			param. attributes = parameters. attributes;
		}
		var res = 0;
		if (showConfirmDialog) {
			var msg = this. getLocaleString ("InstallConfirm"). replace (/%s/gi, param. name);
			var sEditButtonLabel = this. getLocaleString ("OpenInEditor");
			var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
			var buttonFlags = (ps. BUTTON_POS_0 * ps. BUTTON_TITLE_OK) |
				(ps. BUTTON_POS_2 * ps. BUTTON_TITLE_IS_STRING) |
				(ps. BUTTON_POS_1 * ps. BUTTON_TITLE_CANCEL);
			var checkState = { value: false };
			res = ps. confirmEx (null, "Custom Buttons", msg, buttonFlags, "", "", sEditButtonLabel, null, checkState);
		}
		if (res == 0) // Ok pressed
			this. installButton (param);
		else if (res == 2) // Edit... pressed
			this. openEditor (null, buttonURI, param);
		return true;
	},

	readFromClipboard: function (aContext) {
		var str = {};
		var strLength = {};
		var result = "";
		try	{
			var clip = Components. classes ["@mozilla.org/widget/clipboard;1"]. getService (Components. interfaces. nsIClipboard);
			var kGlobalClipboard = clip. kGlobalClipboard;
			var trans = Components. classes ["@mozilla.org/widget/transferable;1"]. createInstance (Components. interfaces. nsITransferable);
			if ("init" in trans)
				trans. init (aContext);
			trans. addDataFlavor ("text/unicode");
			clip. getData (trans, kGlobalClipboard);
			trans. getTransferData ("text/unicode", str, strLength);
			if (str. value instanceof Components. interfaces. nsISupportsString)
				result = str. value. data;
		} catch (e) {}
		return result;
	},

	writeToClipboard: function (str) {
		var clipid = Components. interfaces. nsIClipboard. kGlobalClipboard;
		var ch = Components. classes ["@mozilla.org/widget/clipboardhelper;1"]. getService (Components. interfaces. nsIClipboardHelper);
		ch. copyStringToClipboard (str, clipid);
	},

	alert2: function (msg) {
		var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
		ps. alert (null, "Custom Buttons", msg);
	},

	canUpdate: function () {
		var param = this. parseButtonURI (this. readFromClipboard (null));
		return param? true: false;
	},

	getWindowId: function (documentURI)	{
		var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
		switch (documentURI) {
			case "chrome://browser/content/browser.xul":
				return "Firefox";
			case "chrome://navigator/content/navigator.xul":
				return "SeaMonkey";
			case "chrome://messenger/content/messenger.xul":
				if (info. name == "SeaMonkey")
					return "SeaMonkeyMail";
				else
					return "Thunderbird";
			case "chrome://messenger/content/messageWindow.xul":
				if (info. name == "SeaMonkey")
					return "SeaMonkeyMailWindow";
				else
					return "ThunderbirdMailWindow";
			case "chrome://messenger/content/messengercompose/messengercompose.xul":
				if (info. name == "SeaMonkey")
					return "SeaMonkeyComposeWindow";
				else
					return "ThunderbirdComposeWindow";
			case "chrome://sunbird/content/calendar.xul":
			case "chrome://calendar/content/calendar.xul":
				return "Sunbird";
			case "chrome://editor/content/editor.xul":
				return "KompoZer";
		}
		return "Firefox";
	},

	makeButtonLink: function (documentURI, action, buttonId) {
		var windowId = this. getWindowId (documentURI);
		var res = "custombutton://buttons/" + windowId + "/";
		if (action)
			res += action + "/";
		if (buttonId)
			res += buttonId;
		return res;
	},

	parseButtonLink: function (buttonLink) {
		var arr = buttonLink. split ("/");
		var res = {};
		res. windowId = arr [3];
		res. phase = (arr. length == 6)? arr [4]: "";
		res. buttonId = (arr. length == 6)? arr [5]: arr [4];
		if (res. buttonId) {
			var id = res. buttonId. split ("#");
			res. buttonId = id [0];
			res. line = id [1];
		}
		return res;
	},

	onUninstalling: function (addon) {
		if (addon. id != this. CUSTOM_BUTTONS_EXTENSION_ID)
			return;
		this. beingUninstalled = true;
	},


	onOperationCancelled: function (addon) {
		if (addon. id != this. CUSTOM_BUTTONS_EXTENSION_ID)
			return;
		this. beingUninstalled = false;
	},

	observe: function (subject, topic, data) {
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		switch (topic) {
			case "app-startup":
				os. addObserver (this, "profile-after-change", true);
				break;
			case "profile-after-change":
				try	{
					var am = {};
					Components. utils ["import"] ("resource://gre/modules/AddonManager.jsm", am);
					am. AddonManager. addAddonListener (this);
				} catch (e)	{
					os. addObserver (this, "em-action-requested", true);
				}
				os. addObserver (this, "profile-change-teardown", true);
				var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
				var rph = ios. getProtocolHandler ("resource"). QueryInterface (Components. interfaces. nsIResProtocolHandler);
				var dir = Components. classes ["@mozilla.org/file/directory_service;1"]. getService (Components. interfaces. nsIProperties). get ("ProfD", Components. interfaces. nsIFile);
				dir. append ("custombuttons");
				var file = dir. clone ();
				file. append ("buttonsoverlay.xul");
				backupProfile ("profile-after-change");
				if (!file. exists ())
					this. makeOverlay ();
				var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
				if ((info. name == "SeaMonkey") ||
					(info. name == "Thunderbird")) {
					var ovl, doc;
					file = dir. clone ();
					file. append ("mwbuttonsoverlay.xul");
					if (!file. exists ()) {
						ovl = new Overlay ("chrome://custombuttons/content/", "buttonsoverlay.xul");
						doc = ovl. overlayDocument;
						ovl. fileName = "mwbuttonsoverlay.xul";
						ovl. saveOverlayToProfile ();
					}
					file = dir. clone ();
					file. append ("mcbuttonsoverlay.xul");
					if (!file. exists ()) {
						ovl = new Overlay ("chrome://custombuttons/content/", "buttonsoverlay.xul");
						doc = ovl. overlayDocument;
						ovl. fileName = "mcbuttonsoverlay.xul";
						ovl. saveOverlayToProfile ();
					}
				}
				var uri = ios. newFileURI (dir);
				rph. setSubstitution ("custombuttons", uri);
				// Here we check if the "network.protocol-handler.expose.custombutton" preference has user value
				// It controls installation of custombuttons by means of custombutton:// links in Thunderbird 2.0
				// If the preference exists and has 'true' value, we shall set corresponding mode bit and try to delete the preference
				var ps = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
				ps = ps. QueryInterface (Components. interfaces. nsIPrefBranch);
				var pn = "network.protocol-handler.expose.custombutton";
				if (ps. prefHasUserValue (pn)) {
					if (ps. getBoolPref (pn))
						this. mode |= 128 /* CB_MODE_INSTALL_BUTTONS_FROM_EMAIL */;
					try {
						ps. deleteBranch (pn);
					} catch (e)	{
						ps. setBoolPref (pn, false);
					}
				}
				break;
			case "profile-change-teardown":
				os. removeObserver (this, "profile-change-teardown");
				os. removeObserver (this, "em-action-requested");
				if (this. beingUninstalled)
					this. unPersistAll ();
				backupProfile ("profile-change-teardown");
				break;
			case "em-action-requested":
				if (!(subject instanceof Components. interfaces. nsIUpdateItem))
					return;
				if (data == "item-uninstalled")
					this. onUninstalling (subject);
				else if (data == "item-cancel-action")
					this. onOperationCancelled (subject);
			default:;
		}
	},

	allowedSource: function (src) {
		return allowedSource (src);
	},

	getChannel: function (aSpec, aContentPolicy) {
		var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
		var chan;
		var contentPolicy = aContentPolicy || Components. interfaces. nsIContentPolicy. TYPE_OTHER;
		if ("newChannel" in ios)
			chan = ios. newChannel (aSpec, null, null);
		else
			chan = ios. newChannel2 (
				aSpec,
				null,
				null,
				null,
				Components. classes ["@mozilla.org/systemprincipal;1"]. createInstance (Components. interfaces. nsIPrincipal),
				null,
				Components. interfaces. nsILoadInfo. SEC_NORMAL,
				contentPolicy);
		return chan;
	}
};

var Module = {
	CLSID: Components. ID ("{64d03940-83bc-4ac6-afc5-3cbf6a7147c5}"),
	ContractID: "@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */,
	ComponentName: "Custom Buttons extension service",
	canUnload: function (componentManager) { return true; },
	getClassObject: function (componentManager, cid, iid) {
		if (!cid. equals (this. CLSID))
			throw new Error (NO_INTERFACE);;
		if (!iid. equals (Components. interfaces. nsIFactory))
			throw new Error (NOT_IMPLEMENTED);;
		return this. CLASS_FACTORY;
	},

	unregisterSelf: function () {
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. deleteCategoryEntry ("app-startup", "service," + this. ContractID, true);
	},

	firstTime: true,
	registerSelf: function (compMgr, fileSpec, location, type) {
		if (this. firstTime)
			this. firstTime = false;
		else
			throw new Error (FACTORY_REGISTER_AGAIN);;
		compMgr = compMgr. QueryInterface (Components. interfaces. nsIComponentRegistrar);
		compMgr. registerFactoryLocation (
			this. CLSID, this. ComponentName, this. ContractID,
			fileSpec, location, type
		);
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. addCategoryEntry ("app-startup", this. ComponentName, "service," + this. ContractID, true, true);
	},

	CLASS_FACTORY: {
		QueryInterface: function (iid) {
			if (iid. equals (Components. interfaces. nsIFactory) ||
				iid. equals (Components. interfaces. nsISupports))
				return this;
			throw Components. results. NS_ERROR_NO_INTERFACE;
		},
		createInstance: function (outer, iid) {
			if (outer != null)
				throw Components. results. NS_ERROR_NO_AGGREGATION;
			return (new cbCustomButtonsService ()). QueryInterface (iid);
		}
	}
};

function NSGetModule (componentManager, fileSpec) { return Module; }
function NSGetFactory (cid) { return Module. CLASS_FACTORY; }
