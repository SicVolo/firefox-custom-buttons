/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

var EXPORTED_SYMBOLS = ["protocol"];

var protocol = {
	get compReg() {
		return Components.manager
			.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	},
	register: function(process) {
		this.process = process;

		Components.utils.import("resource://gre/modules/Services.jsm");
		Services.scriptloader.loadSubScript("chrome://custombuttons/content/protocol/CustomButtonProtocol.js");

		for(var i = 0; i < Module.CLSID.length; ++i) {
			this.compReg.registerFactory(
				Module.CLSID[i],
				Module.ComponentName[i],
				Module.ContractID[i],
				NSGetFactory(Module.CLSID[i])
			);
		}
	}
};
