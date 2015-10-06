// The mode the bot is in:
export const MODE = 'response';

// The username of the bot:
export const USERNAME = 'JeopardyBot';
// The ID of the bot that we can use to ignore messages from ourself:
export const BOT_ID = 'USLACKBOT';

// The URL for the mongo database:
export const MONGO = process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy'

// The port for the application:
export const PORT = process.env.PORT || 8000;

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

// How many things we want:
export const CATEGORY_COUNT = 6;
export const VALUES_LENGTH = VALUES.length;

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.7;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
