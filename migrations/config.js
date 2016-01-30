const url = require('url');

// Stolen from src/config:
const MONGO = process.env.MONGO_URL || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy';

const parsedUrl = url.parse(MONGO);
const auth = {};
if (parsedUrl.auth) {
  auth.user = parsedUrl.auth.split(':')[0];
  auth.password = parsedUrl.auth.split(':')[1];
}

module.exports = {
  host: parsedUrl.hostname,
  port: parsedUrl.port,
  db: parsedUrl.path.substr(1),
  user: auth.user,
  password: auth.password,
  collection: 'migrations',
  directory: './migrations',
  poolSize: 1,
};
