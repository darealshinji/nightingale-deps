/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim:set ts=2 sw=2 sts=2 et: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
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
 * The Original Code is Bug 411966 test code.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Marco Bonardo <mak77@bonardo.net> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

const Ci = Components.interfaces;
ok(Ci != null, "Access Ci");
const Cc = Components.classes;
ok(Cc != null, "Access Cc");

// Get Services.
var histsvc = Cc["@mozilla.org/browser/nav-history-service;1"].
              getService(Ci.nsINavHistoryService);
ok(histsvc != null, "Could not get History Service");
var bhist = histsvc.QueryInterface(Ci.nsIBrowserHistory);
ok(bhist != null, "Could not get Browser History Service");
var ghist = Cc["@mozilla.org/browser/global-history;2"].
            getService(Ci.nsIGlobalHistory2);
ok(ghist != null, "Could not get Global History Service");
var ghist3 = ghist.QueryInterface(Ci.nsIGlobalHistory3);
ok(ghist3 != null, "Could not get Global History Service");
var ios = Cc["@mozilla.org/network/io-service;1"].
          getService(Components.interfaces.nsIIOService);
ok(ios != null, "Could not get IO Service");
var storage = Cc["@mozilla.org/storage/service;1"].
              getService(Ci.mozIStorageService);
ok(storage != null, "Could not get Storage Service");

// Get database connection.
var mDBConn = histsvc.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
ok(mDBConn != null, "Could not get Database Connection");

function uri(URIString) {
  return ios.newURI(URIString, null, null);
}

var typedURI = uri("http://localhost:8888/tests/toolkit/components/places/tests/bug_411966/TypedPage.htm");
var clickedLinkURI = uri("http://localhost:8888/tests/toolkit/components/places/tests/bug_411966/ClickedPage.htm");
var temporaryRedirectURI = uri("http://localhost:8888/tests/toolkit/components/places/tests/bug_411966/TempRedirectPage.htm");
var permanentRedirectURI = uri("http://localhost:8888/tests/toolkit/components/places/tests/bug_411966/PermRedirectPage.htm");

// Stream Listener
function StreamListener(aChannel, aCallbackFunc) {
  this.mChannel = aChannel;
  this.mCallbackFunc = aCallbackFunc;
}

StreamListener.prototype = {
  mData: "",
  mChannel: null,

  // nsIStreamListener
  onStartRequest: function (aRequest, aContext) {
    this.mData = "";
  },

  onDataAvailable: function (aRequest, aContext, aStream, aSourceOffset, aLength) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    // We actually don't need received data
    var scriptableInputStream =
      Components.classes["@mozilla.org/scriptableinputstream;1"]
                .createInstance(Components.interfaces.nsIScriptableInputStream);
    scriptableInputStream.init(aStream);

    this.mData += scriptableInputStream.read(aLength);
  },

  onStopRequest: function (aRequest, aContext, aStatus) {
    if (Components.isSuccessCode(aStatus))
      this.mCallbackFunc(this.mData);
    else
      throw("Could not get page.");

    this.mChannel = null;
  },

  // nsIChannelEventSink
  onChannelRedirect: function (aOldChannel, aNewChannel, aFlags) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    ghist3.addDocumentRedirect(aOldChannel, aNewChannel, aFlags, true);
    // If redirecting, store the new channel
    this.mChannel = aNewChannel;
  },

  // nsIInterfaceRequestor
  getInterface: function (aIID) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    try {
      return this.QueryInterface(aIID);
    } catch (e) {
      throw Components.results.NS_NOINTERFACE;
    }
  },

  // nsIProgressEventSink (not implementing will cause annoying exceptions)
  onProgress : function (aRequest, aContext, aProgress, aProgressMax) { },
  onStatus : function (aRequest, aContext, aStatus, aStatusArg) { },

  // nsIHttpEventSink (not implementing will cause annoying exceptions)
  onRedirect : function (aOldChannel, aNewChannel) { },

  // we are faking an XPCOM interface, so we need to implement QI
  QueryInterface : function(aIID) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if (aIID.equals(Components.interfaces.nsISupports) ||
        aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
        aIID.equals(Components.interfaces.nsIChannelEventSink) ||
        aIID.equals(Components.interfaces.nsIProgressEventSink) ||
        aIID.equals(Components.interfaces.nsIHttpEventSink) ||
        aIID.equals(Components.interfaces.nsIStreamListener))
      return this;

    throw Components.results.NS_NOINTERFACE;
  }
};

// Check Callback.
function checkDB(data){
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
  var referrer = this.mChannel.QueryInterface(Ci.nsIHttpChannel).referrer;
  ghist.addURI(this.mChannel.URI, true, true, referrer);

  // We have to wait since we use lazy_add, lazy_timer is 3s
  setTimeout("checkDBOnTimeout()", 4000);
}

function checkDBOnTimeout() {
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  // Get all pages visited from the original typed one
  var sql = "SELECT url FROM moz_historyvisits_view " +
            "JOIN moz_places_view h ON h.id = place_id " +
            "WHERE from_visit IN " +
              "(SELECT v.id FROM moz_historyvisits_view v " +
              "JOIN moz_places_view p ON p.id = v.place_id " +
              "WHERE p.url = ?1)";
  var stmt = mDBConn.createStatement(sql);
  stmt.bindUTF8StringParameter(0, typedURI.spec);

  var empty = true;
  while (stmt.executeStep()) {
    empty = false;
    var visitedURI = stmt.getUTF8String(0);
    // Check that redirect from_visit is not from the original typed one
    ok(visitedURI == clickedLinkURI.spec, "Got wrong referrer for " + visitedURI);
  }
  // Ensure that we got some result
  ok(!empty, "empty table");

  SimpleTest.finish();
}
