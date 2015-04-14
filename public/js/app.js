// Copyright 2015 Mika "Fincodr" Luoma-aho
// Provided under the MIT license. See LICENSE file for details.
(function(parent){
  "use strict";

  // Wait until DOM is loaded
  $(document).ready(function() {

    // The main application module
    var app = parent.app = parent.app || {};

    // aliases
    var treo = window.treo;
    var promise = window.treoPromise;
    var websql = window.treoWebsql;
    var utils = app.utils;
    var debug = app.debug;
    var cryptography = app.cryptography;
    var keyStorage = new app.Backend('PrivateKeys', 'store', ['name', 'fingerprint'], 'name');
    var noteStorage = new app.Backend('PrivateNotes', 'store', ['fingerprint', 'created', 'id'], 'created');

    // test data
    var Message = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

    app = (function(){

      // define module
      var module = {
        identitiesCount: 0,
        activeIdentity: null,
        activeNote: null,

        init: function() {
          // TODO: Check for required features
          // 1. Promises (ES6)
          // 2. IndexedDB
          // 3. Crypto and SubtleCrypto
          //
          // Open keyStorage database
          keyStorage.open().then(function(db){
            // Open noteStorage database
            noteStorage.open().then(function(db){
              module.startApp();
            }).catch(function(err){
              debug.error(err);
            });
          }).catch(function(err){
            debug.error(err);
          });
        },

        setActiveIdentity: function(obj) {
          module.activeIdentity = obj;
          module.refreshNotes();
          module.decrypt();
          if (module.identitiesCount!==0) {
            // Check if we have any identity selected
            if (module.activeIdentity) {
              $('#notifySelectIdentity').addClass('hidden');
              $('#notesSection').removeClass('hidden');
            } else {
              $('#notifySelectIdentity').removeClass('hidden');
              $('#notesSection').addClass('hidden');
            }
          } else {
            $('#notifySelectIdentity').addClass('hidden');
            $('#notesSection').removeClass('hidden');
          }
        },

        setActiveNote: function(obj) {
          module.activeNote = obj;
          $('#input').val(obj.data);
          module.decrypt().then(function(){
            var output = $('#output').val();
            $('#outputNote').val(output);
          });
        },

        saveNote: function() {
          // Save note to noteStorage
          var $note = $('#output');
          var data = $note.val();
          // Save one note to noteStorage
          var now = moment();
          var expires = moment(now).add(1, 'days');
          var noteId = new Uint8Array(20);
          window.crypto.getRandomValues(noteId);
          noteStorage.saveData({
            created: now.toISOString(),
            expires: expires.toISOString(),
            fingerprint: module.activeIdentity.fingerprint,
            id: noteId,
            data: data
          }).then(function(){
            module.refreshNotes();
          }).catch(function(err){
            console.log(err);
          });
        },

        refreshNotes: function() {
          // Update notes view (notes for active identity)
          var $notes = $('#notesTableBody');
          $notes.empty();
          var $notesFooter = $('#notesTableFooter');
          $notesFooter.empty();
          var notesCount = 0;
          if (module.activeIdentity) {
            noteStorage.getAllData().then(function(data){
              _.forEach(data, function(obj){
                if (utils.compareTwoUint8Arrays(module.activeIdentity.fingerprint, obj.fingerprint)) {
                  notesCount++;
                  var created = moment(obj.created);
                  var expires = moment(obj.expires);
                  var diff = expires.diff(created, 'hours');
                  var $el = $('<tr class="clickable-row">' +
                    '<td>' + created.toISOString() + '</td>' +
                    '<td>in ' + diff + ' hour(s)</td>' +
                    '<td class="id">' + utils.convertUint8ArrayToHex(obj.id, ':') + '</td>' +
                    '<td><span class="label label-danger">not signed</span></td>' +
                  '</tr>');
                  $notes.append($el);
                  $el.click(function(){
                    // set active
                    $notes.find('tr').removeClass('info');
                    $el.addClass('info');
                    module.setActiveNote(obj);
                    $('#modalDecryptNote').modal('show');
                  });
                }
              });
              $notesFooter.html('Total of ' + notesCount + ' note(s)');
            }).catch(function(err){
              console.log(err);
            });
          }

          // Update debug view (all notes)
          var $debugNotes = $('#debugNotes');
          noteStorage.getAllData().then(function(data){
            $debugNotes.empty();
            _.forEach(data, function(obj){
              // Append debug
              var $el = $('<a href="#" class="list-group-item">' +
                  'ID: <div class="list-group-item-pre">' + utils.convertUint8ArrayToHex(obj.id, ':') + '</div>' +
                  'PublicKey fingerprint: <div class="list-group-item-pre">' + utils.convertUint8ArrayToHex(obj.fingerprint, ':') + '</div>' +
                  'Created: <div class="list-group-item-pre">' + obj.created + '</div>' +
                  'Expires: <div class="list-group-item-pre">' + obj.expires + '</div>' +
                '</a>');
              $debugNotes.append($el);
              $el.click(function(){
                // set active
                $debugNotes.find('a').removeClass('active');
                $el.addClass('active');
                module.setActiveNote(obj);
              });
            });
          }).catch(function(err){
            console.log(err);
          });
        },

        refreshIdentities: function() {
          // Load keyStorage information
          module.identitiesCount = 0;
          var $debugIdentities = $('#debugIdentities');
          var $privateIdentities = $('#privateKeysTableBody');
          keyStorage.getAllData().then(function(data){
            $debugIdentities.empty();
            $privateIdentities.empty();
            module.identitiesCount = data.length;
            if (module.identitiesCount!==0) {
              $('#notifyCreateIdentity').addClass('hidden');
            } else {
              $('#notifyCreateIdentity').removeClass('hidden');
            }
            _.forEach(data, function(obj){
              var usages = [];
              if (obj.public) {
                usages = _.union(usages, obj.public.usages);
              }
              if (obj.private) {
                usages = _.union(usages, obj.private.usages);
              }
              var usageLabels = '';
              var types = {
                'encrypt': 'success',
                'decrypt': 'danger',
                'sign': 'info',
                'verify': 'info'
              };
              _.forEach(usages, function(usage){
                var type = types[usage] || 'default';
                usageLabels += ' <span class="label label-' + type + '">' + usage + '</span>';
              });

              // append identities (private and public)
              var $el1 = $('<tr class="clickable-row">' +
                '<td>' + obj.name + '</td>' +
                '<td class="id">' + utils.convertUint8ArrayToHex(obj.fingerprint, ':') + '</td>' +
                '<td>' + usageLabels + '</td>' +
                '<td class="pull-center"><a data-action="delete" href="#"><i class="glyphicon glyphicon-trash"></i>' +
              '</tr>');
              $privateIdentities.append($el1);
              $el1.click(function(e){
                if ($(e.target).parent().data('action') == 'delete') {
                  // delete
                  keyStorage.deleteFirst(obj.name).then(function(){
                    module.refreshIdentities();
                  });
                  e.preventDefault();
                } else {
                  // set active
                  $privateIdentities.find('tr').removeClass('info');
                  $el1.addClass('info');
                  module.setActiveIdentity(obj);
                  $('#navbar a[href="#notes"]').tab('show');
                }
              });

              // append debug
              var $el2 = $('<a href="#" class="list-group-item">' +
                '<h4 class="list-group-item-heading">' + obj.name + '</h4>' +
                '<div class="list-group-item-pre">' + utils.convertUint8ArrayToHex(obj.fingerprint, ':') +
                usageLabels +
                '</div>' +
              '</a>');

              $debugIdentities.append($el2);
              $el2.click(function(){
                // set active
                $debugIdentities.find('a').removeClass('active');
                $el2.addClass('active');
                module.setActiveIdentity(obj);
              });
              module.setActiveIdentity(null);
            });
          }).catch(function(err){
            console.log(err);
          });
        },

        startApp: function() {

          // Attach handlers
          $('#btnClearDebug').click(function(){
            debug.clear();
          });

          $('#btnClearInput,#btnClearOutput').click(function(){
            $(this).closest('.panel').find('textarea').eq(0).val('');
          });

          $('#btnDefaultInput').click(function(){
            $(this).closest('.panel').find('textarea').eq(0).val(Message);
          });

          $('#btnClearKeys').click(function(){
            keyStorage.clear().then(function(){
              module.refreshIdentities();
            });
          });

          $('#btnClearNotes').click(function(){
            noteStorage.clear().then(function(){
              module.refreshNotes();
            });
          });

          $('#btnRemoveKey').click(function(){
            keyStorage.deleteFirst(module.activeIdentity.name).then(function(){
              module.refreshIdentities();
            });
          });

          $('#btnRemoveNote').click(function(){
            noteStorage.deleteFirst(module.activeNote.created).then(function(){
              module.refreshNotes();
            });
          });

          $('#btnSwapOutputWithInput').click(function(){
            var input = $('#input').val();
            var output = $('#output').val();
            $('#input').val(output);
            $('#output').val(input);
          });

          $('#btnSelectKeys').click(function(){
            $('#navbar a[href="#identities"]').tab('show');
          });

          $('#btnSaveOutput').click(function(){
            module.saveNote();
          });

          $('#btnDigest').click(function(){
            module.digest();
          });

          $('#btnSign').click(function(){
            module.sign();
          });
          $('#btnVerify').click(function(){
            module.verify();
          });

          $('#btnGenerateKeys').click(function(){
            var name = $('#inputName').val();
            var exportable = $('#checkboxExportable').is(":checked");
            if (name.length!==0) {
              module.generateKey(exportable, name);
              $('#modalGenerateIdentity').modal('hide');
              $('#inputName').val('');
              $('#checkboxExportable').attr('checked', false);
            }
          });
          $('#btnGenerateSigningKeys').click(function(){
            var name = $('#inputSigningKeysName').val();
            module.generateSigningKey(name);
            $('#inputSigningKeysName').val('');
          });

          $('#btnEncrypt').click(function(){
            module.encrypt();
          });
          $('#btnDecrypt').click(function(){
            module.decrypt();
          });

          $('#btnExportKey').click(function(){
            module.exportKey();
          });
          $('#btnImportKey').click(function(){
            module.importKey();
          });

          // Attach debug to debug div element
          debug.attach(document.getElementById('console'));

          module.refreshIdentities();
          module.refreshNotes();

          // Check Web Cryptography API support
          if (cryptography.isSupported()) {
            debug.info('Web Cryptography API is supported');
          } else {
            debug.error('Web Cryptography API is NOT supported!');
          }
        },

        sign: function() {
          var data = $('#input').val();
          try {
            var promise = window.crypto.subtle.sign({
                name: "RSASSA-PKCS1-v1_5",
              },
              module.activeIdentity.private,
              utils.convertTextToUint8Array(data)
            ).then(
              function(signedData){
                var data2 = new Uint8Array(signedData);
                debug.info('<b>Signed:</b><br />' + utils.convertUint8ArrayToHexView(data2, 16));
                var base64 = utils.convertUint8ArrayToBase64(data2);
                $('#output').val(base64);
              },
              function(e){
                $('#output').val('');
                debug.error('<b>Sign failed!</b> ' + e.message);
              }
            )
            .catch(function(e){
              $('#output').val('');
              debug.error('<b>Sign failed!</b> ' + e.message);
            });
          } catch (e) {
            $('#output').val('');
            debug.error('<b>Sign failed!</b> ' + e.message);
          }
        },

        verify: function() {
          var data = $('#input').val();
          var encryptedDataFromBase64 = utils.convertBase64ToUint8Array(data);
          var signature = $('#output').val();
          var signatureFromBase64;
          if (_.endsWith(signature, '==')) {
            signatureFromBase64 = utils.convertBase64ToUint8Array(signature);
          } else {
            signatureFromBase64 = utils.convertTextToUint8Array(signature);
          }
          try {
            debug.info('<b>Verify</b><br/>Signature:<br/>' + utils.convertUint8ArrayToHexView(signatureFromBase64, 16) + '<br/>Data:<br/>' + utils.convertUint8ArrayToHexView(encryptedDataFromBase64, 16));
            var promise = window.crypto.subtle.verify({
                name: "RSASSA-PKCS1-v1_5"
              },
              module.activeIdentity.public,
              encryptedDataFromBase64,
              signatureFromBase64
            )
            .then(function(result){
              if (result) {
                debug.log('<b>Signature verified OK!</b>');
              } else {
                debug.error('<b>Invalid signature/data!</b>');
              }
            })
            .catch(function(e){
              debug.error('<b>Verify failed!</b> Catched error: ' + e.message);
            });
          } catch (e) {
            debug.error('<b>Verify failed!</b> Exception: ' + e.message);
          }
        },

        encrypt: function() {
          var data = $('#input').val();
          try {
            var promise = window.crypto.subtle.encrypt({
                name: "RSA-OAEP",
              },
              module.activeIdentity.public,
              utils.convertTextToUint8Array(data)
            ).then(
              function(encryptedData){
                var data = new Uint8Array(encryptedData);
                debug.info('<b>Encrypted:</b><br />' + utils.convertUint8ArrayToHexView(data, 16));
                var base64 = utils.convertUint8ArrayToBase64(data);
                $('#output').val(base64);
              },
              function(e){
                $('#output').val('');
                debug.error('<b>Encrypt failed!</b> ' + e.message);
              }
            )
            .catch(function(e){
              $('#output').val('');
              debug.error('<b>Encrypt failed!</b> ' + e.message);
            });
          } catch (e) {
            $('#output').val('');
            debug.error('<b>Encrypt failed!</b> ' + e.message);
          }
        },

        decrypt: function() {
          return new Promise(function(resolve, reject){
            var data = $('#input').val();
            var encryptedDataFromBase64 = utils.convertBase64ToUint8Array(data);
            try {
              var promise = window.crypto.subtle.decrypt({
                  name: "RSA-OAEP"
                },
                module.activeIdentity.private,
                encryptedDataFromBase64
              )
              .then(
                function(result){
                  var decryptedData = new Uint8Array(result);
                  var data = utils.convertArrayBufferToText(decryptedData);
                  debug.info('<b>Decrypted:</b><br />' + utils.convertUint8ArrayToHexView(decryptedData, 16));
                  $('#output').val(data);
                  resolve(data);
                },
                function(e){
                  $('#output').val('');
                  debug.error('<b>Decrypt failed!</b> ' + e.message);
                  reject(e.message);
                }
              )
              .catch(function(e){
                $('#output').val('');
                debug.error('<b>Decrypt failed!</b> ' + e.message);
                reject(e.message);
              });
            } catch (e) {
              $('#output').val('');
              debug.error('<b>Decrypt failed!</b> ' + e.message);
              reject(e.message);
            }
          });
        },

        importKey: function() {
          var strPub = $('#input').val();
          var strPrv = $('#output').val();
          var publicKey = null;
          var privateKey = null;
          function importPubKey() {
           return new Promise(function(resolve, reject){
              try {
                window.crypto.subtle.importKey(
                  "jwk",
                  JSON.parse(strPub),
                  {
                    name: "RSA-OAEP",
                    hash: {name: "SHA-256"},
                  },
                  true, // exportable
                  ["encrypt"] // encrypt for publicKey import
                )
                .then(function(key){
                    //returns a publicKey (or privateKey if you are importing a private key)
                    publicKey = key;
                    resolve(true);
                },function(err){
                  console.error(err);
                  resolve(false);
                })
                .catch(function(err){
                    console.error(err);
                    resolve(false);
                });
              } catch (e) {
                resolve(false);
              }
            });
          }

          function importPrvKey() {
            return new Promise(function(resolve, reject){
              try {
                window.crypto.subtle.importKey(
                  "jwk",
                  JSON.parse(strPrv),
                  {
                    name: "RSA-OAEP",
                    hash: {name: "SHA-256"},
                  },
                  false, // exportable
                  ["decrypt"] // decrypt for privateKey import
                )
                .then(function(key){
                    //returns a publicKey (or privateKey if you are importing a private key)
                    privateKey = key;
                    resolve(true);
                },function(err){
                  console.error(err);
                  resolve(false);
                })
                .catch(function(err){
                  console.error(err);
                  resolve(false);
                });
              } catch (e) {
                resolve(false);
              }
            });
          }

          Promise.all([importPubKey(), importPrvKey()]).then(function(){
            // export public key
            window.crypto.subtle.exportKey(
              'spki',
              publicKey
            )
            .then(function(exportedKey){
              var data = new Uint8Array(exportedKey);
              window.crypto.subtle.digest(
                {
                  name: "SHA-1",
                },
                data
              )
              .then(function(hash) {
                var fingerprint = new Uint8Array(hash);
                debug.info('<b>Fingerprint:</b><br />' + utils.convertUint8ArrayToHexView(fingerprint, 16));
                // Save one key to keyStorage
                keyStorage.saveData({
                  name: 'Imported ' + new Date().toISOString(),
                  public: publicKey,
                  private: privateKey,
                  fingerprint: fingerprint
                }).then(function(){
                  module.refreshIdentities();
                }).catch(function(e){
                  debug.error('<b>keyStorage save failed</b> ' + e);
                });
              })
              .catch(function(e){
                debug.error('<b>Digest on publicKey failed!</b> ' + e);
              });
            }).catch(function(e){
              debug.error('<b>Export publicKey failed!</b> ' + e);
            });
          }).catch(function(e){
            debug.error('<b>Promise failed while importing public and private keys</b>');
          });
        },

        exportKey: function() {
          $('#input').val('');
          $('#output').val('');
          // export public key
          window.crypto.subtle.exportKey(
            'jwk',
            module.activeIdentity.public
          )
          .then(function(exportedKey){
            $('#input').val(JSON.stringify(exportedKey));
          });
          // export private key
          window.crypto.subtle.exportKey(
            'jwk',
            module.activeIdentity.private
          )
          .then(function(exportedKey){
            $('#output').val(JSON.stringify(exportedKey));
          });
        },

        generateKey: function(exportable, name) {
          try {
            window.crypto.subtle.generateKey(
              {
                name: "RSA-OAEP",
                modulusLength: 2048, // 1024, 2048, 4096
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: {
                  name: "SHA-256" // "SHA-1", "SHA-256", "SHA-384", "SHA-512"
                },
              },
              exportable, //whether the key is extractable (i.e. can be used in exportKey)
              ["encrypt", "decrypt"]
            )
            .then(function(key){
              // export public key
              window.crypto.subtle.exportKey(
                'spki',
                key.publicKey
              )
              .then(function(exportedKey){
                var data = new Uint8Array(exportedKey);
                window.crypto.subtle.digest(
                  {
                    name: "SHA-1",
                  },
                  data
                )
                .then(function(hash) {
                  var data = new Uint8Array(hash);
                  debug.info('<b>Fingerprint:</b><br />' + utils.convertUint8ArrayToHexView(data, 16));
                  // Save one key to keyStorage
                  keyStorage.saveData({
                    name: name,
                    public: key.publicKey,
                    private: key.privateKey,
                    fingerprint: data
                  }).then(function(){
                    module.refreshIdentities();
                  }).catch(function(e){
                    debug.error('<b>Digest on publicKey failed!</b> ' + e.message);
                  });
                })
                .catch(function(e){
                  debug.error('<b>Digest on publicKey failed!</b> ' + e.message);
                });
              }).catch(function(e){
                debug.error('<b>Export publicKey failed!</b> ' + e.message);
              });
            })
            .catch(function(e){
              debug.error('<b>GenerateKey failed!</b> ' + e.message);
            });
          } catch (e) {
            debug.error('<b>GenerateKey failed!</b> ' + e.message);
          }
        },

        generateSigningKey: function(name) {
          try {
            window.crypto.subtle.generateKey(
              {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048, // 1024, 2048, 4096
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: {
                  name: "SHA-256" // "SHA-1", "SHA-256", "SHA-384", "SHA-512"
                },
              },
              true, //whether the key is extractable (i.e. can be used in exportKey)
              ["sign", "verify"]
            )
            .then(function(key){
              // export public key
              window.crypto.subtle.exportKey(
                'spki',
                key.publicKey
              )
              .then(function(exportedKey){
                var data = new Uint8Array(exportedKey);
                window.crypto.subtle.digest(
                  {
                    name: "SHA-1",
                  },
                  data
                )
                .then(function(hash) {
                  var data = new Uint8Array(hash);
                  debug.info('<b>Fingerprint:</b><br />' + utils.convertUint8ArrayToHexView(data, 16));
                  // Save one key to keyStorage
                  keyStorage.saveData({
                    name: name,
                    public: key.publicKey,
                    private: key.privateKey,
                    fingerprint: data
                  }).then(function(){
                    module.refreshIdentities();
                  }).catch(function(e){
                    debug.error('<b>Digest on publicKey failed!</b> ' + e.message);
                  });
                })
                .catch(function(e){
                  debug.error('<b>Digest on publicKey failed!</b> ' + e.message);
                });
              }).catch(function(e){
                debug.error('<b>Export publicKey failed!</b> ' + e.message);
              });
            })
            .catch(function(e){
              debug.error('<b>generateSigningKey failed!</b> ' + e.message);
            });
          } catch (e) {
            debug.error('<b>generateSigningKey failed!</b> ' + e.message);
          }
        },

        digest: function() {
          var msg = $('#input').val();
          debug.log('<b>Plain text:</b><br />' + utils.convertUint8ArrayToHexView(utils.convertTextToUint8Array(msg), 16));
          try {
            window.crypto.subtle.digest(
              {
                name: "SHA-512",
              },
              new Uint8Array(utils.convertTextToUint8Array(msg)) //The data you want to hash as an ArrayBuffer
            )
            .then(function(hash) {
              var data = new Uint8Array(hash);
              debug.info('<b>Digest:</b><br />' + utils.convertUint8ArrayToHexView(data, 16));
              var base64 = utils.convertUint8ToBase64(data);
              $('#output').val(base64);
            })
            .catch(function(err){
              $('#output').val('');
              debug.error('<b>Digest failed!</b> ' + e.message);
            });
          } catch (e) {
            debug.error('<b>Digest failed!</b> ' + e.message);
          }
        }
      };

      return module;
    })();

    // init main
    app.init();

  });

})(this);
