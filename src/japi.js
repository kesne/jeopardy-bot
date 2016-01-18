import fetch from 'node-fetch';
import striptags from 'striptags';
import { load } from 'cheerio';
import { AllHtmlEntities } from 'html-entities';
import unidecode from 'unidecode';
import winston from 'winston';

const { decode } = new AllHtmlEntities();

function simplifyText(text) {
  return unidecode(decode(text)).replace(/\\/g, '');
}

// Hard code number of seasons:
// Season 32 is relatively incomplete.
const seasons = 31;

// Selector to get seasons URLs from
const episodeRegex = /Show #([0-9]+) -/;
const clueRegex = /clue_J_([0-9]+)_([0-9]+)/;

async function loadEpisode(url) {
  const res = await fetch(url);
  const text = await res.text();
  const $ = load(text);

  // Extract the episode number:
  const headerText = $('#game_title > *').text();
  const [, episode] = episodeRegex.exec(headerText);

  // Extract categories:
  const categories = [];
  $('#jeopardy_round .category_name').each((inputId, category) => {
    // Don't use zero-based index:
    const id = inputId + 1;
    categories.push({
      id,
      title: simplifyText($(category).text()),
    });
  });

  const clues = [];

  $('#jeopardy_round .clue').each((inputId, clue) => {
    // Don't use zero-based index:
    const id = inputId + 1;

    const $clue = $(clue);
    const $clueText = $clue.find('.clue_text');

    let [, categoryId, num] = clueRegex.exec($clueText.attr('id'));
    categoryId = parseInt(categoryId, 10);
    num = parseInt(num, 10);

    // Generate the value based on the number:
    const value = num * 200;

    let question = $clueText.html();
    question = simplifyText(striptags(question, ['br']));
    question = question.replace(/<br\s*\/?>/gi, '\n');

    // Extract the answer and strip HTML tags:
    let [, answer] = /ponse">(.*)<\/e/.exec($clue.find('td:first-child > div').attr('onmouseover'));
    answer = simplifyText(striptags(answer));

    // Extract if this question was a daily double:
    const dailyDouble = $clue.find('.clue_value_daily_double').length === 1;

    clues.push({
      id,
      categoryId,
      question,
      answer,
      value,
      dailyDouble,
    });
  });

  // Return it:
  return {
    episode,
    roundOne: {
      categories,
      clues,
    },
  };
}

async function randomEpisode() {
  const season = Math.ceil(Math.random() * seasons);
  const res = await fetch(`http://www.j-archive.com/showseason.php?season=${season}`);
  const text = await res.text();
  const $ = load(text);
  const links = $('td:first-child > a');
  const episodeLink = links.eq(Math.ceil(Math.random() * links.length)).attr('href');

  winston.info('Attempting to generate a new board from episode link', episodeLink);

  const { episode, roundOne } = await loadEpisode(episodeLink);

  return {
    season,
    episode,
    roundOne,
  };
}

// Force-generate a new game:
export default async function generateGame() {
  let game;
  do {
    try {
      game = await randomEpisode();
    } catch (e) {
      winston.error('Unable to generate game.', game, e);
    }
  } while (!game);
  return game;
}
