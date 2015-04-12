// Copyright 2015 Mika "Fincodr" Luoma-aho
// Provided under the MIT license. See LICENSE file for details.
(function(parent){
  "use strict";

  // The main application module
  var app = parent.app = parent.app || {};

  // utils module
  app.utils = (function(){

    var self = this;

    var module = {
      stringPadRight: function(str, len, ch) {
        var chx = ch || ' ';
        while(str.length < len) {
          str += chx;
        }
        return str;
      },

      stringPadLeft: function(s, len, ch) {
        var str = '', chx = ch || ' ';
        while(str.length + s.length < len) {
          str += chx;
        }
        str += s;
        return str;
      },

      convertTextToUint8Array: function(s) {
        var data = new Uint8Array(s.length);
        for (var i=0, len=s.length; i!==len; ++i) {
          data[i] = s.charCodeAt(i);
        }
        return data;
      },

      convertTextToArrayBuffer: function(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i=0, len=s.length; i!==len; ++i) {
          view[i] = s.charCodeAt(i);
        }
        return buf;
      },

      convertBase64ToUint8Array: function(data) {
        var binary = atob(data);
        var len = binary.length;
        var buf = new ArrayBuffer(len);
        var view = new Uint8Array(buf);
        for (var i=0; i!==len; ++i) {
          view[i] = binary.charCodeAt(i);
        }
        return view;
      },

      convertUint8ArrayToBase64: function(data) {
        var s = module.convertUint8ArrayToText(data);
        return btoa(s);
      },

      convertUint8ArrayToText: function(data) {
        var s = '';
        for (var i=0, len=data.length; i!==len; ++i) {
          s += String.fromCharCode(data[i]);
        }
        return s;
      },

      convertArrayBufferToText: function(data) {
        var s = '';
        for (var i=0, len=data.byteLength; i!==len; ++i) {
          s += String.fromCharCode(data[i]);
        }
        return s;
      },

      convertUint8ArrayToHex: function(data, sep) {
        var a, h = '';
        var ch = sep===null?' ':sep;
        for (var i=0, len=data.length; i!==len; ++i) {
          a = data[i];
          h += i>0?ch:'';
          h += a<16?'0':'';
          h += a.toString(16);
        }
        return h;
      },

      convertUint8ArrayToHexView: function(data, width) {
        var a, h = '', s = '';
        var ch = ' ';
        var n = 0;
        h = '[length: ' + data.length + ' bytes (' + data.length * 8 + ' bits)]\n';
        for (var i=0, len=data.length; i!==len; ++i) {
          a = data[i];
          h += n>0?ch:'';
          h += a<16?'0':'';
          h += a.toString(16);
          n++;
          s += ((a>=97 && a<=122)|(a>=65 && a<=90)|(a>48 && a<=57))?String.fromCharCode(a):'.';
          if (n===width) {
            h += '  ' + s;
            h += '\n';
            n=0;
            s='';
          }
        }
        if (n!==0) {
          h += '  ' + module.stringPadLeft('', (width-n)*3) + s;
        }
        return h;
      }

    };

    return module;

  })();

})(this); // this = window


