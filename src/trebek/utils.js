import numeral from 'numeral';

const formatter = '$0,0';
export function currency(value) {
  return numeral(value).format(formatter);
}

export function clean(text) {
  text = text.toLowerCase().trim();
  // Replace double spaces with single spaces:
  text = text.replace(/ {2,}/g, ' ');
  // Strip out punctuation:
  text = text.replace(/['"“”’\-\.,!;:—]/g, '');
  // Ampersands are hard:
  text = text.replace(/&/g, 'and');
  return text;
}

const VALID_REQUIREMENTS = [
  'gameactive',
  'gameinactive',
  'mydailydouble',
  'clue',
  'noclue'
];

const VALID_PROVIDERS = [
  'game',
  'games',
  'contestant',
  'contestants'
];

export function Trigger(...messages) {
  return function(Constructor) {
    const triggers = messages.map(message => {
      if (message instanceof RegExp) {
        message = message.source;
      }
      return new RegExp(`^${message}$`, 'i');
    });
    Constructor.triggers = triggers;
  };
}

Trigger.preservePunctuation = function(Constructor) {
  // TODO...
  Constructor.preservePunctuation = true;
};

export function Provide(...providers) {
  if (!providers.some(p => VALID_PROVIDERS.includes(p))) {
    throw new Error('Invalid provider.');
  }
  return function (Constructor) {
    Constructor.providers = providers;
  };
}

export function Only(...requirements) {
  if (!requirements.some(r => VALID_REQUIREMENTS.includes(r))) {
    throw new Error('Invalid requirement.');
  }
  return function(Constructor) {
    Constructor.requirements = requirements;
  };
}

export function NoLock(Constructor) {
  Constructor.nolock = true;
}
