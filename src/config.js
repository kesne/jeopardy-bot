/*
 * BOT CONFIGURATION:
 */
// The mode the bot is in:
export const MODE = process.env.JBOT_MODE || 'response';

export let IMAGE_MIN = true;
if (process.env.JBOT_IMAGE_MIN) {
  IMAGE_MIN = process.env.JBOT_IMAGE_MIN !== 'false';
}

// A list of rooms that the bot will work in:
export let ROOM_WHITELIST = process.env.JBOT_ROOMS || 'jeopardy';
ROOM_WHITELIST = ROOM_WHITELIST.split(',');

// The outgoing webhook token used to verify requests:
export let VERIFY_TOKENS = process.env.JBOT_VERIFY_TOKENS || '';
VERIFY_TOKENS = VERIFY_TOKENS.split(',');

export const API_KEY = process.env.JBOT_API || '';

// The username of the bot:
export const USERNAME = process.env.JBOT_USERNAME || 'JeopardyBot';
// The ID of the bot that we can use to ignore messages from ourself:
export const BOT_ID = 'USLACKBOT';

// The URL for the mongo database:
export const MONGO = process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy'

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

// The last page of jService that will return valid results:
export const LAST_PAGE = 18412;

// The number of seconds to wait before a clue is timed out.
export const CLUE_TIMEOUT = 45;

// The number of seconds to give control of the board to the correct guesser.
export const BOARD_CONTROL_TIMEOUT = 10;

// How many things we want:
export const CATEGORY_COUNT = 6;
export const VALUES_LENGTH = VALUES.length;

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.7;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
