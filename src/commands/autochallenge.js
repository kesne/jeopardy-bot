import fetch from 'node-fetch';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const cx = '013673686761662547163:nw_cf3t8esg';
const URL_BASE = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${cx}`;

export default async function autoChallenge(answer, guess) {
  // We can only auto challenge if we have an API key:
  if (!GOOGLE_API_KEY) {
    return false;
  }
  const [{items: [answerResult]}, {items: [guessResult]}] = await Promise.all([
    fetch(`${URL_BASE}&q=${answer}`),
    fetch(`${URL_BASE}&q=${guess}`)
  ]);

  if (answerResult && guessResult) {
    if (answerResult.link === guessResult.link) {
      return true;
    }
  }
  return false;
}
