import scoresMessage from './scores';

export default async function endgameMessage(game, contestants, channel_id) {
  let str = `\nAnd that's it for this round of Jeopardy. Let's take a look at the final scores...\n\n`;
  str += `\`\`\`${ scoresMessage(contestants, channel_id) }\`\`\``;
  str += `\n\nThanks for playing! You can always start another game by typing "*new game*".`;

  // End the game:
  await game.end();

  return str;
}
