/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

function Editor () {}
Editor. prototype = {
	opener: null,
	cbService: null,
	notificationPrefix: "",
	param: {},
	CNSISS: Components. interfaces. nsISupportsString,
	tempId: "",
	state: "inactive",
	lastSaved: false,

	QueryInterface: function (iid) {
		if (iid. equals (Components. interfaces. nsIObserver) ||
			iid. equals (Components. interfaces. nsIDOMEventListener) ||
			iid. equals (Components. interfaces. nsIEditorObserver) ||
			iid. equals (Components. interfaces. nsIWeakReference) ||
			iid. equals (Components. interfaces. nsISupports))
			return this;
		return Components. results. NS_ERROR_NO_INTERFACE;
	},

	_changed: false,

	get saveButton () {
		return document. documentElement. getButton ("extra2");
	},

	get changed () {
		return this. _changed;
	},

	set changed (val) {
		if (val && !this. _changed)
			document. title = "* " + document. title;
		else if (!val && this. _changed)
			document. title = document. title. replace (/^\* /, "");
		this. _changed = val;
		if (val)
			this. saveButton. removeAttribute ("disabled");
		else
			this. saveButton. setAttribute ("disabled", "true");
	},

	/* nsIEditorObserver */
	EditAction: function ()	{
		this. changed = true;
	},

	QueryReferent: function (iid) {
		return this. QueryInterface (iid);
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

	sendButtonHighlightNotification: function (reason) {
		if (reason == "save")
			this. lastSaved = true;
		else
			this. state = reason;
		this. notifyObservers (null, "edit:" + reason, this. param. id);
	},

	getParam: function () {
		if (!window. arguments || !window. arguments [0]) {
			var ios = Components. classes ["@mozilla.org/network/io-service;1"]. getService (Components. interfaces. nsIIOService);
			var url = ios. newURI (document. documentURI, null, null);
			url = url. QueryInterface (Components. interfaces. nsIURL);
			var q = url. query || "";
			var windowId = q. match (/&?window=(\w*?)&?/);
			var buttonId = q. match (/&?id=(custombuttons-button\d+)&?/);
			var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
			windowId = windowId? windowId [1]: info. name;
			if (windowId. indexOf (info. name) != 0)
				windowId = info. name;
			buttonId = buttonId? buttonId [1]: "";
			var link = "custombutton://buttons/" + windowId + "/edit/" + buttonId;
			this. param = this. cbService. getButtonParameters (link). wrappedJSObject;
		}
		else
			this. param = window. arguments [0]. wrappedJSObject;
	},

	addObservers: function () {
		this. addObserver ("updateImage");
		this. addObserver ("setEditorParameters");
		this. addObserver ("updateButton");
		this. addObserver ("edit:another-instance-exists");
		this. addObserver ("edit:save");
		this. addObserver ("custombuttons-initialized");
		document. getElementById ("code"). addEditorObserver (this);
		document. getElementById ("initCode"). addEditorObserver (this);
		document. getElementById ("help"). addEditorObserver (this);
	},

	removeObservers: function () {
		document. getElementById ("code"). removeEditorObserver (this);
		document. getElementById ("initCode"). removeEditorObserver (this);
		document. getElementById ("help"). removeEditorObserver (this);
		this. removeObserver ("custombuttons-initialized");
		this. removeObserver ("edit:save");
		this. removeObserver ("edit:another-instance-exists");
		this. removeObserver ("updateButton");
		this. removeObserver ("setEditorParameters");
		this. removeObserver ("updateImage");
	},

	addEventListeners: function () {
		window. addEventListener ("mousedown", this, true);
		window. addEventListener ("focus", this, true);
		window. addEventListener ("blur", this, true);
	},

	removeEventListeners: function () {
		window. removeEventListener ("blur", this, true);
		window. removeEventListener ("focus", this, true);
		window. removeEventListener ("mousedown", this, true);
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

	getOpener: function () {
		var res = window. opener;
		if (!res)
			res = this. getTopLevelWindow ();
		return res;
	},

	setWindowPositionAndSize: function () {
		if (window != this. getTopLevelWindow ()) // the editor is opened in some other window
			return;
		var rs = Components. classes ["@mozilla.org/rdf/rdf-service;1"]. getService (Components. interfaces. nsIRDFService);
		var ds = rs. GetDataSource ("rdf:local-store");
		var res1 = rs. GetResource ("chrome://custombuttons/content/editor.xul#custombuttonsEditor");
		// window manager may ignore screenX and screenY, so let's move window manually
		var x = document. getElementById ("custombuttonsEditor"). getAttribute ("screenX");
		var y = document. getElementById ("custombuttonsEditor"). getAttribute ("screenY");
		if (!x || !y) {
			var res2 = rs. GetResource ("screenX");
			x = ds. GetTarget (res1, res2, true);
			void (x instanceof Components. interfaces. nsIRDFLiteral);
			x = x && x. Value || null;
			res2 = rs. GetResource ("screenY");
			y = ds. GetTarget (res1, res2, true);
			void (y instanceof Components. interfaces. nsIRDFLiteral);
			y = y && y. Value || null;
		}
		if (x && y)
			window. moveTo (x, y);

		var w = document. getElementById ("custombuttonsEditor"). getAttribute ("width");
		var h = document. getElementById ("custombuttonsEditor"). getAttribute ("height");
		if (!w || !h) {
			res2 = rs. GetResource ("width");
			w = ds. GetTarget (res1, res2, true);
			void (w instanceof Components. interfaces. nsIRDFLiteral);
			w = w && w. Value || 450;
			res2 = rs. GetResource ("height");
			h = ds. GetTarget (res1, res2, true);
			void (h instanceof Components. interfaces. nsIRDFLiteral);
			h = h && h. Value || 450;
			window. resizeTo (w, h);
		}
	},

	init: function () {
		this. cbService = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */]. getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */);
		this. getParam ();
		this. notificationPrefix = this. cbService. getNotificationPrefix (this. param. windowId);
		this. setValues ();
		document. getElementById ("name"). focus ();
		if (this. param. editorParameters)
			this. setEditorParameters (this. param);
		this. tempId = this. param. id || (new Date (). valueOf ());
		var ps = Components. classes ["@mozilla.org/preferences-service;1"]. getService (Components. interfaces. nsIPrefService). getBranch ("custombuttons.");
		var cbMode = this. cbService. mode;
		var sab = cbMode & 2 /* CB_MODE_SHOW_APPLY_BUTTON */;
		this. saveButton. setAttribute ("icon", "save");
		this. saveButton. setAttribute ("disabled", "true");
		if (this. param. newButton || !sab)
			this. saveButton. setAttribute ("hidden", "true");

		this. addObservers ();
		this. addEventListeners ();
		this. setWindowPositionAndSize ();
		this. sendButtonHighlightNotification ("focus");
	},

	setEditorParameters: function (param) {
		var editorParameters = param. wrappedJSObject. editorParameters;
		if (editorParameters instanceof Components. interfaces. nsISupportsArray) {
			window. focus ();
			var phase = editorParameters. GetElementAt (0). QueryInterface (Components. interfaces. nsISupportsString);
			var lineNumber = parseInt (editorParameters. GetElementAt (1). QueryInterface (Components. interfaces. nsISupportsString));
			var tabbox = document. getElementById ("custombuttons-editbutton-tabbox");
			tabbox. selectedIndex = (phase == "code")? 0: 1;
			var textboxId = (phase == "code")? "code": "initCode";
			var textbox = document. getElementById (textboxId);
			textbox. focus ();
			setTimeout (function () { textbox. selectLine (lineNumber); }, 0);
		}
		if (param. wrappedJSObject. updateButton == true) {
			this. param = param. wrappedJSObject;
			this. setValues ();
		}
	},

	setValues: function () {
		var field;
		for (var v in this. param) {
			field = document. getElementById (v);
			if (field && this. param [v])
				field. value = this. param [v];
		}
		document. getElementById ("code"). editor. transactionManager. clear ();
		document. getElementById ("initCode"). editor. transactionManager. clear ();
		var mode = this. param. mode;
		document. getElementById ("disableDefaultKeyBehavior"). checked = mode && (mode & 2 /* CB_MODE_DISABLE_DEFAULT_KEY_BEHAVIOR */) || false;
		if (this. param. newButton)
			document. title = this. cbService. getLocaleString ("AddButtonEditorDialogTitle");
		if (this. param. name)
			document. title += ": " + this. param. name;
		else if (this. param. id)
			document. title += ": " + this. param. id;
	},

	updateButton: function () {
		var uri = document. getElementById ("urlfield-textbox"). value;
		if (uri) {
			if (this. param. newButton)	{
				return this. cbService. installWebButton (this. param, uri, true);
			} else {
				var link = "custombutton://buttons/" + this. param. windowId + "/update/" + this. param. id;
				var res = this. cbService. updateButton (link, uri);
				if (res == 1) // Cancel
					return false;
				if (res == 0) { // Ok
					this. cbService. installButton (this. param);
					return true;
				} else { // Edit…
					document. getElementById ("urlfield-textbox"). value = "";
					return false;
				}
			}
		}
		var field;
		for (var v in this. param) {
			field = document. getElementById (v);
			if (field)
				this. param [v] = field. value;
		}
		this. param ["mode"] = document. getElementById ("disableDefaultKeyBehavior"). checked? 2 /* CB_MODE_DISABLE_DEFAULT_KEY_BEHAVIOR */: 0;
		this. notificationSender = true;
		this. cbService. installButton (this. param);
		this. notificationSender = false;
		this. sendButtonHighlightNotification ("save");
		return true;
	},

	get canClose () {
		if (!window. opener && !window. arguments)
			return false;
		return true;
	},

	acceptDialog: function () {
		var dialog = document. getElementById ("custombuttonsEditor");
		dialog. acceptDialog ();
	},

	onAccept: function () {
		if (this. updateButton ())
			return this. canClose;
		return false;
	},

	selectImage: function () {
		var fp = Components. classes ["@mozilla.org/filepicker;1"]. createInstance (Components. interfaces. nsIFilePicker);
		var fpdt = this. cbService. getLocaleString ("editorImageFilePickerDialogTitle");
		fp. init (window, fpdt, 0);
		fp. appendFilters (fp. filterImages);
		var res = fp. show ();
		if (res == fp. returnOK)
			document. getElementById ("image"). value = fp. fileURL. spec;
	},

	execute_oncommand_code: function ()	{
		var fe = document. commandDispatcher. focusedElement;
		var box = document. getElementById ("code");
		if (fe != box. textbox. inputField)
			return;
		var code = box. value;
		var opener = this. getOpener ();
		if (opener)	{
			var CB = opener. custombuttons;
			if (CB)	{
				var doc = opener. document;
				var button = doc. getElementById (this. param. id);
				if (button)
					CB. execute_oncommand_code (code, button);
				else
					this. cbService. alert ("ButtonDoesntExist");
				window. focus ();
			}
		}
	},

	observe: function (oSubject, sTopic, sData)	{
		var link = "custombutton://buttons/" + this. param. windowId + "/update/" + this. param. id;
		var topic = sTopic. replace (this. notificationPrefix, "");
		switch (topic) {
			case "updateImage":
				if ((sData == this. param. id) ||
					(sData == this. tempId)) {
					var array = oSubject. QueryInterface (Components. interfaces. nsISupportsArray);
					var contentType = array. GetElementAt (0). QueryInterface (Components. interfaces. nsISupportsString);
					var dataString = array. GetElementAt (1). QueryInterface (Components. interfaces. nsISupportsString);
					document. getElementById ("image"). value = "data:" + contentType. data + ";base64," + btoa (dataString. data);
				}
				break;
			case "setEditorParameters":
				var param = oSubject. wrappedJSObject;
				if (this. param. id == param. id)
					this. setEditorParameters (oSubject);
				break;
			case "updateButton":
				if (oSubject. getAttribute ("id") == this. param. id) {
					this. param = this. cbService. getButtonParameters (link). wrappedJSObject;
					if (!this. notificationSender)
						this. setValues ();
					this. changed = false;
				}
				break;
			case "edit:another-instance-exists":
				if (this. notificationSender)
					return;
				oSubject = oSubject. QueryInterface (Components. interfaces. nsISupportsPRBool);
				if (link == sData)
					oSubject. data = true;
				break;
			case "edit:save":
				if (this. param. id != sData)
					this. lastSaved = false;
				break;
			case "custombuttons-initialized":
				this. sendButtonHighlightNotification (this. state);
				if (this. lastSaved)
					this. sendButtonHighlightNotification ("save");
				break;
			default:;
		}
	},

	imageChanged: function () {
		if (!this. param. id || !this. notificationPrefix)
			return;
		var image_input = document. getElementById ("image");
		var aURL = Components. classes ["@mozilla.org/supports-string;1"]. createInstance (Components. interfaces. nsISupportsString);
		aURL. data = image_input. value;
		this. notifyObservers (aURL, "updateIcon", this. param. id);
	},

	convert_image: function () {
		var image_input = document. getElementById ("image");
		var aURL = image_input. value;
		if (aURL. indexOf ("custombuttons-stdicon") == 0) {
			aURL = window. getComputedStyle (image_input, null). getPropertyValue ("list-style-image");
			if (aURL. indexOf ("url(") == 0)
				aURL = aURL. substring (4, aURL. length - 1);
			else
				aURL = "";
			aURL = aURL. replace (/^"/, "");
			aURL = aURL. replace (/"$/, "");
		}
		this. cbService. convertImageToRawData (this. param. windowId, this. param. id || this. tempId, aURL);
	},

	checkForAnotherInstanceExists: function () {
		var link = "custombutton://buttons/" + this. param. windowId + "/update/" + this. param. id;
		var aie = Components. classes ["@mozilla.org/supports-PRBool;1"]. createInstance (Components. interfaces. nsISupportsPRBool);
		aie. data = false;
		this. notifyObservers (aie, "edit:another-instance-exists", link);
		return aie. data;
	},

	switchAccessKeysState: function () {
		var flag = (document. activeElement == document. getElementById ("accelkey"). inputField);
		var attributeToRemove = flag? "accesskey": "_accesskey";
		var attributeToSet = flag? "_accesskey": "accesskey";
		var nodes = document. getElementsByAttribute (attributeToRemove, "*");
		var node;
		while (nodes. length != 0) {
			node = nodes [0];
			if (!node. style. width)
				node. style. width = node. boxObject. width + "px";
			node. setAttribute (attributeToSet, node. getAttribute (attributeToRemove));
			node. removeAttribute (attributeToRemove);
		}
	},

	_destroyed: false,
	destroy: function () {
		if (this. _destroyed)
			return;
		this. removeEventListeners ();
		var aie = this. checkForAnotherInstanceExists ();
		this. sendButtonHighlightNotification (aie? "blur": "done");
		this. removeObservers ();
		this. _destroyed = true;
	},

	// next field and method are needed to rewind focus to active element
	// if "Cancel" button will be pressed twice
	// I think there should be more easiest way to do it
	// but I don't know it
	lastFocused: null,

	handleEvent: function (event) {
		switch (event. type) {
			case "mousedown":
				var cbtn = document. getElementById ("custombuttonsEditor"). getButton ("cancel");
				if (event. originalTarget == cbtn)
					this. lastFocused = document. activeElement;
				break;
			case "focus":
			case "blur":
				this. switchAccessKeysState ();
				this. sendButtonHighlightNotification (event. type);
				break;
			default:;
		}
	},

	onCancel: function () {
		var RES_SAVE = 0;
		var RES_CANCEL = 1;
		var RES_DONT_SAVE = 2;
		var res;
		if (this. changed) {
			var ps = Components. classes ["@mozilla.org/embedcomp/prompt-service;1"]. getService (Components. interfaces. nsIPromptService);
			var aButtonFlags = ps. BUTTON_POS_0 * ps. BUTTON_TITLE_SAVE +
				ps. BUTTON_POS_1 * ps. BUTTON_TITLE_CANCEL +
				ps. BUTTON_POS_2 * ps. BUTTON_TITLE_DONT_SAVE +
				ps. BUTTON_POS_0_DEFAULT;
			var promptMsg = this. cbService. getLocaleString ("ConfirmSaveChanges");
			res = ps. confirmEx (window, "Custom Buttons", promptMsg, aButtonFlags, "", "", "", "", {});
			if (res == RES_SAVE) {
				this. acceptDialog ();
				return true;
			} else {
				if ((res == RES_CANCEL) && this. lastFocused)
					this. lastFocused. focus ();
				return (res == RES_DONT_SAVE);
			}
		}

		return this. canClose;
	},

	fullScreen: function () {
		if (window. windowState == Components. interfaces. nsIDOMChromeWindow. STATE_MAXIMIZED)
			window. restore ();
		else
			window. maximize ();
	},

	tabSelect: function (event)	{
		var tab = event. target;
		if (tab. nodeName != "tab")
			return;
		event. preventDefault ();
		var tabs = document. getElementById ("custombuttons-editbutton-tabbox");
		tabs. selectedTab = tab;
		var controlId = tab. getAttribute ("cbcontrol");
		if (controlId) {
			var control = document. getElementById (controlId);
			control. focus ();
		}
	}
};

var editor = new Editor ();
