/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

/* ****
 * addons-overlay.js
 */

Components. utils. import ("resource://gre/modules/AddonManager.jsm");
Components. utils. import ("resource://custombuttons-modules/addons4.js");

var cbAddonManager = {
	notificationPrefix: "custombuttons:cb499e37-9269-407e-820f-edc9ab0dd698:",

	QueryInterface: function (iid) {
		if (iid. equals (Components. interfaces. nsIObserver) ||
			iid. equals (Components. interfaces. nsIDOMEventListener) ||
			iid. equals (Components. interfaces. nsIWeakReference) ||
			iid. equals (Components. interfaces. nsISupports))
			return this;
		return Components. results. NS_ERROR_NO_INTERFACE;
	},

	init: function () {
		window. removeEventListener ("load", this, false);

		gViewController. commands. cmd_custombuttons_edit = {
			isEnabled: function () {
				return "addons://list/custombuttons" == gViewController. currentViewId;
			},

			doCommand: function (aAddon) {
				var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"].
					getService (Components. interfaces. cbICustomButtonsService);
				cbs. editButton (window, aAddon. buttonLink, null);
			}
		};

		gViewController. commands. cmd_custombuttons_add = {
			isEnabled: function () {
				return true;
			},

			doCommand: function (aAddon) {
				var cbs = Components. classes ["@xsms.nm.ru/custombuttons/cbservice;1"].
					getService (Components. interfaces. cbICustomButtonsService);
				cbs. editButton (window, "", null);
			}
		};

		this. addObserver ("installButton");
		this. addObserver ("updateButton");
		this. addObserver ("cloneButton");
		this. addObserver ("removeButton");

		window. addEventListener ("ViewChanged", this, false);
		this. onViewChanged ();
	},

	destroy: function (aEvent) {
		window. removeEventListener ("ViewChanged", this, false);
		window. removeEventListener ("unload", this, false);

		this. removeObserver ("installButton");
		this. removeObserver ("updateButton");
		this. removeObserver ("cloneButton");
		this. removeObserver ("removeButton");
	},

	addObserver: function (sNotificationName) {
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. addObserver (this, this. notificationPrefix + sNotificationName, false);
	},

	removeObserver: function (sNotificationName) {
		var os = Components. classes ["@mozilla.org/observer-service;1"]. getService (Components. interfaces. nsIObserverService);
		os. removeObserver (this, this. notificationPrefix + sNotificationName);
	},

	onViewChanged: function (aEvent) {
		if ("addons://list/custombuttons" == gViewController. currentViewId) {
			document. documentElement. classList. add ("custombuttons");
			this. sortButtons ();
		} else {
			document. documentElement. classList. remove ("custombuttons");
		}
	},

	changeSort: function () {
		var sortButton = document. getElementById ("custombuttons-sorting-name");
		var checkState = (sortButton. getAttribute ("checkState") == "1")? "2": "1";
		sortButton. setAttribute ("checkState", checkState);
		this. sortButtons ();
	},

	isCustomButtonsView: function () {
		return "addons://list/custombuttons" == gViewController. currentViewId;
	},

	sortButtons: function () {
		if (!this. isCustomButtonsView ())
			return;
		var sortButton = document. getElementById ("custombuttons-sorting-name");
		var checkState = sortButton. getAttribute ("checkState");
		this. applySort (["name"], checkState != "1");
	},

	applySort: function (sortFields, ascending) {
		var list = document. getElementById ("addon-list");
		var elements = Array. slice (list. childNodes, 0);
		sortElements (elements, sortFields, ascending);
		while (list. hasChildNodes ())
			list. removeChild (list. lastChild);
		elements. forEach (function (element) {
			list. appendChild (element);
		});
	},

	makeButtonLink: function (notificationPrefix) {
		var info = Components. classes ["@mozilla.org/xre/app-info;1"]. getService (Components. interfaces. nsIXULAppInfo);
		var res = "custombutton://buttons/";
		switch (notificationPrefix) {
			case "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d27:":
				res += info. name;
				break;
			case "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d28:":
				if ("SeaMonkey" == info. name)
					res += "SeaMonkeyMail";
				else
					res += "Thunderbird";
				break;
			case "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d29:":
				if ("SeaMonkey" == info. name)
					res += "SeaMonkeyMailWindow";
				else
					res += "ThunderbirdMailWindow";
				break;
			case "custombuttons:69423527-65a1-4b8f-bd7a-29593fc46d2a:":
				if ("SeaMonkey" == info. name)
					res += "SeaMonkeyComposeWindow";
				else
					res += "ThunderbirdComposeWindow";
				break;
			default:
				res += "Browser";
				break;
		}
		res += "/";
		return res;
	},

	/* nsIDOMEventListener interface */
	handleEvent: function (aEvent) {
		switch (aEvent. type) {
			case "load":
				this. init ();
				break;
			case "unload":
				this. destroy ();
				break;
			case "ViewChanged":
				this. onViewChanged (aEvent);
				break;
			default:
				break;
		}
	},

	/* nsIObserver */
	observe: function (oSubject, sTopic, aData) {
		if (!this. isCustomButtonsView ())
			return;
		var notificationPrefix = aData. split ("+") [1];
		var btnLink = this. makeButtonLink (notificationPrefix);
		var topic = sTopic. replace (this. notificationPrefix, "");
		switch (topic) {
			case "installButton":
			case "updateButton":
			case "cloneButton":
				var btn = new CustombuttonsButton (null);
				btn. id = btnLink + oSubject. getAttribute ("id");
				btn. name = oSubject. getAttribute ("label");
				btn. iconURL = "chrome://custombuttons/skin/button.png";
				if (oSubject. hasAttribute ("cb-stdicon")) {
					btn. iconURL = oSubject. getAttribute ("cb-stdicon");
				}
				if (oSubject. hasAttribute ("image")) {
					btn. iconURL = oSubject. getAttribute ("image");
				}
				btn. buttonLink = btnLink + "edit/" + oSubject. getAttribute ("id");
				var s = "";
				for (var i in btn)
					s += i + ":" + btn [i] + "\n";
				if ("updateButton" == topic) {
					gListView. removeItem (btn. id);
				}
				gListView. addItem (btn);
				this. sortButtons ();
				break;
			case "removeButton":
				var btnId = notificationPrefix + aData. split ("+") [0]. split (":") [1];
				gListView. removeItem (btnId);
				break;
			default:
				break;
		}
	}
};

window. addEventListener ("load", cbAddonManager, false);
