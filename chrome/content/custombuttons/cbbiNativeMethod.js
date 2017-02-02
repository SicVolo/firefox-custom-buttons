/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

function _callNativeMethod (name, args) {
	var res;
	try {
		var nativeMethod = Components. lookupMethod (this, name);
		res = nativeMethod. apply (this, args);
	} catch (err) {}
	return res;
}

function getAttribute (name) {
	return this. _callNativeMethod ("getAttribute", [name]);
}

function setAttribute (name, value) {
	return this. _callNativeMethod ("setAttribute", [name, value]);
}

function hasAttribute (name) {
	return this. _callNativeMethod ("hasAttribute", [name]);
}

function removeAttribute (name) {
	return this. _callNativeMethod ("removeAttribute", [name]);
}

__defineGetter__ (
	"id",
	function () {
		return this. _callNativeMethod ("id", []);
	}
);

__defineSetter__ (
	"id",
	function (val) {
		return this. _callNativeMethod ("id", [val]);
	}
);

__defineGetter__ (
	"localName",
	function () {
		return this. _callNativeMethod ("localName", []);
	}
);

__defineSetter__ (
	"localName",
	function (val) {
		return this. _callNativeMethod ("localName", [val]);
	}
);

__defineGetter__ (
	"title",
	function () {
		return this. _callNativeMethod ("title", []);
	}
);

__defineSetter__ (
	"title",
	function (val) {
		return this. _callNativeMethod ("title", [val]);
	}
);
