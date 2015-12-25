// # muBackend
//
// In-progress, - not done yet...
//
// ## API-thoughts
//
// Client:
//
// - mu = new MuBackend(url)
// - mu.userIds
// - mu.login(provider) -> page-reload
// - mu.logout()
//
// - mu.newPouchDB(userId, db) -> pouchdb, connected to remote db
//
// - mu.on(message-chan, f) - chan has the form `userId:...` or `*:...`. Only logged-in user can listen on userId.
// - mu.removeListener(message-chan, f)
// - mu.emit(message-chan, message) - emit to all listeners (on network if available)
// - mu.emitOnce(message-chan, message) - emit to one random listener (on network if available)
//
// - mu.findTagged(tag) -> promise of list of user-ids with given tag
// - mu.tagSelf(tag, true/false) -> register/deregister current user as having a tag
//
// ## Introduction
// ### The name
//
// mu is the SI-prefix for micro, ie. a micro-backend, or no-backend.
//
// A developer was laying in a hammock, pondering about backends. 
// Then a cow came by and said "MU", and suddenly the develper was enlightened.
//
// ### Nanos gigantum humeris insidentes
//
// *If I have seen further, it is by standing on the shoulders of giants.* - Isaac Newton
//
// muBackend is just the empty space between the following technologies:
//
// - Passport for authentication
// - CouchDB for syncing PouchDB, at hosting data
// - Socket.io and Socket.io-p2p for communication between clients
//
// ### Files
//
// - README.md - README: a concatenation of intro.js, mu.js, and backend.js as literate code.
// - `intro.js` sample usage
// - `mu.js` the client side library
// - `backend.js the server side code
// - `dev.sh` shell script used during development
//
// ## Dev-dependencies
//
// On ubuntu linux: `apt-get install inotify-tools couchdb npm`
//
// # intro.js (literate code)
//
if(!location.hash) {
  location.href = "https://api.solsort.com/auth/github?" + location.href;

}
