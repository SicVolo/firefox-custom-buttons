/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.
 *
 * The Initial Developer of the Original Code is IBM Corporation.
 * Portions created by IBM Corporation are Copyright (C) 2004
 * IBM Corporation. All Rights Reserved.
 *
 * Contributor(s):
 *	 Darin Fisher <darin@meer.net>
 *	 Doron Rosenberg <doronr@us.ibm.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var	  kSIMPLEURI_CONTRACTID = "@mozilla.org/network/simple-uri;1";
var	  nsIURI = Components. interfaces. nsIURI;

function EmptyStream () {}
EmptyStream. prototype = {
	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. nsIScriptableInputStream) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return this;
	},

	available: 0,

	close: function () {},

	init: function (aInputStream) {},

	read: function (aCount) {
		return "";
	},

	readBytes: function (aCount) {
		return "";
	}
};

function CBProtocolChannel (aURI) {
	this. originalURI = aURI;
	this. URI = aURI;
	return this;
}
CBProtocolChannel. prototype = {
	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. nsIChannel) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return this;
	},

	contentCharset: "",
	contentLength: 0,
	contentType: "",
	notificationCallbacks: null,
	originalURI: null,
	owner: null,
	securityInfo: null,
	URI: null,

	asyncOpen: function (aListener, aContext) {},

	open: function () {
		var stream = new EmptyStream ();
		return stream;
	}
};

function CustombuttonProtocol (sProtocolName) {
	this. scheme = sProtocolName;
	this. protocolFlags = Components. interfaces. nsIProtocolHandler. URI_NORELATIVE |
		Components. interfaces. nsIProtocolHandler. URI_NOAUTH |
		Components. interfaces. nsIProtocolHandler. URI_LOADABLE_BY_ANYONE |
		Components. interfaces. nsIProtocolHandler. URI_NON_PERSISTABLE;
	if (sProtocolName == "custombutton")
		this. protocolFlags |= Components. interfaces. nsIProtocolHandler. URI_DOES_NOT_RETURN_DATA;
	if (sProtocolName == "custombuttons")
		this. protocolFlags |= Components. interfaces. nsIProtocolHandler. URI_IS_LOCAL_RESOURCE;
	return this;
}
CustombuttonProtocol. prototype = {

	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. nsIProtocolHandler) &&
			!iid. equals (Components. interfaces. nsIObserver) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return this;
	},

	defaultPort: -1,
	protocolFlags:	Components. interfaces. nsIProtocolHandler. URI_NORELATIVE |
		Components. interfaces. nsIProtocolHandler. URI_NOAUTH |
		Components. interfaces. nsIProtocolHandler. URI_LOADABLE_BY_ANYONE |
		Components. interfaces. nsIProtocolHandler. URI_NON_PERSISTABLE |
		Components. interfaces. nsIProtocolHandler. URI_DOES_NOT_RETURN_DATA,

	scheme: "custombutton",

	allowPort: function (port, scheme) {
		return false;
	},

	newURI: function (spec, charset, baseURI) {
		var uri = Components. classes [kSIMPLEURI_CONTRACTID]. createInstance (nsIURI);
		uri. spec = spec;
		return uri;
	},

	get chromeProtocolHandler () {
		var chromeProtocolHandler = Components. classes ["@mozilla.org/network/protocol;1?name=chrome"].
			getService ();
		chromeProtocolHandler = chromeProtocolHandler. QueryInterface (Components. interfaces. nsIProtocolHandler);
		return chromeProtocolHandler;
	},

	get fakeOverlayURI () {
		var fakeOverlayURI = "chrome://custombuttons/content/buttonsoverlay.xul";
		return this. chromeProtocolHandler. newURI (fakeOverlayURI, null, null);
	},

	fakeOverlayChannel: function ()	{
		return this. chromeProtocolHandler. newChannel (this. fakeOverlayURI);
	},

	sCbPrefix: "custombuttons://content/",

	getChromePrincipal: function ()	{
		var ssm = Components. classes ["@mozilla.org/scriptsecuritymanager;1"]. getService (Components. interfaces. nsIScriptSecurityManager);
		var res;
		try	{
			res = ssm. getCodebasePrincipal (this. fakeOverlayURI);
		} catch (e)	{
			res = this. fakeOverlayChannel (). owner;
		}
		return res;
	},

	getJSVersion: function () {
		var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
		var pv = info. platformVersion;
		var oVC = Components. classes ["@mozilla.org/xpcom/version-comparator;1"]. createInstance (Components. interfaces. nsIVersionComparator);
		if (oVC. compare (pv, "1.9") >= 0) return ";version=1.8";
		if (oVC. compare (pv, "1.8.1") >= 0) return ";version=1.7";
		if (oVC. compare (pv, "1.8") >= 0) return ";version=1.6";
		return "";
	},

	getXULTemplate: function ()	{
		var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"]. getService (Components. interfaces. cbICustomButtonsService);
		var xulchan = cbs. getChannel ("chrome://custombuttons/content/tcbbutton.xul");
		var instr = xulchan. open ();
		var dp = Components. classes ["@mozilla.org/xmlextras/domparser;1"]. createInstance (Components. interfaces. nsIDOMParser);
		var doc = dp. parseFromStream (instr, null, instr. available (), "application/xml");
		var script = doc. getElementsByTagName ("script") [0];
		script. setAttribute ("type", "application/x-javascript" + this. getJSVersion ());
		return doc;
	},

	pumpDocumentToPipe: function (doc, pipe) {
		var bos = Components. classes ["@mozilla.org/binaryoutputstream;1"]. createInstance (Components. interfaces. nsIBinaryOutputStream);
		bos. setOutputStream (pipe. outputStream);
		var xs = Components. classes ["@mozilla.org/xmlextras/xmlserializer;1"]. createInstance (Components. interfaces. nsIDOMSerializer);
		xs. serializeToStream (doc, bos, "");
		bos. close ();
	},

	cbbuttonxulchannel: function (aURI)	{
		var pipe = Components. classes ["@mozilla.org/pipe;1"]. createInstance (Components. interfaces. nsIPipe);
		pipe. init (true, true, 0, 0, null);
		var doc = this. getXULTemplate ();
		this. pumpDocumentToPipe (doc, pipe);
		pipe. outputStream. close ();
		var chan = Components. classes ["@mozilla.org/network/input-stream-channel;1"]. createInstance (Components. interfaces. nsIInputStreamChannel);
		chan. contentStream = pipe. inputStream;
		chan. QueryInterface (Components. interfaces. nsIChannel);
		chan. setURI (aURI);
		chan. owner = this. getChromePrincipal ();
		chan. contentType = "application/vnd.mozilla.xul+xml";
		return chan;
	},

	getCustomButtonsFile: function (aURI, sFileName) {
		var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"]. getService (Components. interfaces. cbICustomButtonsService);
		var dir = Components. classes ["@mozilla.org/file/directory_service;1"]. getService (Components. interfaces. nsIProperties). get ("ProfD", Components. interfaces. nsIFile); // get profile folder
		dir. append ("custombuttons");
		if (!dir. exists ()) {
			if (sFileName == "buttonsoverlay.xul")
				cbs. makeOverlay ();
			else
				return this. fakeOverlayChannel ();
		}
		var file = dir. clone ();
		file. append (sFileName);
		if (!file. exists ()) {
			if (sFileName == "buttonsoverlay.xul")
				cbs. makeOverlay ();
			else
				return this. fakeOverlayChannel ();
		}
		var channel = cbs. getChannel (file);
		channel. originalURI = aURI;
		channel. owner = this. getChromePrincipal ();
		return channel;
	},

	newChannel: function (aURI)	{
		if (this. scheme == "custombuttons") {
			var sFileName = aURI. spec. substring (this. sCbPrefix. length);
			if (sFileName == "cbbutton.xul")
				return this. cbbuttonxulchannel (aURI);
			else
				return this. getCustomButtonsFile (aURI, sFileName);
		}
		var chan = new CBProtocolChannel (aURI);
		if (typeof protocol != "undefined") {
			protocol. process. sendAsyncMessage (
				"CustomButtons:protocol:installWebButton",
				{ spec: aURI. spec }
			);
			return chan;
		}
		var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"]. getService (Components. interfaces. cbICustomButtonsService);
		cbs. installWebButton (null, aURI. spec, true);
		return chan;
	},

	observe: function (aSubject, aTopic, aData) {}
};

function CustombuttonsProtocolClassFactory (sProtocolName) {
	this. protocol = sProtocolName;
	return this;
}
CustombuttonsProtocolClassFactory. prototype = {
	protocol: "",

	createInstance: function (outer, iid) {
		if (outer != null)
			throw Components. results. NS_ERROR_NO_AGGREGATION;
		if (!iid. equals (Components. interfaces. nsIProtocolHandler) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return new CustombuttonProtocol (this. protocol);
	}
};

var Module = {
	CLSID: [Components. ID ("{78D452B8-2CE8-4a7b-8A59-DA3C0960DAE7}"),
			Components. ID ("{1c796f9e-9a22-4604-84e4-fa7c4b8d80a4}")],
	ContractID: ["@mozilla.org/network/protocol;1?name=custombutton",
				 "@mozilla.org/network/protocol;1?name=custombuttons"],
	ComponentName: ["Custombutton Protocol", "Custombuttons Extension Protocol"],
	protocolName: ["custombutton", "custombuttons"],

	canUnload: function (componentManager) {
		return true;
	},

	getClassObject: function (componentManager, cid, iid) {
		if (!cid. equals (this. CLSID [0]) &&
			!cid. equals (this. CLSID [1]))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		if (!iid. equals (Components. interfaces. nsIFactory))
			throw Components. results. NS_ERROR_NOT_IMPLEMENTED;
		var protocol;
		for (var i = 0; i < this. CLSID. length; i++) {
			if (cid. equals (this. CLSID [i])) {
				protocol = this. protocolName [i];
				break;
			}
		}
		return new CustombuttonsProtocolClassFactory (protocol);
	},

	FIRST_TIME: true,

	registerSelf: function (componentManager, fileSpec, location, type)	{
		if (this. FIRST_TIME)
			this. FIRST_TIME = false;
		else
			throw Components. results. NS_ERROR_FACTORY_REGISTER_AGAIN;
		componentManager = componentManager. QueryInterface (Components. interfaces. nsIComponentRegistrar);
		for (var i = 0; i < this. CLSID. length; i++)
			componentManager. registerFactoryLocation (
				this. CLSID [i],
				this. ComponentName [i],
				this. ContractID [i],
				fileSpec,
				location,
				type
			);
	},

	unregisterSelf: function (componentManager, location, loaderStr) {}
};

function NSGetFactory (cid) {
	var protocol;
	if (cid. equals (Components. ID ("{78D452B8-2CE8-4a7b-8A59-DA3C0960DAE7}")))
		protocol = "custombutton";
	else if (cid. equals (Components. ID ("{1c796f9e-9a22-4604-84e4-fa7c4b8d80a4}")))
		protocol = "custombuttons";
	return new CustombuttonsProtocolClassFactory (protocol);
}
function NSGetModule (componentManager, fileSpec) { return Module; }
