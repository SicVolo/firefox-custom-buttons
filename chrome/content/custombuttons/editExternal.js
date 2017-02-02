/* -*- mode: js; tab-width: 4; indent-tabs-mode: t; js-indent-level: 4; js-switch-indent-offset: 4 -*- */

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
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
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU General Public License Version 2 or later (the
 * "GPL"), in which case the provisions of the GPL are applicable
 * instead of those above.
 *
 *
 * The Original Code is the External Editor extension.
 * The Initial Developer of the above Original Code is
 * Philip Nilsson.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Kimitake
 * Supported Japanese charaset and added ja-JP locale
 *
 * The Original Code is the MozEx extension.
 * Copyright (C) 2003 Tomas Styblo <tripie@cpan.org>
 *
 *
 * Contributor(s):
 * - Alice0775, External Edittor for Custum Buttons
 *				http://space.geocities.yahoo.co.jp/gl/alice0775
 *				(2007/02/21)
 *
 * - LouCypher, external editor for Custom Buttons
 *				(2011/06/27)
 *
 * ***** END LICENSE BLOCK ***** */

var Cc = Components.classes;
var Ci = Components.interfaces;

//External Editor functions
var _tmpdir=null,_dir_separator,_os;
var _ext,_encode,_target=[];

function editinit() {
	if (window.navigator.platform.toLowerCase().indexOf("win") != -1) {
		// Windows OS
		_dir_separator = "\\";
		_os = "win";
	} else {
		// UNIX/Linux OS
		_dir_separator = "/";
		_os = "unix";
	}

	_ext = "js";
	_encode = 'UTF-8';
	_target = [];

	window.addEventListener("unload", edituninit, false);
	window.addEventListener("unload", function() {
		document.removeEventListener("focus", checkfocus_window, true);
	}, false);
}

function clearPreference () {
	var ps = Cc ["@mozilla.org/preferences-service;1"]. getService (Ci. nsIPrefService);
    ps = ps. QueryInterface (Ci. nsIPrefBranch);
    var cbps = ps. getBranch ("extensions.custombuttons.");
    cbps. clearUserPref ("external_editor");
}

function getEditor() {
	let pref = Cc["@mozilla.org/preferences-service;1"].
		getService(Ci.nsIPrefService).
		getBranch("extensions.custombuttons.");
	let editor = null;
	try {
		editor = pref.getCharPref("external_editor");
		var file = Cc ["@mozilla.org/file/local;1"]. createInstance (Ci. nsILocalFile);
		file. initWithPath (editor);
		if (!file. exists ()) {
			if (confirm ("Invalid editor file\nTry to select another?"))
				throw ("Error_invalid_Editor_file");
			clearPreference ();
			return null;
		}
		if (!file. isExecutable ()) {
			if (confirm ("Editor file is not executable\nTry to select another?"))
				throw ("Error_Editor_not_executable");
			clearPreference ();
			return null;
		}
	} catch(ex) {
		let nsIFilePicker = Ci.nsIFilePicker;
		let filePicker = Cc["@mozilla.org/filepicker;1"].
			createInstance(nsIFilePicker);
		filePicker.init(window, "Select editor", nsIFilePicker.modeOpen);
		filePicker.appendFilters(nsIFilePicker.filterApps);
		filePicker.appendFilters(nsIFilePicker.filterAll);
		if (filePicker.show() == nsIFilePicker.returnOK) {
			if (filePicker.file.exists() && filePicker.file.isExecutable()) {
				pref.setCharPref("external_editor", filePicker.file.path);
				editor = filePicker.file.path;
			}
		}
	}
	return editor;
}

function edituninit() {
	if (_tmpdir == null) return;
	var windowType = "navigator:browser";
	var windowManager = Cc['@mozilla.org/appshell/window-mediator;1'].
		getService();
	var windowManagerInterface = windowManager.
		QueryInterface(Ci.nsIWindowMediator);
	var enumerator = windowManagerInterface.getEnumerator(windowType);
	if (enumerator.hasMoreElements()) {
		return;
	}

	var file = Cc["@mozilla.org/file/local;1"].
		createInstance(Ci.nsILocalFile);
	file.initWithPath(_tmpdir);
	var entries = file.directoryEntries;
	while (entries.hasMoreElements()) {
		var entry = entries.getNext().QueryInterface(Ci.nsIFile);
		if (/^custombuttons\./i.test(entry.leafName)) {
			try {
				entry.remove(false);
			} catch(e) {
			}
		}
	}

	try {
		if (file.exists() == true ) {
			file.remove(false);
		}
	} catch(e) {
	}

	_tmpdir = null;
}

function gmon_edit_mouseclick(e) {
	// If it is necessary, the user please rewrite.
	var ClikType = 1;// 0: left, 1: mid, 2: right
	if (e.button != ClikType) return;
	var target = e.target;
	//dump('gmon_edit_mouseclick');
	edittarget(target);
}

function edit_button() {
	let tabbox = document.getElementById("custombuttons-editbutton-tabbox");
	let panel = tabbox.tabpanels.selectedPanel;
	if (panel.localName == "cbeditor") {
		edittarget(panel);
	}
}

function checkfocus_window() {
	var target, filename, timestamp, encode,
		file, istr, sstream, utf, textBoxText;

	if (_target.length<=0) return;

	file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	istr = Cc['@mozilla.org/network/file-input-stream;1'].
		createInstance(Ci.nsIFileInputStream);

	// FileInputStream's read is [noscript].
	sstream = Cc["@mozilla.org/scriptableinputstream;1"].
		createInstance(Ci.nsIScriptableInputStream);
	utf = Cc['@mozilla.org/intl/utf8converterservice;1'].
		createInstance(Ci.nsIUTF8ConverterService);

	for (var i=0; i < _target.length;i++) {
		target = _target[i];
		if (!target.hasAttribute("filename")) continue;
		filename = target.getAttribute("filename");
		timestamp = target.getAttribute("timestamp");
		file.initWithPath(filename);
		if (!file.exists() || !file.isReadable()) continue;
		if (file.lastModifiedTime <= timestamp) continue;

		target.setAttribute("timestamp", file.lastModifiedTime);

		istr.init(file, 1, 0x400, false);
		sstream.init(istr);

		textBoxText	 = sstream.read(sstream.available());
		encode = target.getAttribute("encode");
		if (textBoxText.length) {
			target.value = utf.convertStringToUTF8(textBoxText, encode, true, false);
		} else {
			target.value = "";
		}
		sstream.close();
		istr.close();
		try {
			file.remove(false);
		} catch(e) {
		}
	}
}

function editfile(target,filename) {
	// Figure out what editor to use.
	var editor = getEditor();
	if (!editor) return false;

	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	file.initWithPath(editor);
	if (!file.exists()) {
		alert("Error_invalid_Editor_file");
		return false;
	}
	if (!file.isExecutable()) {
		alert("Error_Editor_not_executable");
		return false;
	}
	target.setAttribute("filename", filename);
	target.setAttribute("timestamp", file.lastModifiedTime);

	// Run the editor.
	var process = Cc["@mozilla.org/process/util;1"].
		createInstance(Ci.nsIProcess);
	process.init(file);
	var args = [filename];
	var run = "runw" in process ? process.runw : process.run;
	run.call(process, false, args, args.length);  // don't block
	document.addEventListener("focus", checkfocus_window, true);
	return true;
}

function edittarget(target) {

	var textBoxText = target.value;
	// Get filename.
	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	if (target.hasAttribute("filename")) {
		var filename = target.getAttribute("filename");
		file.initWithPath(filename);
		try {
			if(file.exists()) file.remove(false);
		} catch(e) {
		}
	} else {
		var filename = TmpFilenameTextarea();
	}
	file.initWithPath(filename);
	file.create(file.NORMAL_FILE_TYPE, 6 << 6 /* 0600 */);

	// Write the data to the file.
	var ostr = Cc['@mozilla.org/network/file-output-stream;1'].
		createInstance(Ci.nsIFileOutputStream);
	ostr.init(file, 2, 0x200, false);

	if(navigator.platform == "Win32") {
		// Convert Unix newlines to standard network newlines
		textBoxText = textBoxText.replace(/\n/g, "\r\n");
	}
	var conv = Cc['@mozilla.org/intl/saveascharset;1'].
		createInstance(Ci.nsISaveAsCharset);
	try {
		conv.Init(_encode, 0, 0);
		textBoxText = conv.Convert(textBoxText);
	} catch(e) {
		textBoxText = "";
	}
	ostr.write(textBoxText, textBoxText.length);

	ostr.flush();
	ostr.close();

	// setup target info
	target.setAttribute("encode", _encode);

	// Edit the file.
	if (editfile(target,file.path)) {
		_target.push(target);  // Editting target array
	}
}

//Compose temporary filename out of
//	  - tmpdir setting
//	  - document url
//	  - textarea name
//	  - ext suffix
function TmpFilenameTextarea() {
	var TmpFilename;
	_tmpdir = gettmpDir();
	do {
		TmpFilename = _tmpdir + _dir_separator + "custombuttons." +
			Math.floor(Math.random() * 100000) + "." + _ext;
	} while (!ExistsFile(TmpFilename))
	return TmpFilename;
}

//Function returns true if given filename exists
function ExistsFile(filename) {
	try {
		var file = Cc["@mozilla.org/file/local;1"].
			createInstance(Ci.nsILocalFile);
		file.initWithPath(filename);
		return true;
	} catch(e) {
		return false;
	}
}

/**
 * Returns the directory where we put files to edit.
 * @returns nsILocalFile The location where we should write editable files.
 */
function gettmpDir() {
	/* Where is the directory that we use. */
	var fobj = Cc["@mozilla.org/file/directory_service;1"].
		getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
	fobj.append('Temp_ExternalEditor');
	if (!fobj.exists()) {
		fobj.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt('0700',8));
	}
	if (!fobj.isDirectory()) {
		// the string will be replaced locale properties in the future
		alert('Having a problem finding or creating directory: '+ fobj.path);
	}
	return fobj.path;
}

window.addEventListener("load", editinit, false);
window.removeEventListener("unload", editinit, false);
