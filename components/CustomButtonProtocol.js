/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

// Register protocol in child process, should be placed here to initialize at app startup
var Services;
try {
	Components.utils["import"]("resource://gre/modules/Services.jsm");
	if("ppmm" in Services) {
		Services.ppmm.loadProcessScript("chrome://custombuttons/content/protocol/CustomButtonProtocol-process.js", true);
		Services.ppmm.addMessageListener("CustomButtons:protocol:installWebButton", function(msg) {
			var cbs = Components.classes["@xsms.nm.ru/custombuttons/cbservice;1"]
				.getService(Components.interfaces.cbICustomButtonsService);
			cbs.installWebButton(null, msg.data.spec, true);
		});
	}
}
catch(e) {
	Services && Components.utils.reportError(e);
}

Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
	.getService(Components.interfaces.mozIJSSubScriptLoader)
	.loadSubScript("chrome://custombuttons/content/protocol/CustomButtonProtocol.js");
