// TODO: This should actually be a root-level module called "config"

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

// How many things we want:
export const CATEGORY_COUNT = 6;
export const VALUES_LENGTH = VALUES.length;

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.7;
export const JARO_SIMILARITY = 0.9;
export const JARO_KICKER = 0.5;
