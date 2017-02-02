/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

Components.utils.import("resource://gre/modules/Services.jsm");
if(Services.appinfo.processType == Services.appinfo.PROCESS_TYPE_CONTENT) {
	Components.utils.import("chrome://custombuttons/content/protocol/CustomButtonProtocol.jsm");
	protocol.register(this);
}
