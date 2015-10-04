import { WordTokenizer } from 'natural';
import { commands } from './commands';

const values = [200, 400, 600, 800, 1000];

export const MessageReader = {

	parse(text) {
		text = text.replace('\'', '').trim().toLowerCase();

		// Exact match cases:
		if (text === 'help') {
			return {command: 'help'};
		}
		if (text === 'new game') {
			return {command: 'new'};
		}
		if (text === 'end game') {
			return {command: 'end'};
		}
		if (text === 'leaderboard') {
			return {command: 'leaderboard'};
		}
		if (text === 'scores') {
			return {command: 'scores'};
		}

		const tokenizer = new WordTokenizer();
		const tokens = tokenizer.tokenize(text);
		// Need at least three tokens:
		if (tokens.length >= 3) {
			// Check for selecting a category:
			const tks = tokens.slice(-2);
			const value = parseInt(tks[1], 10);
			if (tks[0] === 'for' && values.includes(value)) {

				let catTokens;

				// SPECIAL CASE: same category:
				if (tokens[0] === 'same' && tokens[1] === 'category' && tokens.length === 4) {
					catTokens = ['--SAME--'];
				} else {
					// This is a category selection:
					catTokens = tokens.slice(0, tokens.length - 2);

					// Special cases for leading phrases we allow:
					if (catTokens[0] === 'ill' && catTokens[1] === 'take') {
						catTokens = catTokens.slice(2);
					}
					if (catTokens[0] === 'give' && catTokens[1] === 'me') {
						catTokens = catTokens.slice(2);
					}
					if (catTokens[0] === 'choose') {
						catTokens = catTokens.slice(1);
					}
				}

				// Return the command:
				return {
					command: 'category',
					category: catTokens.join(' '),
					value
				}
			}

			if (tokens[0] === 'what|who|') {
				// This is a guess:
				
				return {
					command: 'guess',
					guess: ''// this comes from the tokens...
				}
			}
		}
	}

}