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
// - This component is intended to handle extension's specific command line arguments
//
// Author: Anton Glazatov (c) 2010
//
// ***** END LICENSE BLOCK *****

function cbCommandLineHandler () {}
cbCommandLineHandler. prototype = {
	QueryInterface: function (iid) {
		if (iid. equals (Components. interfaces. nsICommandLineHandler) ||
			(iid. equals (Components. interfaces. nsISupports)))
			return this;
		throw Components. results. NS_ERROR_NO_INTERFACE;
	},

	_cbs: null,
	get cbs () {
		if (!this. _cbs)
			this. _cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1" /* CB_SERVICE_CID */].
			getService (Components. interfaces. cbICustomButtonsService /* CB_SERVICE_IID */);
		return this. _cbs
	},

	handle: function (commandLine) {
		var mode = this. cbs. mode;
		var param = commandLine. handleFlagWithParam ("custombuttons", false);
		if (!param)
			return;
		if (param == "disable-buttons-initialization")
			mode = mode | 32 /* CB_MODE_DISABLE_INITIALIZATION */;
		this. cbs. mode = mode;
	},

	helpInfo: "	 -custombuttons\n	 disable-buttons-initialization				  Disable buttons initialisation\n"
};

var Module = {
	CLSID: Components. ID ("{cafd9345-65a1-46b2-944d-ff4a9725a609}"),
	ContractID: "@mozilla.org/commandlinehandler/general-startup;1?type=custombuttons" /* CB_COMMAND_LINE_HANDLER_COMPONENT_CID */,
	ComponentName: "Custombuttons extension command line handler component",

	QueryInterface: function (iid) {
		if (iid. equals (Components. interfaces. nsIModule) ||
			iid. equals (Components. interfaces. nsISupports))
			return this;
		throw Components. results. NS_ERROR_NO_INTERFACE;
	},

	getClassObject: function (compMgr, cid, iid) {
		if (!cid. equals (this. CLSID))
			throw Components. results. NS_ERROR_NO_INTERFACE;
		if (!iid. equals (Components. interfaces. nsIFactory))
			throw Components. results. NS_ERROR_NOT_IMPLEMENTED;
		return this. CLASS_FACTORY;
	},

	firstTime: true,
	registerSelf: function (compMgr, fileSpec, location, type) {
		if (this. firstTime)
			this. firstTime = false;
		else
			throw Components. results. NS_ERROR_FACTORY_REGISTER_AGAIN;
		compMgr = compMgr. QueryInterface (Components. interfaces. nsIComponentRegistrar);
		compMgr. registerFactoryLocation
		(
			this. CLSID, this. ComponentName, this. ContractID,
			fileSpec, location, type
		);
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. addCategoryEntry ("command-line-handler", "m-custombuttons", this. ContractID, true, true);

	},

	unregisterSelf: function (compMgr, location, type) {
		compMgr = compMgr. QueryInterface (Components. interfaces. nsIComponentRegistrar);
		compMgr. unregisterFactoryLocation (this. CID, location);
		var cm = Components. classes ["@mozilla.org/categorymanager;1"]. getService (Components. interfaces. nsICategoryManager);
		cm. deleteCategoryEntry ("command-line-handler", "m-custombuttons");
	},

	canUnload: function (compMgr) {
		return true;
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
			return (new cbCommandLineHandler ()). QueryInterface (iid);
		}
	}
};

function NSGetModule (componentManager, fileSpec) { return Module; }
function NSGetFactory (cid) { return Module. CLASS_FACTORY; }
