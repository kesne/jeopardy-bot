import { currency } from '../../utils';

export default function scoresMessage(contestants, channel_id) {
  return contestants.map(contestant => {
    contestant._score = contestant.channelScore(channel_id).value;
    return contestant;
  }).sort((a, b) => {
    if (b._score > a._score) {
      return 1;
    }
    if (a._score > b._score) {
      return -1;
    }
    return 0;
  }).map((contestant, i) => (
    `${i + 1}. ${contestant.nonMentionedName}: ${currency(contestant._score)}`
  )).join('\n');
}
