# SecretNote application source code

![Welcome](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S01_A00_welcome.png)

For the JavaScript Web Cryptography API thesis, as an case study, a proof-of-concept end-to-end secure example application for sharing encrypted and digitally signed messages was implemented. The example application is called **SecretNotes** and it utilizes the new Web Cryptography API for performing cryptographic operations directly on the web browser.

The example application uses asymmetric public-key and symmetric secret-key cryptography as a means to protect the sent messages and also provides a digital signature that can be verified by the receiver (if the sender chooses to share identity). Symmetric secret-key cryptography is used to encrypt and decrypt the actual message payload, allowing it to be longer than the maximum length that could be normally encrypted using asymmetric cryptography.
 
The application does not reveal the plain text message, the decryption keys or other metadata such as the sender identity or the receiver's name to the server, so nothing can be leaked or revealed since server does not contain anything that could be used to decrypt the messages (traditionally instant messaging applications store the messages and decryption keys on the server which means that if the server security is compromised all of the messages and the decryption keys needed to decrypt the messages could be leaked).

The only metadata that the example application shares with the server is the fingerprint, an SHA-1 message digest (hash) of the public-key which was used to encrypt the note contents. The fingerprint is used to index the notes on the server so that the notes can be retrieved by the user which have the correct decryption key for reading the notes. The note creation date is managed by the server and the note is automatically expired after 24 hours have passed.
 
Permanent link for the thesis: http://urn.fi/URN:NBN:fi:amk-201505188702

## Configuration

Copy the public/js/config.template.js to public/js/config.js and edit the file to set configuration.

| Variable | Values | Description |
| ------------- | ------------- | ------------- |
| useServerBackend | Boolean  | Set to _true_ to enable server backed. Default value is _false_ |
| remoteAddress | String  | The http/https endpoint to use for server when _useServerBackend_ is set to true |

Config file contents:

```
...
app.config = {
  useServerBackend: true,				// Use server backend (true) or local storage (false) ?
  remoteAddress: 'https://localhost'	// Backend address
};
```

## Standalone version

The SecretNotes application can be run in standalone mode.

Directly from GitHub:
https://webcryptoapiex.github.io/secretnote/

Or from your own computer by using node to server the application from localhost:

```
$ cd server
$ sudo node server.js
```

Open up the application from https://localhost/

## Mongo backend version

The SecretNotes application can be run with mongodb backend.

Prerequisites:
- MongoDB

```
$ cd server
$ sudo node noteserver.js
```

## Screenshots

**Alice** chooses to create a new identity. The following figure contains the notes:

1. Alice fills in the name which will be used internally for this identity. The name is not shared and is only used for identifying this identity stored locally.

2. Alice decides not to make the identity exportable which means that Alice’s private identity cannot be exported out of the application. This option gives a extra security since Alice’s private key is not exportable from the JavaScript environment.

![S02](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S02_A01_create_identity_dialog.png)

Next, **Bob** creates an identity on his own computer as seen in the following figure. The figure contains the following notes:

1. Bob fills in the name which will be used internally for this identity. The name is not shared and is only used for identifying this identity stored locally.
2. Bob decides to make the identity exportable which means that Bob can share his private identity with other devices or computers that he also uses for sending notes.

![S03](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S03_B01_create_identity_dialog.png)

Bob exports the public identity as seen in the following figure. The figure contains the note:

1. Bob selects and copies the public part of the identity for sharing it with Alice. Bob can share the public identity using any public or private communication channel.

![S04](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S04_B02_export_identity_dialog.png)

Next, Alice has received Bob’s public identity by email, web page or any other public communication channel and imports it as a known identity as seen in following figure. The figure contains the following notes:

1.Alice fills in the name which will be used internally for this identity.

2.Alice copies and pastes Bob’s public identity into the identity field.

![S05](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S05_A04_import_identity_dialog.png)

Next Figure shows how Alice can manage identities stored in the browser by using the identities section of the application. The figure contains the following notes:

1. Your identities section contains the private identities and allows the user to create new identity and import identities.

2. Usage section displays the usage information for identity. In this example Alice’s own private identity can be used for encrypting, decrypting, signing and verifying.
 
3. Identities can be deleted with the trashcan icon and exported with the download icon.

4. Known identities section contains the public identities that have been imported. In this case Bob’spublic identity is listed.

5. Usage section displays the usage information for identity. In this example Bob identity can be used for encrypting and verifying.

![S06](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S06_A05_manage_identities.png)

Next,Alice decides to write a note to Bob as seen in the following figure. The figure contains thefollowing notes:

1. Alice selects Bob as the target identity from the drop down list.

2. Alice writes the note to be sent.

3. Alice decides to remain anonymous. Thus she will not reveal her true identity to thereceiver.

![S07](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S07_A06_create_note.png)
![S08](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S08_B03_notes.png)
![S09](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S09_B04_decrypted_note.png)
![S10](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S10_A07_create_note.png)
![B05](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S11_B05_decrypted_note_unknown_sender.png)
![B06](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S12_B06_import_identity.png)
![B07](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S13_B07_decrypted_node_trusted_sender.png)
![DebugMode](https://raw.githubusercontent.com/Fincodr/WebCryptoAPI/master/images/S14_debug.png)
