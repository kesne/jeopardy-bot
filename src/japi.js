import fetch from 'node-fetch';
import striptags from 'striptags';
import {load} from 'cheerio';

// Hard code number of seasons:
// Season 32 is relatively incomplete.
const seasons = 31;

// Selector to get seasons URLS from
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
  $('#jeopardy_round .category_name').each((id, category) => {
    // Don't use zero-based index:
    id += 1;
    categories.push({
      id,
      title: $(category).text()
    });
  });

  const clues = [];

  $('#jeopardy_round .clue').each((id, clue) => {
    // Don't use zero-based index:
    id += 1;

    const $clue = $(clue);
    const $clueText = $clue.find('.clue_text');

    let [, category_id, num] = clueRegex.exec($clueText.attr('id'));
    category_id = parseInt(category_id, 10);
    num = parseInt(num, 10);

    // Generate the value based on the number:
    const value = num * 200;

    const question = $clueText.text();

    // Extract the answer and strip HTML tags:
    let [, answer] = /ponse">(.*)<\/e/.exec($clue.find('td:first-child > div').attr('onmouseover'));
    answer = striptags(answer);

    // Extract if this question was a daily double:
    const dailyDouble = $clue.find('.clue_value_daily_double').length === 1;

    clues.push({
      id,
      category_id,
      question,
      answer,
      value,
      dailyDouble
    });
  });

  console.log(clues);

  // Return it:
  return {
    episode,
    roundOne: {
      categories,
      clues
    }
  };
}

export async function randomEpisode() {
  const season = Math.ceil(Math.random() * seasons);
  const res = await fetch(`http://www.j-archive.com/showseason.php?season=${season}`);
  const text = await res.text();
  const $ = load(text);
  const links = $('td:first-child > a');
  const episodeLink = links.eq(Math.ceil(Math.random() * links.length)).attr('href');

  const {episode, roundOne} = await loadEpisode(episodeLink);

  return {
    season,
    episode,
    roundOne
  };
}
