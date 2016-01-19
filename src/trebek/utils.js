import numeral from 'numeral';

const formatter = '$0,0';
export function currency(value) {
  return numeral(value).format(formatter);
}

export function clean(text) {
  let cleanText = text;
  cleanText = cleanText.toLowerCase().trim();
  // Replace double spaces with single spaces:
  cleanText = cleanText.replace(/ {2,}/g, ' ');
  // Strip out punctuation:
  cleanText = cleanText.replace(/['"“”’\-\.,!;:—]/g, '');
  // Ampersands are hard:
  cleanText = cleanText.replace(/&/g, 'and');
  return cleanText;
}

const VALID_REQUIREMENTS = [
  'gameactive',
  'gameinactive',
  'mydailydouble',
  'clue',
  'noclue',
];

const VALID_PROVIDERS = [
  'game',
  'contestant',
];

const VALID_WHENS = [
  'channel_join',
];

export function Trigger(...messages) {
  return function (Constructor) {
    const triggers = messages.map(message => {
      let fullMessage = message;
      if (message instanceof RegExp) {
        fullMessage = message.source;
      }
      return new RegExp(`^${fullMessage}$`, 'i');
    });
    Constructor.triggers = triggers;
  };
}

Trigger.preservePunctuation = function (Constructor) {
  // TODO...
  Constructor.preservePunctuation = true;
};

export function When(...whens) {
  if (!whens.some(w => VALID_WHENS.includes(w))) {
    throw new Error('Invalid when.');
  }
  return function (Constructor) {
    Constructor.whens = whens;
  };
}

export function Provide(...providers) {
  if (!providers.some(p => VALID_PROVIDERS.includes(p))) {
    throw new Error('Invalid provider.');
  }
  return function (Constructor) {
    Constructor.providers = providers;
  };
}

export function Only(...requirements) {
  if (!requirements.some(r => {
    return Array.isArray(r) ? VALID_REQUIREMENTS.includes(r[0]) : VALID_REQUIREMENTS.includes(r);
  })) {
    throw new Error('Invalid requirement.');
  }
  return function (Constructor) {
    Constructor.requirements = requirements;
  };
}

export function Feature(...features) {
  return function (Constructor) {
    Constructor.features = features;
  };
}

export function NoLock(Constructor) {
  Constructor.nolock = true;
}
