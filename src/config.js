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

// A list of rooms that the bot will work in:
export let ROOM_WHITELIST = process.env.JBOT_ROOMS || 'jeopardy';
ROOM_WHITELIST = ROOM_WHITELIST.split(',');

// The username of the bot:
export const USERNAME = process.env.JBOT_USERNAME || 'jeopardybot';
// The ID of the bot that we can use to ignore messages from ourself:
export const BOT_ID = 'USLACKBOT';

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

// The number of seconds to wait before a clue is timed out.
export const CLUE_TIMEOUT = Number(process.env.JBOT_CLUE_TIMEOUT) || 45;

// Challenges timeout after a number of seconds:
export const CHALLENGE_TIMEOUT = 15;
// The minimum number of votes that a challenge must recieve to be considered valid.
export const CHALLENGE_MIN = 2;
// The threshold for a challenge to go through:
export const CHALLENGE_THRESHOLD = 0.65;

export const BOARD_CONTROL = Number(process.env.BOARD_CONTROL) || 1;
// The number of seconds to give control of the board to the correct guesser.
export const BOARD_CONTROL_TIMEOUT = Number(process.env.JBOT_BOARD_CONTROL) || 4;

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.6;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
