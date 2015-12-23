/*
 * BOT CONFIGURATION:
 */

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'jeopardy';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bot';

// TODO Localhost as default, better documented Imgur deploys, deprecate S3.
export const AWS_KEY = process.env.AWS_KEY || '';
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || '';

export let AWS = false;
if (AWS_KEY) {
  AWS = true;
}

// The URL for the mongo database:
export const MONGO = process.env.MONGO_URL || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy';

// The port for the application:
export const PORT = process.env.PORT || 8000;

/*
 * GAME CONFIGURATION
 */

// Question values for jeopardy:
export const VALUES = [
  200,
  400,
  600,
  800,
  1000,
];

// Question values for double jeopardy:
export const DOUBLE_JEOPARDY_VALUES = [
  400,
  800,
  1200,
  1600,
  2000,
];

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.6;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
