/*
 * BOT CONFIGURATION:
 */

export const AWS_KEY = process.env.AWS_KEY || '';
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || '';

export let AWS = false;
if (AWS_KEY) {
  AWS = true;
}

export const API_TOKEN = process.env.JBOT_API_TOKEN || '';

// The outgoing webhook token used to verify requests:
export const VERIFY_TOKEN = process.env.JBOT_OUTGOING_WEBHOOK_TOKEN || '';

// The mode the bot is in:
export let MODE = process.env.JBOT_MODE;

// Set mode defaults:
if (!MODE) {
  if (API_TOKEN && VERIFY_TOKEN) {
    MODE = 'hybrid';
  } else if (API_TOKEN) {
    MODE = 'bot';
  } else {
    MODE = 'response';
  }
}
// Validate the mode configuration:
if (MODE !== 'response' && MODE !== 'hybrid' && MODE !== 'bot') {
  console.warn(`An invalid mode was provided. Found mode "${MODE}".`);
  // Default it back to response:
  MODE = 'response';
}

// The URL for the mongo database:
export const MONGO = process.env.MONGO_URL || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy';

// The port for the application:
export const PORT = process.env.PORT || 8000;

/*
 * GAME CONFIGURATION
 */

// The question values we want:
export const VALUES = [
  200,
  400,
  600,
  800,
  1000
];

// Question values for double jeopardy:
export const DOUBLE_JEOPARDY_VALUES = [
  400,
  800,
  1200,
  1600,
  2000
];

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.6;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
