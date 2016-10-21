// # MuBackend
//
config = {
  "github": {
    "clientID": process.env.GITHUB_ID,
    "clientSecret": process.env.GITHUB_SECRET,
  },
  "twitter": {
    "consumerKey": process.env.TWITTER_ID,
    "consumerSecret": process.env.TWITTER_SECRET
  },
  "wordpress": {
    "clientID": process.env.WORDPRESS_ID,
    "clientSecret": process.env.WORDPRESS_SECRET
  },
  "facebook": {
    "clientID": process.env.FACEBOOK_ID,
    "clientSecret": process.env.FACEBOOK_SECRET
  },
  "google": {
    "clientID": process.env.GOOGLE_ID,
    "clientSecret": process.env.GOOGLE_SECRET
  },
  "linkedin": {
    "consumerKey": process.env.LINKEDIN_ID,
    "consumerSecret": process.env.LINKEDIN_SECRET
  },
  "expressSession": {
    "resave": false,
    "saveUninitialized": true,
    "secret": process.env.SESSION_SECRET || String(Math.random())
  },
  "url": process.env.URL,
  "couchdb": {
    "url": process.env.COUCHDB_URL,
    "user": process.env.COUCHDB_USER || "admin",
    "password": process.env.COUCHDB_PASS
  },
  port: process.env.PORT || 8888
};

console.log(config);

// ## start express server
var app = require('express')();
app.use(require('express-session')(config.expressSession));
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
});
var server = require('http').Server(app);
server.listen(config.port);
console.log('starting server on port', config.port);
// ## Util
//
var crypto = require('crypto');
var btoa = require('btoa');
function uniqueId () { return btoa(crypto.randomBytes(12)); }
function jsonOrNull(str) { try { return JSON.parse(str);} catch(_) { return undefined; }}
// ## CouchDB
//
var request = require('request');
var couchUrl = config.couchdb.url.replace('//', '//' +
    config.couchdb.user + ':' + config.couchdb.password + '@');
function getUser (user, callback) {
  request.get(couchUrl + '_users/org.couchdb.user:' + user,
      function (err, response, body) {
        callback(err ? {error: 'request error'} : JSON.parse(body));
      });
}
function createUser (user, password, meta) { // ###
  request.put({
    url: couchUrl + '_users/org.couchdb.user:' + user,
    json: {
      name: user,
      meta: meta,
      password: password,
      plain_pw: password,
      roles: [],
      type: 'user'
    }
  }, function (err, __, body) {
  });
}
function validateUser(user, password, callback) { // ###
  request.get(couchUrl + '_users/org.couchdb.user:' + user, function (err, _, body) {
    var body = jsonOrNull(body) || {};
    if (err || password !== body.plain_pw) { callback("Login error"); } else { callback(); }
  });
}
// ## Login
//
var passport = require('passport');
var loginRequests = {};

function loginHandler (provider) {
  return function (req, res) {
    passport.authenticate(provider)(req, res, function (profile) {
      if (profile.provider === 'Wordpress') profile.id = profile._json.ID;
      var user = encodeURIComponent(profile.provider + '_' + profile.id);
      if (!profile.id) {
        return res.redirect(app);
      }
      getUser(user, function (o) {
        var pw;
        if (!o.error) {
          pw = o.plain_pw;
        } else {
          pw = uniqueId();
          profile._json.loginProvider = provider;
          createUser(user, pw, profile._json);
        }

        var token = uniqueId();
        var app = req.session.app;
        loginRequests[token] = {user: user, token: pw, time: Date.now()};
        if (app.indexOf('#') === -1) {
          app += '#';
        }
        res.redirect(app + 'muBackendLoginToken=' + token);
      });
    });
  };
}

function login (access, refresh, profile, done) {
  console.log('login', JSON.stringify(profile));
  return done(profile);
}
function addStrategy (name, Strategy, opt) {
  passport.use(new Strategy(config[name], login));
  var callbackName = 'auth/' + name + '/callback'
    config[name].callbackURL = config[name].callbackURL || config.url + callbackName;
  app.get('/auth/' + name,
      function (req, res) {
        req.session.app = req.url.replace(/^[^?]*./, '');
        return passport.authenticate(name, opt)(req, res);
      });
  app.get('/' + callbackName, loginHandler(name));
}

addStrategy('github', require('passport-github'));
/*
addStrategy('twitter', require('passport-twitter'));
addStrategy('linkedin', require('passport-linkedin'));
addStrategy('google', require('passport-google-oauth').OAuth2Strategy, {scope: 'profile'});
addStrategy('facebook', require('passport-facebook'));
addStrategy('wordpress', require('passport-wordpress').Strategy, {scope: 'auth'});
*/

// ## HTTP-api
function handleHttp(name, f) { // ###
  app.all('/mu/' + name, function(req, res) {
    req.pipe(require('concat-stream')(function(body) {
      f.apply(null, (jsonOrNull(body) || []).concat([function(){
        res.end(JSON.stringify(Array.prototype.slice.call(arguments, 0)));
      }]));
    }));
  });
};
handleHttp('loginPassword', validateUser); // ###
handleHttp('loginToken', function (token, f) { // ###
  f(loginRequests[token]);
  delete loginRequests[token];
});
// ## CORS
//
app.get('/cors/', function (req, res) {
  request.get(req.url.replace(/^[^?]*./, ''), function (_, __, body) {
    res.header('Content-Type', 'text/plain');
    res.end(body);
  });
});

// ## Hosting of static resources
//
app.use('/mu/', require('express').static('./'));