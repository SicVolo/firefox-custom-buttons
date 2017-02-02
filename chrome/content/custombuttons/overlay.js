/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var custombuttons = {
	ps: Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService). getBranch ("custombuttons.button"),
	buttonParameters: ["name", "image", "code", "initCode", "accelkey", "help"],
	buttonsLoadedFromProfileOverlay: null,
	_palette: null,
	toolbarpaletteName: "BrowserToolbarPalette",
	shouldAddToPalette: true,
	cbService: null,
	loaded: false,

	get popupNode () {
		var cm = document. getElementById ("custombuttons-contextpopup");
		var res = cm. _cb_triggerNode || cm. triggerNode || document. popupNode || null;
		delete cm. _cb_triggerNode;
		return res;
	},

	get palette () {
		if (!this. _palette)
			this. _palette = this. getPalette ();
		return this. _palette;
	},

	get gToolbox ()	{
		return document. getElementById ("navigator-toolbox") || // FF3b2 and lower
		document. getElementById ("browser-toolbox"); // see https://bugzilla.mozilla.org/show_bug.cgi?id=415099
	},

	getPalette: function ()	{
		return this. gToolbox. palette;
	},

	pushMenuitem: function (sName, bPrimary) {
		var sId = "custombuttons-contextpopup-" + sName + (bPrimary? "": "-sub");
		var oMenuitem = document. getElementById (sId);
		oMenuitem. parentNode. appendChild (oMenuitem);
	},

	addObserver: function (sNotificationName) {
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. addObserver (this, this. notificationPrefix + sNotificationName, false);
	},

	removeObserver: function (sNotificationName) {
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. removeObserver (this, this. notificationPrefix + sNotificationName);
	},

	notificationSender: false,
	notifyObservers: function (oSubject, sTopic, sData)	{
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		this. notificationSender = true;
		os. notifyObservers (oSubject, this. notificationPrefix + sTopic, sData);
		this. notificationSender = false;
	},

	addObservers: function () {
		this. addObserver ("installButton");
		this. addObserver ("updateButton");
		this. addObserver ("cloneButton");
		this. addObserver ("removeButton");
		this. addObserver ("edit:focus");
		this. addObserver ("edit:blur");
		this. addObserver ("edit:done");
		this. addObserver ("edit:save");
	},

	removeObservers: function () {
		this. removeObserver ("edit:save");
		this. removeObserver ("edit:done");
		this. removeObserver ("edit:blur");
		this. removeObserver ("edit:focus");
		this. removeObserver ("removeButton");
		this. removeObserver ("cloneButton");
		this. removeObserver ("updateButton");
		this. removeObserver ("installButton");
	},

	init: function () {
		this. cbService = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */]. getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */);
		this. cbService. register (window);
		var windowId = this. cbService. getWindowId (document. documentURI);
		this. notificationPrefix = this. cbService. getNotificationPrefix (windowId);
		this. pushMenuitem ("customize", true);
		this. pushMenuitem ("addnewbutton", true);
		this. pushMenuitem ("customize", false);
		this. pushMenuitem ("addnewbutton", false);
		this. pushMenuitem ("subCall", true);
		var pref = "settings.editor.showApplyButton";
		var ps = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
		ps = ps. QueryInterface (Components. interfaces. nsIPrefBranch);
		var cbps = ps. getBranch ("custombuttons.");
		var mode = this. cbService. mode;
		if (ps. prefHasUserValue (pref)) {
			mode |= (ps. getBoolPref (pref)? 2 /* CB_MODE_SHOW_APPLY_BUTTON */: 0);
			try	{
				ps. deleteBranch (pref);
			} catch (e) {}
		}
		this. cbService. mode = mode;
		this. addObservers ();
		this. loaded = true;
		this. initButtons ();
		this. notifyObservers (null, "custombuttons-initialized", "");
	},

	initButtons: function () {
		for (var i = 0; i < custombutton. waitForInitialization. length; i++)
			custombutton. buttonConstructor (custombutton. waitForInitialization [i]);
	},

	close: function () {
		this. cbService. unregister ();
		this. removeObservers ();
		window. removeEventListener ("load", custombuttons, false);
		window. removeEventListener ("unload", custombuttons, false);
		window. removeEventListener ("keypress", custombuttons, true);
	},

	copyAttributes: function (oSrcButton, oDstButton) {
		var atts = oSrcButton. attributes;
		var attr;
		for (var i = 0; i < atts. length; i++) {
			attr = atts. item (i);
			oDstButton. setAttribute (attr. name, oSrcButton. getAttribute (attr. name));
		}
	},

	findButtons: function (id) { // There are may be several buttons with same id (some extensions like All-in-One Sidebar extension may clone buttons)
		return Array. slice (document. getElementsByAttribute ("id", id));
	},

	RemoveButtonFromPalette: function (sButtonId) {
		var oPaletteButton = this. palette. getElementsByAttribute ("id", sButtonId) [0];
		if (oPaletteButton)	{
			try	{
				oPaletteButton. destroy ("remove_from_palette");
			} catch (e) {}
			this. palette. removeChild (oPaletteButton);
		}
	},

	AddButtonToPalette: function (oButton) {
		this. RemoveButtonFromPalette (oButton. getAttribute ("id"));
		var sId = "custombuttons-template-button";
		var oPaletteButton;
		var cbpb = this. palette. getElementsByAttribute ("id", sId) [0];
		if (cbpb)
			oPaletteButton = cbpb. cloneNode (true);
		else
			oPaletteButton = document. createElement (oButton. nodeName);
		this. copyAttributes (oButton, oPaletteButton);
		this. palette. appendChild (oPaletteButton);
	},

	persistCurrentSets: function (toolbarId, buttonId, newButtonId)	{
		// Firefox 29+ (Australis)
		if ("CustomizableUI" in window)
			try	{
				var placement = CustomizableUI. getPlacementOfWidget (buttonId);
				var area = placement && placement. area;
				var pos	 = placement && placement. position;
				if (newButtonId) {
					CustomizableUI. addWidgetToArea (
						newButtonId,
						area || CustomizableUI.AREA_NAVBAR,
						typeof pos == "number" ? pos + 1 : undefined
					);
				} else if (placement) {
					CustomizableUI. removeWidgetFromArea (buttonId);
				}
			} catch(e) {
				Components.utils.reportError(e);
			}

		var toolbar = document. getElementById (toolbarId);
		//Исправляем currentSet для toolbar
		var cs = toolbar. getAttribute ("currentset");
		var ar = cs. split (",");
		var ind = ar. indexOf (buttonId);
		if (ind != -1) {
			if (newButtonId)
				ar. splice (ind, 1, buttonId, newButtonId);
			else
				ar. splice (ind, 1);
			cs = ar. join (",");
		}
		toolbar. setAttribute ("currentset", cs);
		document. persist (toolbarId, "currentset");

		//если это custom-toolbar, то исправляем атрибуты в toolbarSet...
		var customindex = toolbar. getAttribute ("customindex");
		if (customindex > 0) {
			var attrName = "toolbar" + customindex;
			var toolbarSet = document. getElementById ("customToolbars");
			var oldSet = toolbarSet. getAttribute (attrName);
			cs = oldSet. substring (0, oldSet. indexOf (":") + 1) + cs;
			toolbarSet. setAttribute (attrName, cs);
			document. persist ("customToolbars", attrName);
		}
		//Исправления для AIOS
		if (document. getElementById ("aiostbx-belowtabs-toolbox"))
			persistCurrentSets ();
	},

	_cloneButton: function (oNewButton, sParentToolbarId, sClonedButtonId) {
		var oParentToolbar = document. getElementById (sParentToolbarId);
		var oClonedButton = oParentToolbar. getElementsByAttribute ("id", sClonedButtonId) [0];
		if (!oClonedButton)
			oClonedButton = document. getElementById (sClonedButtonId);
		if (!oClonedButton)
			return;
		var oClone = this. cbCloneNode (oNewButton);
		oClonedButton. parentNode. insertBefore (oClone, oClonedButton. nextSibling);
		if (this. shouldAddToPalette)
			this. AddButtonToPalette (oClone);
	},

	cloneButton: function (oClonedButton, asEmpty) {
		var sParentToolbarId = oClonedButton. parentNode. id;
		var sClonedButtonId = oClonedButton. getAttribute ("id");
		var sNewButtonId = this. cbService. cloneButton (oClonedButton, asEmpty);
		this. persistCurrentSets (sParentToolbarId, sClonedButtonId, sNewButtonId);
	},

	_removeButton: function (sParentToolbarId, sRemovedButtonId) {
		var oParentToolbar, oRemovedButton;
		var cButtonsToRemove = this. findButtons (sRemovedButtonId);
		var bRemoveFromOverlay = (cButtonsToRemove. length <= 1);
		if (sParentToolbarId)
			oParentToolbar = document. getElementById (sParentToolbarId);
		if (oParentToolbar)
			oRemovedButton = oParentToolbar. getElementsByAttribute ("id", sRemovedButtonId) [0];
		if (!oRemovedButton)
			oRemovedButton = document. getElementById (sRemovedButtonId);
		if (oRemovedButton) {
			try {
				oRemovedButton. destroy ("delete");
			} catch (oErr) {}
			oRemovedButton. parentNode. removeChild (oRemovedButton);
		}
		if (bRemoveFromOverlay)
			this. RemoveButtonFromPalette (sRemovedButtonId);
	},

	removeButton: function (oRemovedButton)	{
		var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
		var str = document. getElementById ("cbStrings"). getString ("RemoveConfirm"). replace (/%s/gi, oRemovedButton. name);
		if (!ps. confirm (null, "Custom Buttons", str))
			return;
		var sParentToolbarId = oRemovedButton. parentNode. id;
		var sRemovedButtonId = oRemovedButton. getAttribute ("id");
		var cButtonsToRemove = document. getElementsByAttribute ("id", sRemovedButtonId);
		var bRemoveFromOverlay = (cButtonsToRemove. length == 1);
		this. cbService. removeButton (oRemovedButton, bRemoveFromOverlay);
		this. persistCurrentSets (sParentToolbarId, sRemovedButtonId, null);
	},

	cbCloneNode: function (node) {
		var oClone = document. createElement (node. nodeName);
		this. copyAttributes (node, oClone);
		oClone. setAttribute ("removable", "true"); // Firefox >= 3.7
		return oClone;
	},

	// nsIObserver interface
	observe: function (oSubject, sTopic, sData)	{
		var ta = sData. split (":");
		var topic = sTopic. replace (this. notificationPrefix, "");
		var btn;
		switch (topic) {
			case "removeButton":
				this. _removeButton (ta [0], ta [1]);
				break;
			case "cloneButton":
				this. _cloneButton (oSubject, ta [0], ta [1]);
				break;
			case "installButton":
			case "updateButton":
				var newButton, winButton;
				var sId = oSubject. getAttribute ("id");
				var winButtons = this. findButtons (sId);
				if (winButtons. length != 0) {
					for (var i = 0; i < winButtons. length; i++) {
						newButton = this. cbCloneNode (oSubject);
						winButton = winButtons [i];
						try	{
							winButton. destroy ("update");
						} catch (e)	{
							Components. utils. reportError ("Custom Buttons: " + [oSubject, sTopic, sData, e, e. stack]. join ("\n"));
						}
						winButton. parentNode. replaceChild (newButton, winButton);
					}
				}
				newButton = this. cbCloneNode (oSubject);
				if ((topic != "updateButton") || this. shouldAddToPalette)
					this. AddButtonToPalette (newButton);
				break;
			case "edit:focus":
			case "edit:blur":
			case "edit:done":
			case "edit:save":
				this. handleEditorNotification (topic, sData);
				break;
		}
	},

	setButtonAttribute: function (sId, sAttribute, sValue) {
		if (!sId)
			return;
		var btn = document. getElementById (sId);
		if (btn)
			btn. setAttribute (sAttribute, sValue);
	},

	handleEditorNotification: function (topic, sData) {
		var btn;
		switch (topic) {
			case "edit:focus":
			case "edit:blur":
				this. setButtonAttribute (sData, "cb-edit-state", (topic == "edit:focus"? "active": "inactive"));
				break;
			case "edit:done":
				if (sData) {
					btn = document. getElementById (sData);
					if (btn) {
						btn. removeAttribute ("cb-edit-state");
						btn. removeAttribute ("cb-last-saved");
					}
				}
				break;
			case "edit:save":
				var lastSavedButton = document. getElementsByAttribute ("cb-last-saved", "true") [0];
				if (lastSavedButton)
					lastSavedButton. removeAttribute ("cb-last-saved");
				this. setButtonAttribute (sData, "cb-last-saved", "true");
				break;
		}
	},

	getButtonById: function (id) {
		var id2 = (isFinite (id)? "custombuttons-button": "") + id;
		return this. palette. getElementsByAttribute ("id", id2) [0] || null;
	},

	getButtonByNumber: function (num) {
		return document. getElementById ("custombuttons-button" + num);
	},

	addButton: function (event) {
		if (event)
			event. stopPropagation ();
		this. openEditor ("");
	},

	editButton: function (oBtn)	{
		var oButton = oBtn || this. popupNode;
		this. openEditor (oButton);
	},

	makeButtonLink: function (action, sButtonId) {
		return this. cbService. makeButtonLink (document. documentURI, action, sButtonId);
	},

	openEditor: function (oButton) {
		var link = this. makeButtonLink ("edit", oButton? oButton. id: "");
		this. cbService. editButton (window, link, null);
	},

	updateButton: function () {
		var oButton = this. popupNode;
		if (!oButton)
			return;
		var loadContext = document. defaultView.
			QueryInterface (Components. interfaces. nsIInterfaceRequestor).
			getInterface (Components. interfaces. nsIWebNavigation).
			QueryInterface (Components. interfaces. nsILoadContext);
		var sURI = this. cbService. readFromClipboard (loadContext);
		var link = this. makeButtonLink ("update", oButton. id);
		this. cbService. updateButton (link, sURI);
	},

	doButtonOperation: function (sOperation) {
		var oButton;
		oButton = this. popupNode;
		if (!oButton)
			return;
		switch (sOperation)	{
			case "clone":
				this. cloneButton (oButton, false);
				break;
			case "remove":
				this. removeButton (oButton);
				break;
		}
	},

	copyURI: function () {
		this. cbService. writeToClipboard (this. popupNode. URI);
	},

	getNumber: function (id) {
		if (id. indexOf ("custombuttons-button") != -1)
			return id. substring ("custombuttons-button". length);
		return "";
	},

	execute_oncommand_code: function (code, button) {
		custombutton. buttonCbExecuteCode ({}, button, code);
	},

	onKeyPress: function (event) {
		var windowId = this. cbService. getWindowId (document. documentURI);
		var cbd = Components. classes ["@xsms.nm.ru/custombuttons/cbkeymap;1" /* CB_KEYMAP_SERVICE_CID */]. getService (Components. interfaces. cbIKeyMapService /* CB_KEYMAP_SERVICE_IID */);
		var lenobj = {};
		var ids = cbd. Get (windowId, event, /*prefixedKey,*/ lenobj);
		if (ids. length == 0)
			return;
		var mode = (ids. shift () == "true");
		if (mode) {
			event. stopPropagation ();
			event. preventDefault ();
		}
		for (var i = 0; i < ids. length; i++) {
			try	{
				document. getElementById (ids [i]). cbExecuteCode ();
			} catch (e)	{
				Components. utils. reportError ("Custom Buttons: " + [event, e, e. stack]. join ("\n"));
			}
		}
	},

	handleMenuClick: function (event) {
		if ((event. button != 1) &&
			!((event. button == 0) && event. ctrlKey))
			return;
		var oButton = this. popupNode;
		if (!oButton)
			return;
		event. preventDefault ();
		event. stopPropagation ();
		event. target. parentNode. hidePopup ();
		this. cloneButton (oButton, true);
	},

	onClick: function (event) {},

	/* EventHandler interface */
	handleEvent: function (event) {
		switch (event. type) {
			case "load":
				this. init ();
				break;
			case "unload":
				this. close ();
				break;
			case "keypress":
				this. onKeyPress (event);
				break;
			case "click":
				this. onClick (event);
				break;
			default:
				break;
		}
	},

	/**	 bookmarkButton(  )
		 Author George Dunham

		 Args:
		 Returns: Nothing
		 Scope:	 private
		 Called:   from overlay.xul
		 Purpose: Allows one to save a button as a bookmark
		 UPDATED: 11/12/2007 to improve stability.
		 changed by Anton 24.02.08
	**/
	bookmarkButton: function (oBtn)	{
		var Button = (oBtn)? oBtn: this. popupNode;
		this. makeBookmark (Button. URI, Button. name);
	},

	makeBookmark: function (CbLink, sName) {
		if ("BookmarksUtils" in window)
			BookmarksUtils. addBookmark (CbLink, sName);
		else {
			var uri = Components. classes ["@mozilla.org/network/simple-uri;1"]. createInstance (Components. interfaces. nsIURI); // since there was 'bookmarkLink' execution problem
			uri. spec = CbLink; // it seems nsIURI spec re-passing solves it
			PlacesCommandHook. bookmarkLink (PlacesUtils. bookmarksMenuFolderId, uri. spec, sName);
		}
	}
};

// init custombuttons object in dependence of application and window
(function () {
	var oBookmarkButtonMenuitem;
	var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
	var oVC = Components. classes ["@mozilla.org/xpcom/version-comparator;1"]. createInstance (Components. interfaces. nsIVersionComparator);
	switch (document. documentURI) {
		case "chrome://browser/content/browser.xul": // Firefox, Flock
			if (oVC. compare ("3.0a1", info. version) <= 0)	{
				custombuttons. makeBookmark = function (CbLink, sName) {
					var uri = Components. classes ["@mozilla.org/network/simple-uri;1"]. createInstance (Components. interfaces. nsIURI); // since there was 'bookmarkLink' execution problem
					uri. spec = CbLink; // it seems nsIURI spec re-passing solves it
					PlacesCommandHook. bookmarkLink (PlacesUtils. bookmarksMenuFolderId, uri. spec, sName);
				};
				if (oVC. compare ("3.1b3", info. version) <= 0)
					custombuttons. shouldAddToPalette = false;
			}
			break;
		case "chrome://navigator/content/navigator.xul": // Seamonkey
			custombuttons. makeBookmark = function (CbLink, sName) {
				var uri = Components. classes ["@mozilla.org/network/simple-uri;1"]. createInstance (Components. interfaces. nsIURI); // since there was 'bookmarkLink' execution problem
				if ("BookmarksUtils" in window)
					BookmarksUtils. addBookmark (CbLink, sName);
				else {
					uri. spec = CbLink; // it seems nsIURI spec re-passing solves it
					PlacesCommandHook. bookmarkLink (PlacesUtils. bookmarksMenuFolderId, uri. spec, sName);
				}
			};
			custombuttons. shouldAddToPalette = false;
			break;
		case "chrome://messenger/content/messenger.xul": // Seamonkey, Thunderbird
		case "chrome://messenger/content/messageWindow.xul": // Seamonkey, Thunderbird
			window. addEventListener ("click", custombuttons, true);
			custombuttons. onClick = function (event) {
				var href;
				var target = event. target;
				if ((target instanceof HTMLAnchorElement) ||
					(target instanceof HTMLAreaElement) ||
					(target instanceof HTMLLinkElement)) {
					if (target. hasAttribute ("href"))
						href = target. href;
				} else {
					var linkNode = event. originalTarget;
					while (linkNode && !(linkNode instanceof HTMLAnchorElement))
						linkNode = linkNode. parentNode;
					if (linkNode)
						href = linkNode. href;
				}
				if (href && (href. indexOf ("custombutton://") == 0)) {
					var mode = this. cbService. mode;
					if (!(mode & 128 /* CB_MODE_INSTALL_BUTTONS_FROM_EMAIL */))
						return;
					event. preventDefault ();
					event. stopPropagation ();
					this. cbService. installWebButton (null, href, true);
				}
			};
		case "chrome://messenger/content/messengercompose.xul": // Seamonkey, Thunderbird
		case "chrome://messenger/content/messengercompose/messengercompose.xul": // Seamonkey 2.1b2pre
			custombuttons. toolbarpaletteName = "MailToolbarPalette";
			if ((document. documentURI == "chrome://messenger/content/messengercompose.xul") ||
				(document. documentURI == "chrome://messenger/content/messengercompose/messengercompose.xul"))
				custombuttons. toolbarpaletteName = "MsgComposeToolbarPalette";
			custombuttons. init = (function (fn) {
				return function () {
					fn. apply (custombuttons, []);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton-sub");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
				};
			}) (custombuttons. init);
			custombuttons. __defineGetter__ (
				"gToolbox",
				function ()	{
					return document. getElementById ("mail-toolbox") || // main window and message window
					document. getElementById ("compose-toolbox"); // compose message
				}
			);
			custombuttons. openEditor = function (oButton) {
				var mode = "";
				var param;
				if ("gCurrentMode" in window) {
					mode = window ["gCurrentMode"];
					var mb = document. getElementById ("modeBroadcaster");
					mode = mode || (mb? mb. getAttribute ("mode"): "");
					if (this. popupNode && (this. popupNode. nodeName == "toolbar")) {
						if (this. popupNode. id == "mode-toolbar")
							mode = "mode";
						else if (this. popupNode. id == "calendar-toolbar")
							mode = "calendar";
						else if (this. popupNode. id == "task-toolbar")
							mode = "task";
					}
				}
				if (mode) {
					param = {};
					param ["attributes"] = {};
					param. attributes ["mode"] = mode;
					param. wrappedJSObject = param;
				}
				var link = this. makeButtonLink ("edit", oButton? oButton. id: "");
				this. cbService. editButton (window, link, param);
			};
			custombuttons. makeBookmark = function () {};
			if (info. name == "SeaMonkey")
				custombuttons. shouldAddToPalette = false;
			if ((info. name == "Thunderbird") && (oVC. compare ("3.0", info. version) <= 0))
				custombuttons. shouldAddToPalette = false;
			break;
		case "chrome://sunbird/content/calendar.xul": // Sunbird
		case "chrome://calendar/content/calendar.xul": // Sunbird
			custombuttons. toolbarpaletteName = "calendarToolbarPalette";
			custombuttons. shouldAddToPalette = true;
			custombuttons. __defineGetter__	(
				"gToolbox",
				function () {
					return document. getElementById ("calendar-toolbox"); // calendar
				}
			);
			custombuttons. makeBookmark = function () {};
			custombuttons. init = (function (fn) {
				return function () {
					fn. apply (custombuttons, []);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton-sub");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
				};
			}) (custombuttons. init);
			if (oVC. compare ("1.0b2pre", info. version) <= 0)
				custombuttons. shouldAddToPalette = false;
			break;
		case "chrome://editor/content/editor.xul": // KompoZer
			custombuttons. toolbarpaletteName = "NvuToolbarPalette";
			custombuttons. shouldAddToPalette = true;
			custombuttons. __defineGetter__	(
				"gToolbox",
				function ()	{
					return document. getElementById ("EditorToolbox"); // calendar
				}
			);
			custombuttons. makeBookmark = function () {};
			custombuttons. init = (function (fn) {
				return function () {
					fn. apply (custombuttons, []);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
					oBookmarkButtonMenuitem = document. getElementById ("custombuttons-contextpopup-bookmarkButton-sub");
					oBookmarkButtonMenuitem. parentNode. removeChild (oBookmarkButtonMenuitem);
				};
			}) (custombuttons. init);
			break;
	}
}) ();

// add-ons
/**	 uChelpButton(	)
	 Author Yan, George Dunham

	 Args:
	 Returns: Nothing
	 Scope:	 private
	 Called:	 By:
	 1. Custom buttons context menu.
	 Purpose: To:
	 1. Display the button's help text.
	 2. Insert the help data into the clipboard.
	 TODO: Provide a means to display help in the form of
	 web page.
	 Add
	 changed by Anton 24.02.08
	 TODO: refactor it
	 UPDATED: 16.03.08 by Anton - uChelpButton should not use global clipboard
	 UPDATED: 03.04.08 by Anton - now we have 'name' field in buttons
**/
custombuttons.uChelpButton = function ( oBtn ) //{{
{
	// UPDATED: 11/8/2007 to accept oBtn as an arg.
	var Button = ( oBtn )? oBtn : this. popupNode;
	var bId = this.getNumber(Button.id); // <---
	var str = Button.getAttribute( "Help" ).split( "[,]" )[0] || Button.getAttribute( "help" ).split( "," )[1];

	var hlpTitle = document. getElementById ("cbStrings"). getString ("ButtonHelpTitle"). replace (/%s/gi, Button. name);
	hlpTitle = hlpTitle. replace (/%y/gi, bId);
	var hlp = createMsg(hlpTitle);
	str = str. replace (/\<label\>/gi, Button. name). replace (/\<id\>/gi, bId);
	hlp. aMsg (str);
}; //}}} End Method uChelpButton( )

// Custombuttons utils
var custombuttonsUtils = {
	addMethodGate: function (srcObject, sMethodName, dstObject)	{
		dstObject [sMethodName] = function () {
			return function () {
				return srcObject [sMethodName]. apply (srcObject, arguments);
			};
		} ();
	},

	/**	 createMsg( [title] )
		 Author:	George Dunham aka: SCClockDr

		 Scope:		global
		 Args:		title - Optional Title to init the object with.
		 Returns:	Msg
		 Called by:	1. Any process wanting to instance this message object.
		 Purpose:	1. Create a message object and return it to the caller process.
		 How it works:	gMsg uses the constructor method to create an object gMsg
		 Setup:		MyObj = new gMsg();
		 Use:		MyObj.aMsg("Any string", ["Optional Title"]);
		 changed by Anton 24.02.08
		 TODO: refactor it
	**/
	createMsg: function (title) //{{
	{
		/**	 Object Msg
			 Author:	George Dunham aka: SCClockDr

			 Scope:		Public
			 Properties:	prompts - nsIPromptService
			 check - Provides a check box if value = true.
			 sTitle - Retains the default/assigned title for the
			 Dialog box.
			 Methods:	aMsg - Displays the dialog box.
			 Purpose:	1. Provide a better means to alert the operator.
		**/
		var Msg = { //{{
			// Properties:
			prompts: Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService),
			check:{value: false},
			sTitle:"Custom Buttons",
			button:false,
			// Methods
			/**	 aMsg( str, [title] )

				 Scope:		global
				 Args:		str - String to display
				 title - Optional title of the dialog
				 Returns:	Nothing
				 Called by:	1. Any process which has the aMsg object
				 available
				 Purpose:	1. Present a confirm dialog.
			**/
			aMsg:function ( str, title ) //{{
			{
				if (typeof title == "string"){this.sTitle = title;}
				var flags = this.prompts.BUTTON_POS_0 * this.prompts.BUTTON_TITLE_IS_STRING;
				var button = this.prompts.confirmEx(null, this.sTitle, str, flags, document. getElementById ("cbStrings"). getString ("ContinueButton"), "", "", "", this.check);
			} //}}} End Method aMsg( str, [title] )


		}; //}}} End Object Msg
		if (typeof title == "string"){Msg.sTitle = title;}
		return Msg;
	}, //}}} End createMsg( [title] )

	get ps ()
	{
		return Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService);
	},

	/*--------------------------- Preference Utilities ---------------------------*/

	/**	 isPref( sPrefId, aDefault )
		 Author	 George Dunham

		 Args:	 aprefId - Preference ID string
		 aDefault - Default Preference Value
		 Returns: lRet - Boolean, true if the preference exists.
		 Scope:	 public
		 Called:	 By:
		 1. Any process which passes aprefId and will accept
		 a boolean return.
		 2. Passing the optional [Default] will cause the pref
		 to be created if not defined.
		 Purpose: To:
		 1. Test for the presence of a specified pref.
		 NOTE: Inserted with ver. 2.0.02a
	**/
	isPref: function ( sPrefId, aDefault ) //{{
	{
		try{
			var lRet = (this.getPrefs( sPrefId ) !== null ); // UPDATED: 11/29/2007
			if ( typeof aDefault != "undefined" && !lRet ) {
				this.setPrefs( sPrefId, aDefault );
				lRet = true;
			} // End if ( typeof aDefault != CB2const.VOID && !rRet )
		}
		catch(e) {
			Components. utils. reportError ("Custom Buttons: " + [sPrefId, aDefault, e, e. stack]. join ("\n"));
		}
		return lRet;
	}, //}}} End Method isPref( sPrefId, aDefault )
	/**	 getPrefs( sPrefId )
		 Author	 George Dunham

		 Args:	 sPrefId - Preference ID string
		 Returns: rRet - Preference value in the correct type.
		 1. null if Preference ID not in about:config list.
		 Scope:	 public
		 Called:	 By:
		 1. Any process passing a prefid string and accepting
		 its value.
		 Purpose: To:
		 1. Return the pref specified in sPrefId
		 NOTE: Inserted with ver. 2.0.02a
	**/
	getPrefs: function ( sPrefId ) //{{
	{
		var rRet = null;
		var nsIPrefBranchObj = this.ps.getBranch( null );
		switch ( nsIPrefBranchObj.getPrefType( sPrefId ) ){
			case 32: // string
				rRet = nsIPrefBranchObj.getCharPref( sPrefId );
				break;
			case 64: // number
				rRet = nsIPrefBranchObj.getIntPref( sPrefId );
				break;
			case 128: // boolean
				rRet = nsIPrefBranchObj.getBoolPref( sPrefId );
				break;
			default:
				rRet = null;
		}
		return rRet;
	}, //}}} End Method getPrefs( sPrefId )
	/**	 setPrefs( sPrefId, prefValue )
		 Author	 George Dunham

		 Args:	 sPrefId - Preference ID string
		 prefValue - Value to set into the Preference ID.
		 Returns: Nothing
		 Scope:	 public
		 Called by:
		 1. Any process which passes a pref id and it's new value.
		 Purpose: To:
		 1. Modify the specified pref to the passed value.
		 NOTE: Inserted with ver. 2.0.02a
	**/
	setPrefs: function ( sPrefId, prefValue ) //{{
	{
		var nsIPrefBranchObj = this.ps.getBranch(null);
		switch (typeof prefValue){
			case "undefined":
				break;
			case "string":
				nsIPrefBranchObj.setCharPref( sPrefId, prefValue );
				this.ps.savePrefFile( null );
				break;
			case "number":
				nsIPrefBranchObj.setIntPref( sPrefId, prefValue );
				this.ps.savePrefFile( null );
				break;
			case "boolean":
				nsIPrefBranchObj.setBoolPref( sPrefId, prefValue );
				this.ps.savePrefFile( null );
				break;
			default:
		}
	}, //}}} End Method setPrefs( sPrefId, prefValue )

	/**	 clearPrefs( sPrefId )
		 Author:	George Dunham aka: SCClockDr
		 Scope:		global
		 Args:		sPrefId - Preference ID string

		 Returns:	Nothing
		 Called by: 1.
		 Purpose:	1. Clear specified User preference
		 changed by Anton 09.04.2011
	*/
	clearPrefs: function(sPrefId) //{{
	{
		var nsIPrefBranchObj = this.ps.getBranch(null);
		try
		{
			nsIPrefBranchObj.clearUserPref(sPrefId);
			this.ps.savePrefFile( null );
		} catch (e) {}
	}, //}}} End Method clearPrefs( sPrefId )

	/**	 readFile( fPath )
		 Author:	George Dunham aka: SCClockDr
		 Scope:		private
		 Args:		fPath -
		 Returns:	sRet
		 Called by: 1.
		 Purpose:	1.
		 TODO:		1.
		 changed by Anton 25.02.08
	*/
	readFile: function(fPath) //{{
	{
		var sRet = null;
		var file = null;
		try {
			fPath = (fPath.indexOf(':\\') > -1 )? fPath.replace(/\//g,'\\') : fPath;
			file = Components. classes ["@mozilla.org/file/local;1"]. createInstance (Components. interfaces. nsILocalFile);
			file.initWithPath( fPath );
			var fis = Components. classes ["@mozilla.org/network/file-input-stream;1"]. createInstance (Components. interfaces. nsIFileInputStream);
			fis.init( file,0x01, 4, null);
			var sis = Components. classes ["@mozilla.org/scriptableinputstream;1"]. createInstance (Components. interfaces. nsIScriptableInputStream);
			sis.init( fis );
			sRet = sis.read( sis.available() );
			sis. close ();
		} catch (e) {
			Components. utils. reportError ("Custom Buttons: " + [fPath, e, e. stack]. join ("\n"));
		}
		return sRet;
	}, //}}} End Method readFile( fPath )

	/**	 writeFile( fPath, sData )
		 Author:	George Dunham aka: SCClockDr
		 Scope:		private
		 Args:		fPath -
		 sData -
		 Returns:	Nothing
		 Called by: 1.
		 Purpose:	1.
		 TODO:		1.
	*/
	writeFile: function(fPath, sData) //{{
	{
		try{
			fPath = (fPath.indexOf(':\\') > -1 )? fPath.replace(/\//g,'\\') : fPath;
			var file = Components. classes ["@mozilla.org/file/local;1"]. createInstance (Components. interfaces. nsILocalFile);
			file.QueryInterface(Components.interfaces.nsIFile);
			file.initWithPath( fPath );
			if( file.exists() == true ) file.remove( false );
			var strm = Components. classes ["@mozilla.org/network/file-output-stream;1"]. createInstance (Components. interfaces. nsIFileOutputStream);
			strm.QueryInterface(Components.interfaces.nsIOutputStream);
			strm.QueryInterface(Components.interfaces.nsISeekableStream);
			strm.init( file, 0x04 | 0x08, 420, 0 );
			strm.write( sData, sData.length );
			strm.flush();
			strm.close();
		}catch(e){
			Components. utils. reportError ("Custom Buttons: " + [fPath, e, e. stack]. join ("\n"));
			this. notifyError (fPath, "---", e, e. stack);
		}
	},

	gClipboard:
	{
		_cbService: Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */]. getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */),
		_cbClipboard: [],

		Write: function (str)
		{
			this. _cbClipboard [0] = str;
		},

		Clear: function ()
		{
			this. Write ("");
		},

		Read: function ()
		{
			return this. _cbClipboard [0] || "";
		},

		write: function (str)
		{
			this. _cbService. writeToClipboard (str);
		},

		clear: function ()
		{
			this. write ("");
		},

		read: function ()
		{
			var loadContext = document. defaultView.
				QueryInterface (Components. interfaces. nsIInterfaceRequestor).
				getInterface (Components. interfaces. nsIWebNavigation).
				QueryInterface (Components. interfaces. nsILoadContext);
			return this. _cbService. readFromClipboard (loadContext);
		}
	},

	makeXML: function (xmlObject) {
		var res = null;
		var oldPrettyPrinting = XML. prettyPrinting;
		XML. prettyPrinting = false;
		try	{
			if (typeof (xmlObject) == "string")
				xmlObject = new XML (xmlObject);
			res = new DOMParser (). parseFromString	(
				xmlObject. toXMLString (),
				"application/xml"
			). documentElement;
		} catch (e) {}
		XML. prettyPrinting = oldPrettyPrinting;
		return res;
	},

	notifyError: function () {
		Components. utils. reportError ("Custom Buttons: " + arguments. join ("\n"));
	}

}; // -- custombuttonsUtils

// Custombuttons API

var createMsg = custombuttonsUtils. createMsg;
var gClipboard = custombuttonsUtils. gClipboard;

custombuttonsUtils. addMethodGate (custombuttonsUtils, "isPref", custombuttons);
custombuttonsUtils. addMethodGate (custombuttonsUtils, "getPrefs", custombuttons);
custombuttonsUtils. addMethodGate (custombuttonsUtils, "setPrefs", custombuttons);
custombuttonsUtils. addMethodGate (custombuttonsUtils, "clearPrefs", custombuttons);
custombuttonsUtils. addMethodGate (custombuttonsUtils, "readFile", custombuttons);
custombuttonsUtils. addMethodGate (custombuttonsUtils, "writeFile", custombuttons);

window. addEventListener ("load", custombuttons, false);
window. addEventListener ("unload", custombuttons, false);
window. addEventListener ("keypress", custombuttons, true);
