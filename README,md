# Custom buttons Mozilla add-on

This is an unofficial repo for the (custom buttons add-on)[https://addons.mozilla.org/en-US/firefox/addon/custom-buttons/]

Fixed to work with Firefox 51+ and Thunderbird 47.7+

Code that was changed:

* content/custombuttons/cbbutton.js

```js
   /**
    * nsIDOMParser used here breaks the new DOMParser contructor globally on all Firefox versions.
    */
   // var dp = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
   // var doc = dp.parseFromStream(instr, null, instr.available(), "application/xml");
   var bis = Components.classes['@mozilla.org/binaryinputstream;1'].createInstance(Components.interfaces.nsIBinaryInputStream);
   bis.setInputStream(instr);
   var templateStr = bis.readBytes(bis.available());
   var doc = (new DOMParser()).parseFromString(templateStr, "application/xml");
```

* content/custombuttons/cbbuttonimpl.js had all function names to start  with 'this.'
