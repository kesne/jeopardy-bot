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
      return new RegExp(`^${message}$`, 'gi');
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
