import {WordTokenizer} from 'natural';
import * as config from './config';

export function read({text, trigger_word}) {
  // Parse out the trigger word:
  if (trigger_word) {
    const replacer = new RegExp(trigger_word, '');
    text = text.replace(replacer, '');
  }
  return parse(text);
}

export function clean(text) {
  text = text.trim();
  text = text.toLowerCase();
  text = text.replace(/&/g, 'and');
  text = text.replace(/-/g, '');
  return text;
}

export function parse(text) {
  // Invalid request:
  if (!text) {
    return '';
  }

  text = clean(text);

  // Exact match cases:
  if (text === 'poke') {
    return {command: 'poke'};
  }
  if (text === 'help') {
    return {command: 'help'};
  }
  if (text === 'new game') {
    return {command: 'newgame'};
  }
  if (text === 'end game') {
    return {command: 'endgame'};
  }
  if (text === 'leaderboard') {
    return {command: 'leaderboard'};
  }
  if (text === 'scores') {
    return {command: 'scores'};
  }

  // Challenges:
  if (text === 'y' || text === 'n' || text === 'challenge') {
    return {
      command: 'challenge',
      start: text === 'challenge',
      correct: text === 'y'
    };
  }

  // Wagers:
  const numberValue = Number(text.replace(/\$|,/g, ''));
  if (!Number.isNaN(numberValue) && numberValue > 0) {
    return {
      command: 'wager',
      value: numberValue
    };
  }

  const tokenizer = new WordTokenizer();
  const tokens = tokenizer.tokenize(text);

  // SPECIAL CASE: same for lowest value
  if (tokens[0] === 'same' && tokens.length === 1) {
    return {
      command: 'category',
      category: '--same-lowest--',
      value: -1
    };
  }

  // Need at least three tokens:
  if (tokens.length >= 3) {
    // Check for selecting a category:
    const [forString, rawValue] = tokens.slice(-2);
    const value = parseInt(rawValue, 10);
    if (forString === 'for' && config.VALUES.includes(value)) {
      let categoryString = '';

      // SPECIAL CASE: same category
      if (tokens[0] === 'same' && ((tokens[1] === 'category' && tokens.length === 4) || (tokens.length === 3))) {
        categoryString = '--same--';
      } else {
        // This is a category selection:
        const catTokens = tokens.slice(0, tokens.length - 2);

        // Special cases for leading phrases we allow:
        if (catTokens[0] === 'i' && catTokens[1] === 'll' && catTokens[2] === 'take') {
          categoryString = text.substring(text.indexOf('take') + 4, text.lastIndexOf('for'));
        } else if (catTokens[0] === 'ill' && catTokens[1] === 'take') {
          categoryString = text.substring(text.indexOf('take') + 4, text.lastIndexOf('for'));
        } else if (catTokens[0] === 'give' && catTokens[1] === 'me') {
          categoryString = text.substring(text.indexOf('me') + 4, text.lastIndexOf('for'));
        } else if (catTokens[0] === 'choose') {
          categoryString = text.substring(text.indexOf('choose') + 4, text.lastIndexOf('for'));
        } else {
          categoryString = text.substring(0, text.lastIndexOf('for'));
        }
      }

      // Return the command:
      return {
        command: 'category',
        category: categoryString,
        value
      };
    }

    const questions = ['what', 'whats', 'where', 'wheres', 'who', 'whos'];

    // This is a guess:
    if (questions.includes(tokens[0])) {
      // Dump the question:
      tokens.shift();

      const questionElements = ['is', 'are', 'was', 'were', 'the', 'a', 'an'];
      // Remove question elements for two deep:
      for (let i = 0; i < 3; i++) {
        if (questionElements.includes(tokens[0])) {
          tokens.shift();
        } else {
          break;
        }
      }

      return {
        command: 'guess',
        guess: tokens.join(' ')
      };
    }
  }
}
