// Copyright 2015 Mika "Fincodr" Luoma-aho
// Provided under the MIT license. See LICENSE file for details.
(function(parent){
  "use strict";

  // The main application module
  var app = parent.app = parent.app || {};

  // config module
  app.config = {
    useServerBackend: true,				// Use server backend (true) or local storage (false) ?
    remoteAddress: 'https://localhost'	// Backend address
  };

})(this); // this = window
