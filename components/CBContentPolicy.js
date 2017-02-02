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
// - This component is intended to prevent local disk access vulnerability
// - via chrome://custombuttons-profilefolder/%2e%2e%2f...
// - (see bug #413250: https://bugzilla.mozilla.org/show_bug.cgi?id=413250)
//
// Author: Anton Glazatov (c) 2008
//
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Portions of this code have been based upon
// Adblock Plus - http://adblockplus.org/
// Copyright (c) 2006-2007 Wladimir Palant
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// ***** END LICENSE BLOCK *****

var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
var oVC = Components. classes ["@mozilla.org/xpcom/version-comparator;1"]. createInstance (Components. interfaces. nsIVersionComparator);
if (oVC. compare (info. platformVersion, "1.8.0.5") < 0) {
	// Adblock Plus code
	//HACKHACK: need a way to get an implicit wrapper for nodes because of bug 337095 (fixed in Gecko 1.8.0.5)
	var fakeFactory = {
		createInstance: function (outer, iid) {
			return outer;
		},

		QueryInterface: function (iid) {
			if (iid. equals (Components. interfaces. nsISupports) ||
				iid. equals (Components. interfaces. nsIFactory))
				return this;

			throw Components. results. NS_ERROR_NO_INTERFACE;
		}
	};
	var array = Components. classes ["@mozilla.org/supports-array;1"]. createInstance (Components. interfaces. nsISupportsArray);
	array. AppendElement (fakeFactory);
	fakeFactory = array. GetElementAt (0). QueryInterface (Components. interfaces. nsIFactory);
	array = null;
}

function wrapNode (insecNode) {
	var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
	var oVC = Components. classes ["@mozilla.org/xpcom/version-comparator;1"]. createInstance (Components. interfaces. nsIVersionComparator);
	if (oVC. compare (info. platformVersion, "1.8.0.5") < 0)
		return fakeFactory. createInstance (insecNode, Components. interfaces. nsISupports);
	else
		return insecNode;
}

// Retrieves the window object for a node or returns null if it isn't possible
function getWindow (node) {
	if (node && node. nodeType != Components. interfaces. nsIDOMNode. DOCUMENT_NODE)
		node = node. ownerDocument;

	if (!node || node. nodeType != Components. interfaces. nsIDOMNode. DOCUMENT_NODE)
		return null;

	return node. defaultView;
}
// end Adblock Plus code

function cbContentPolicyComponent () {}
cbContentPolicyComponent. prototype = {
	QueryInterface: function (iid) {
		if (!iid. equals (Components. interfaces. nsIContentPolicy) &&
			!iid. equals (Components. interfaces. nsISupports))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		return this;
	},

	// Adblock Plus code
	shouldLoad: function (contentType, contentLocation, requestOrigin, context,
						  mimeTypeGuess, extra)	{
		if (!context)
			return Components. interfaces. nsIContentPolicy. ACCEPT;

		// HACKHACK: Pass the node though XPCOM to work around bug 337095
		var node = wrapNode (context);
		var wnd = getWindow (node);
		if (!wnd)
			return Components. interfaces. nsIContentPolicy. ACCEPT;

		// Only block in content windows
		var wndType = wnd. QueryInterface (Components. interfaces. nsIInterfaceRequestor).
			getInterface (Components. interfaces. nsIWebNavigation).
			QueryInterface (Components. interfaces. nsIDocShellTreeItem). itemType;
		if (wndType != Components. interfaces. nsIDocShellTreeItem. typeContent)
			return Components. interfaces. nsIContentPolicy. ACCEPT;

		if ((contentLocation. spec. indexOf ("custombutton://content/") == 0) ||
			(contentLocation. spec. indexOf ("custombuttons://content/") == 0) ||
			(contentLocation. spec. indexOf ("resource://custombuttons") == 0))
			return Components. interfaces. nsIContentPolicy. REJECT_REQUEST;

		return Components. interfaces. nsIContentPolicy. ACCEPT;
	},

	shouldProcess: function (contentType, contentLocation, requestOrigin,
							 context, mimeType, extra) {
		return Components. interfaces. nsIContentPolicy. ACCEPT;
	}
	// end Adblock Plus code
};

var Module = {
	CLSID: Components. ID ("{cb267f0c-88ed-430d-bd9c-f4e132cd71d5}"),
	ContractID: "@xsms.nm.ru/custombuttons/cbcontentpolicy;1",
	ComponentName: "Custombuttons extension content policy component",

	canUnload: function (componentManager) { return true; },
	getClassObject: function (componentManager, cid, iid) {
		if (!cid. equals (this. CLSID))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		if (!iid. equals (Components. interfaces. nsIFactory))
			throw Components. results. NS_ERROR_NOT_IMPLEMENTED;
		return this. CLASS_FACTORY;
	},

	FIRST_TIME: true,
	registerSelf: function (componentManager, fileSpec, location, type)	{
		if (this. FIRST_TIME)
			this. FIRST_TIME = false;
		else
			throw Components. results. NS_ERROR_FACTORY_REGISTER_AGAIN;
		componentManager = componentManager. QueryInterface (Components. interfaces. nsIComponentRegistrar);
		componentManager. registerFactoryLocation (
			this. CLSID, this. ComponentName,
			this. ContractID, fileSpec,
			location, type
		);
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. deleteCategoryEntry ("content-policy", Components. classes ["@xsms.nm.ru/custombuttons/cbcontentpolicy;1"], true);
		cm. addCategoryEntry (
			"content-policy", Components. classes ["@xsms.nm.ru/custombuttons/cbcontentpolicy;1"],
			Components. classes ["@xsms.nm.ru/custombuttons/cbcontentpolicy;1"], true, true
		);
	},

	unregisterSelf: function (componentManager, location, loaderStr) {
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. deleteCategoryEntry ("content-policy", Components. classes ["@xsms.nm.ru/custombuttons/cbcontentpolicy;1"], true);
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
			return (new cbContentPolicyComponent ()). QueryInterface (iid);
		}
	}
};

function NSGetModule (componentManager, fileSpec) { return Module; }
function NSGetFactory (cid) { return Module. CLASS_FACTORY; }
