/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

/**
 * @fileOverview This file used for building custom buttons runtime environment
 */

var Cc = Components. classes;
var Ci = Components. interfaces;
var Cu = Components. utils;
var Cr = Components. results;
var self = oButton;
var xulns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
var xhtmlns = "http://www.w3.org/1999/xhtml";

var _phase = oButton. _initPhase? "init": "code";
var _id = oButton. id;
var _doc = document;
var _uri = buttonURI;
if ("custombuttonsUtils" in window) {
	var createDebug = custombuttonsUtils. createDebug;
	var createMsg = custombuttonsUtils. createMsg;
	var cbu = custombuttonsUtils;
}

/**
 * Logs an message to Error Console
 * @since version 0.0.5.1
 * @param {String} msg A message to log to
 * @since version 0.0.5.2
 * @returns {String} the argument passed in
 */
function LOG (msg) {
	var oButton = _doc. getElementById (_id);
	if (!oButton)
		return msg;
	var name = oButton. name;
	var head = "[Custom Buttons: id: " + _id + "@" + _phase + ", line: " + Components. stack. caller. lineNumber + ", name: " + name + "]";
	var cs = Cc ["@mozilla.org/consoleservice;1"]. getService (Ci. nsIConsoleService);
	cs. logStringMessage (head + (arguments. length? ("\n" + msg): ""));
	return msg;
}

/**
 * Registers an event listener.
 * The listener is deleted automatically when the button is being destroyed
 * (when the button is changed or removed or when window is closed).
 * @since version 0.0.5.1
 * @param {String} eventType
 * @param {nsIDOMEventListener|function} eventHandler
 * @param {Boolean} captureFlag
 * @param {nsIDOMEventTarget} [eventTarget=window]
 * @throws {TypeError} If eventHandler is not a function or has not nsIDOMEventListener interface
 * @throws {TypeError} If eventTarget has not nsIDOMEventTarget interface
 */
function addEventListener (eventType, eventHandler, captureFlag, eventTarget) {
	var oButton = _doc. getElementById (_id);
	if (!oButton)
		return;
	var handler = {
		eventType: "",
		eventHandler: null,
		captureFlag: null,
		eventTarget: null,
		context: null,

		handleEvent: function (event) {
			switch (typeof this. eventHandler) {
				case "function":
					this. eventHandler. apply (this. context, [event]);
					break;
				case "object":
					this. eventHandler. handleEvent (event);
					break;
				default:;
			}
		},

		register: function () {
			try	{
				this. eventTarget. addEventListener (this. eventType, this, this. captureFlag);
			} catch (e) {}
		},

		unregister: function ()	{
			try	{
				this. eventTarget. removeEventListener (this. eventType, this, this. captureFlag);
			} catch (e) {}
		}
	};
	handler. eventType = eventType;
	if ((eventHandler instanceof Ci. nsIDOMEventListener) ||
		(typeof (eventHandler) == "function") ||
		((typeof (eventHandler) == "object") && (typeof (eventHandler ["handleEvent"]) == "function")))
		handler. eventHandler = eventHandler;
	else
		throw new TypeError ("Custom Buttons: addEventListener: eventHandler isn't a function or hasn't nsIDOMEventListener interface", _uri, Components. stack. caller. lineNumber);
	handler. captureFlag = captureFlag;
	if (!eventTarget)
		eventTarget = window;
	if (eventTarget instanceof Ci. nsIDOMEventTarget)
		handler. eventTarget = eventTarget;
	else
		throw new TypeError ("Custom Buttons: addEventListener: eventTarget hasn't interface nsIDOMEventTarget\n", _uri, Components. stack. caller. lineNumber);
	handler. context = oButton;
	handler. register ();
	oButton. _handlers. push (handler);
}

/**
 * Unregisters an event listener registered with addEventListener
 * @since version 0.0.5.1
 * @param {String} eventType
 * @param {nsIDOMEventListener|function} eventHandler
 * @param {Boolean} captureFlag
 * @param {nsIDOMEventTarget} [eventTarget=window]
 */
function removeEventListener (eventType, eventHandler, captureFlag, eventTarget) {
	var oButton = _doc. getElementById (_id);
	if (!oButton)
		return;
	var handler;
	if (!eventTarget)
		eventTarget = window;
	for (var i = 0; i < oButton. _handlers. length; i++) {
		handler = oButton. _handlers [i];
		if ((handler. eventType == eventType) &&
			(handler. eventHandler == eventHandler) &&
			(handler. captureFlag == captureFlag) &&
			(handler. eventTarget == eventTarget)) {
			handler. unregister ();
			oButton. _handlers. splice (i, 1);
			break;
		}
	}
}

/**
 * Adds a destructor
 * The destructor should be function of one argument.
 * It is called when the button is being destroyed
 * (when the button is changed or removed or when window is closed)
 * @since version 0.0.5.6
 * @param {function} func
 * @param {Object} [context=window]
 * @throws {TypeError} If func is not a function
 */
function addDestructor (func, context) {
	var oButton = _doc. getElementById (_id);
	if (!oButton)
		return;
	if (typeof (func) != "function")
		throw new TypeError ("Custom Buttons: addDestructor: func isn't a function", _uri, Components. stack. caller. lineNumber);
	var destructor = {};
	destructor ["destructor"] = func;
	destructor ["context"] = context;
	oButton. _destructors. push (destructor);
}
