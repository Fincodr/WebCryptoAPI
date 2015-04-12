// Copyright 2015 Mika "Fincodr" Luoma-aho
// Provided under the MIT license. See LICENSE file for details.
(function(parent){
  "use strict";

  // The main application module
  var app = parent.app = parent.app || {};

  // crypto module
  app.cryptography = (function(){

    var self = this;

    // Sane defaults (in 2015)
    var BITS = 2048;

    var module = {

      checkSupport: function() {
        // TODO: implement the actual algorithm support checking
        // by running different tests.
        return true;
      },

      isSupported: function() {
        // check that we have crypto interface
        if ("crypto" in window) {
          // check that we have subtleCryto interface
          if ("subtle" in window.crypto) {
            // check that we can use RSA-OAEP algorithm with encrypt, decrypt, sign, digest, generateKey, exportKey
            var algo = ["RSA-OAEP"];
            var methods = ["encrypt", "decrypt", "sign", "digest", "generateKey", "exportKey"];
            var keyUsage = ["encrypt", "decrypt"];
            if (module.checkSupport(algo, methods, {keyUsage: keyUsage})) {
              return true;
            }
          }
        }
        return false;
      }

    };

    return module;

  })();

})(this); // this = window


