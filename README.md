# SecretNote application source code

For the thesis, as an case study, a proof-of-concept end-to-end secure example application for sharing encrypted and digitally signed messages was implemented. The example application is called **SecretNotes** and it utilizes the new Web Cryptography API for performing cryptographic operations directly on the web browser.

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

