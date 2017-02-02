/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var custombutton = {
	cbService: Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */].
		getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */),
	waitForInitialization: [],

	buttonConstructor: function (oBtn) {
		oBtn. removeAttribute ("initialized");
		if (!("custombuttons" in window) ||
			!custombuttons. loaded) {
			this. waitForInitialization. push (oBtn);
			return;
		}
		if (oBtn. destroy)
			oBtn. destroy ("constructor"); // to call onDestroy method, if exists
		var toolbarpaletteItem = oBtn. parentNode;
		while (toolbarpaletteItem) {
			if (toolbarpaletteItem. nodeName == "toolbarpaletteitem")
				break;
			toolbarpaletteItem = toolbarpaletteItem. parentNode;
		}
		if (toolbarpaletteItem &&
			toolbarpaletteItem. id. indexOf ("wrapper-") == 0) {
			if (oBtn. hasAttribute ("initialized"))
				oBtn. removeAttribute ("initialized");
			return;
		}
		var windowId = this. cbService. getWindowId (document. documentURI);
		var cbd = Components. classes ["@xsms.nm.ru/custombuttons/cbkeymap;1" /* CB_KEYMAP_SERVICE_CID */].
			getService (Components. interfaces. cbIKeyMapService /* CB_KEYMAP_SERVICE_IID */);
		cbd. Delete (windowId, oBtn. getAttribute ("id"));
		if (!oBtn. hasAttribute ("cb-name")) {
			if (oBtn. hasAttribute ("label"))
				oBtn. name = oBtn. getAttribute ("label");
		}
		if (oBtn. hasAttribute ("cb-accelkey")) {
			cbd. Add (
				windowId,
				oBtn. getAttribute ("id"),
				oBtn. getAttribute ("cb-accelkey"),
				(oBtn. cbMode & 2 /* CB_MODE_DISABLE_DEFAULT_KEY_BEHAVIOR */)? true: false
			);
		}
		if (oBtn. hasAttribute ("cb-oncommand"))
			oBtn. cbCommand = oBtn. getAttribute ("cb-oncommand");
		if (oBtn. hasAttribute ("image")) {
			oBtn. image = oBtn. getAttribute ("image");
			if (!oBtn. getAttribute ("image") ||
				(oBtn. getAttribute ("image") == "data:"))
				oBtn. removeAttribute ("image");
		}
		if (oBtn. hasAttribute ("Help")) {
			if (!oBtn. getAttribute ("Help"))
				oBtn. removeAttribute ("Help");
		}

		if (!oBtn. hasAttribute ("initialized")) {
			if (oBtn. hasAttribute ("cb-init")) {
				var mode = this. cbService. mode;
				if (mode & 32 /* CB_MODE_DISABLE_INITIALIZATION */) // disable initialization
					return;
				if (oBtn. parentNode &&
					(oBtn. parentNode. localName != "toolbar") &&
					!/(?:^|\s)customization-target(?:\s|$)/.test(oBtn. parentNode. className) &&
					oBtn. parentNode. id != "PanelUI-contents")
					return;
				oBtn. cbInitCode = oBtn. getAttribute ("cb-init");
				setTimeout (function () { oBtn. init (); }, 0);
			} else {
				oBtn. setAttribute ("cb-init", "");
				oBtn. setAttribute ("initialized", "true");
			}
		}
	},

	buttonDestructor: function (oBtn) {
		if (oBtn. hasAttribute ("cb-accelkey")) {
			var windowId = this. cbService. getWindowId (document. documentURI);
			var cbd = Components. classes ["@xsms.nm.ru/custombuttons/cbkeymap;1" /* CB_KEYMAP_SERVICE_CID */].
				getService (Components. interfaces. cbIKeyMapService /* CB_KEYMAP_SERVICE_IID */);
			cbd. Delete (windowId, oBtn. getAttribute ("id"));
		}
		if (oBtn. destroy)
			oBtn. destroy ("destructor");
	},

	checkBind: function () {
		if (Function. prototype. bind == undefined) {
			Function. prototype. bind = function (object) {
				var method = this;
				return function () {
					return method. apply (object, arguments);
				};
			};
		}
	},

	buttonInit: function (oBtn) {
		if (oBtn. cbInitCode) {
			while (oBtn. hasChildNodes ())
				oBtn. removeChild (oBtn. childNodes [0]);
			oBtn. _initPhase = true;
			oBtn. setAttribute ("initializeerror", "true");
			try {
				this. buttonCbExecuteCode ({}, oBtn, oBtn. cbInitCode);
				oBtn. setAttribute ("initialized", "true");
				oBtn. removeAttribute ("initializeerror");
			} finally {
				oBtn. _initPhase = false;
			}
		}
	},

	buttonDestroy: function (oBtn, reason) {
		while (oBtn. _handlers. length != 0) {
			oBtn. _handlers [0]. unregister ();
			oBtn. _handlers. shift ();
		}
		while (oBtn. _destructors. length != 0) {
			try {
				oBtn. _destructors [0]. destructor. apply (oBtn. _destructors [0]. context, [reason]);
			} catch (e) {
				Components. utils. reportError (e);
			}
			oBtn. _destructors. shift ();
		}
		if (oBtn. onDestroy) {
			try {
				oBtn. onDestroy (reason);
			} catch (e) {
				Components. utils. reportError (e);
			}
		}
	},

	buttonGetParameters: function (oBtn) {
		var parameters = {
			name: oBtn. name,
			image: oBtn. image,
			code: oBtn. cbCommand,
			initCode: oBtn. cbInitCode,
			accelkey: oBtn. cbAccelKey,
			mode: oBtn. cbMode,
			Help: oBtn. Help,
			stdIcon: oBtn. cbStdIcon
		};
		if (custombuttons. lightning &&
			oBtn. hasAttribute ("mode")) {
			parameters. attributes = {};
			parameters. attributes ["mode"] = oBtn. getAttribute ("mode");
		}
		return parameters;
	},

	buttonGetCbAccelKey: function (oBtn) {
		if (oBtn. hasAttribute ("cb-accelkey"))
			return oBtn. getAttribute ("cb-accelkey");
		return "";
	},

	buttonGetImage: function (oBtn) {
		if (oBtn. hasAttribute ("image"))
			return oBtn. getAttribute ("image");
		return "";
	},

	buttonGetHelp: function (oBtn) {
		if (oBtn. hasAttribute ("Help"))
			return oBtn. getAttribute ("Help");
		return "";
	},

	buttonGetCbMode: function (oBtn) {
		if (oBtn. hasAttribute ("cb-mode"))
			return oBtn. getAttribute ("cb-mode");
		return 0;
	},

	buttonSetText: function (doc, nodeName, text, make_CDATASection) {
		var node = doc. getElementsByTagName (nodeName) [0], cds;
		if (!node)
			return;
		if (make_CDATASection) {
			try {
				cds = doc. createCDATASection (text || "");
			} catch (e) {
				cds = doc. createTextNode (text || "");
			}
			node. appendChild (cds);
		} else {
			node. textContent = text;
		}
	},

	setAttribute: function (oDocument, sName, sValue) {
		var attsNode = oDocument. getElementsByTagName ("attributes") [0];
		var attr = oDocument. createElement ("attribute");
		attr. setAttribute ("name", sName);
		attr. setAttribute ("value", sValue);
		attsNode. appendChild (attr);
	},

xmlFormatURI: function(oBtn) {
   var cbs = Components.classes["@xsms.nm.ru/custombuttons/cbservice;1"].getService(Components.interfaces.cbICustomButtonsService);
   var xmlchan = cbs.getChannel("chrome://custombuttons/content/nbftemplate.xml");
   var instr = xmlchan.open();
   /**
    * nsIDOMParser used here breaks the new DOMParser contructor globally on all Firefox versions.
    */
   // var dp = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
   // var doc = dp.parseFromStream(instr, null, instr.available(), "application/xml");
   var bis = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);
   bis.setInputStream(instr);
   var templateStr = bis.readBytes(bis.available());
   var doc = (new DOMParser()).parseFromString(templateStr, "application/xml");
   oBtn.setText(doc, "name", oBtn.name, false);
   oBtn.setText(doc, "mode", oBtn.cbMode, false);
   oBtn.setText(doc, "image", oBtn.image || oBtn.cbStdIcon, true);
   oBtn.setText(doc, "code", oBtn.cbCommand, true);
   oBtn.setText(doc, "initcode", oBtn.cbInitCode, true);
   oBtn.setText(doc, "accelkey", oBtn.cbAccelKey, true);
   oBtn.setText(doc, "help", oBtn.Help, true);
   if (oBtn.parameters.attributes) {
      var atts = oBtn.parameters.attributes;
      for (var i in atts)
         this.setAttribute(doc, i, atts[i]);
   }
   var ser = new XMLSerializer();
   var data = ser.serializeToString(doc);
   return "custombutton://" + escape(data);
},

	buttonGetURI: function (oBtn) {
		return this. xmlFormatURI (oBtn);
	},

	buildExecutionContext: function (oButton, uri, executionContext) {
		var utils = {};
		utils ["oButton"] = oButton;
		utils ["buttonURI"] = uri;
		Components. classes ["@mozilla.org/moz/jssubscript-loader;1"].
			getService (Components. interfaces. mozIJSSubScriptLoader).
			loadSubScript ("chrome://custombuttons/content/contextBuilder.js", utils);
		delete utils. oButton;
		delete utils. buttonURI;
		for (var i in utils) {
			executionContext. argNames += "," + i;
			executionContext. args. push (utils [i]);
		}
	},

	buttonCbExecuteCode: function (event, oButton, code) {
		this. checkBind ();
		var execurl = "chrome://custombuttons-context/content/button.js?windowId=";
		execurl += this. cbService. getWindowId (document. documentURI) + "&id=";
		execurl += oButton. id + "@";
		execurl += oButton. _initPhase? "init": "code";
		var executionContext = {};
		executionContext ["oButton"] = oButton;
		executionContext ["code"] = code;
		executionContext ["argNames"] = "event";
		executionContext ["args"] = [event];
		this. buildExecutionContext (oButton, execurl, executionContext);
		Components. classes ["@mozilla.org/moz/jssubscript-loader;1"].
			getService (Components. interfaces. mozIJSSubScriptLoader).
			loadSubScript (execurl, executionContext);
	},

	buttonCommand: function(event, oBtn) {
		if (oBtn. cbCommand)
			this. buttonCbExecuteCode (event, oBtn, oBtn. cbCommand);
	},

	canUpdate: function () {
		return this. cbService. canUpdate ();
	},

	showElement: function (oElement, bShowFlag) {
		if (oElement. hasAttribute ("hidden"))
			oElement. removeAttribute ("hidden");
		if (!bShowFlag)
			oElement. setAttribute ("hidden", "true");
	},

	showBroadcast: function (sIdSuffix, bShowFlag) {
		var sBroadcasterId = "custombuttons-contextbroadcaster-" + sIdSuffix;
		var oBroadcaster = document. getElementById (sBroadcasterId);
		if (oBroadcaster)
			this. showElement (oBroadcaster, bShowFlag);
	},

	setContextMenuVisibility: function (oButton) {
		this. showBroadcast ("root", false); // hide all buttons menuitems
		this. showBroadcast ("update", true);
		this. showBroadcast ("help", true);
		this. showBroadcast ("customizeseparator", true);
		var bPrimary = !oButton. _ctxtObj;
		this. showBroadcast ("primary", bPrimary);
		this. showBroadcast ("secondary", !bPrimary);
		var nCurrentNum = oButton. id. replace (/custombuttons-button/, "");
		var sCurrentBroadcasterId = "custombuttons-buttonbroadcaster" + nCurrentNum;
		var oCurrentBroadcaster = document. getElementById (sCurrentBroadcasterId);
		var bHideUpdate = !this. canUpdate ();
		var bHideHelp = !this. buttonGetHelp (oButton);
		var bHideSeparator = bHideUpdate && bHideHelp && !document. getElementById ("custombuttons-contextpopup-bookmarkButton");
		if (oCurrentBroadcaster)
			this. showElement (oCurrentBroadcaster, !bPrimary);
		if (bHideUpdate)
			this. showBroadcast ("update", false);
		if (bHideHelp)
			this. showBroadcast ("help", false);
		if (bHideSeparator)
			this. showBroadcast ("customizeseparator", false);

		if ("gCustomizeMode" in window && document. getElementsByClassName)	{
			var inMenu = oButton. getAttribute ("cui-areatype") == "menu-panel";
			var showItemsInNode = function (node, name, show) {
				Array. forEach (
					node. getElementsByClassName ("customize-context-" + name),
					function (mi) {
						if (mi. classList. contains ("custombuttons-moveButtonItem"))
							this. showElement (mi, show);
					},
					this
				);
			}. bind (this);
			var showItems = function (name, show) {
				showItemsInNode (document, name, show);
				showItemsInNode (oButton, name, show); // Strange things may happens with anonymous (?) cloned menu
			};
			showItems ("moveToPanel", !inMenu);
			showItems ("removeFromToolbar", !inMenu);
			showItems ("moveToToolbar", inMenu);
			showItems ("removeFromPanel", inMenu);
		}
	},

	onMouseDown: function (oEvent, oButton)	{
		if ((oEvent. button == 2) &&
			oEvent. ctrlKey && oEvent. shiftKey && oEvent. altKey) {
			oButton. setAttribute ("context", "custombuttons-contextpopup");
			return;
		}
		this. setContextMenuVisibility (oButton);
	},

	allowedSource: function (src) {
		return this. cbService. allowedSource (src);
	}
};
