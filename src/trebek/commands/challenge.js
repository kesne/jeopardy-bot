import fetch from 'node-fetch';
import Command from '../Command';
import { Trigger, Only, Feature, Provide, currency } from '../utils';
import winston from 'winston';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const cx = '013673686761662547163:nw_cf3t8esg';
const URL_BASE = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${cx}`;

@Trigger(
  /(?:(challenge)|(y)|(n))/
)
@Only(
  'gameactive',
  'noclue'
  // ,'challenge'
)
@Feature(
  'challenges'
)
@Provide(
  'game',
  'contestant'
)
export default class Challenge extends Command {
  async autoChallenge(answer, guess) {
    // We can only auto challenge if we have an API key:
    if (!GOOGLE_API_KEY) {
      return false;
    }
    try {
      const [{ items: [answerResult] }, { items: [guessResult] }] = await Promise.all([
        fetch(`${URL_BASE}&q=${answer}`).then(res => res.json()),
        fetch(`${URL_BASE}&q=${guess}`).then(res => res.json()),
      ]);

      if (answerResult && guessResult) {
        if (answerResult.link === guessResult.link) {
          return true;
        }
      }
    } catch (e) {
      winston.error('Error with autochallenge occurred.', e);
    }
    return false;
  }

  async response([challenge, yes]) {
    if (!challenge && this.game.isChallengeStarted()) {
      const correct = Boolean(yes);
      // Register the vote if we haven't already voted:
      const hasVoted = this.game.challenge.votes.some(vote => vote.contestant === this.contestant.id);
      if (!hasVoted) {
        this.game.challenge.votes.push({
          contestant: this.contestant.id,
          correct,
        });
        await this.game.save();
      }
    } else if (challenge && !this.game.isChallengeStarted()) {
      const channel_id = this.data.channel_id;
      const [contestants, { guess, answer }] = await Promise.all([
        this.models.Contestant.find().where('scores').elemMatch({
          channel_id,
        }),
        this.game.startChallenge({
          contestant: this.contestant,
        }),
      ]);

      await this.say('Let me think...');

      // Attempt to resolve this automatically without resorting to asking the room:
      const autoChallengePass = await this.autoChallenge(answer, guess);
      if (autoChallengePass) {
        const { channelScore } = await this.game.endChallenge(true);
        this.say(`It looks like you're correct, ${this.contestant.name}! Your score is now ${currency(channelScore.value)}.`);
        return;
      }

      const contestantString = contestants.map(contestant => `<@${contestant.id}>`).join(', ');
      await this.say(`I'm not sure, let's see what the room thinks.\nI thought the correct answer was \`${answer}\`, and the guess was \`${guess}\`.`);

      let messageText = `${contestantString}, do you think they were right?`;
      if (this.studio.features.challengeReactionVoting) {
        messageText += ' Vote with the reactions! :+1: if they were right, :-1: if they were not.';
      } else {
        messageText += ' Respond with just "y" or "n" to vote.';
      }
      const message = await this.say(messageText);

      if (this.studio.features.challengeReactionVoting) {
        // Slack calls these +1 / -1 when you call the reaction.get method:
        await this.addReaction('thumbsup', message);
        await this.addReaction('thumbsdown', message);
      }

      setTimeout(async () => {
        await this.lock();
        // We need to refresh the document because it could be outdated:
        const game = await this.models.Game.forChannel({
          channel_id: this.game.channel_id,
        });

        if (this.studio.features.challengeReactionVoting) {
          // Allow votes from emoji
          const reactions = await this.getReactions(message);
          if (reactions && reactions.length) {
            reactions.forEach(({ name, count: totalCount }) => {
              // Remove the vote that JeopardyBot gave:
              const count = totalCount - 1;
              if (count) {
                if (name === '+1') {
                  game.challenge.votes.push(...Array(count).fill({ correct: true }));
                } else if (name === '-1') {
                  game.challenge.votes.push(...Array(count).fill({ correct: false }));
                }
              }
            });
          }
        }

        try {
          const { channelScore } = await game.endChallenge();
          this.say(`Congrats, ${this.contestant.name}, your challenge has succeeded. Your score is now ${currency(channelScore.value)}.`);
        } catch (e) {
          if (e.message.includes('min')) {
            this.say('The challenge failed. There were not enough votes. Carry on!');
          } else if (e.message.includes('votes')) {
            this.say('The challenge failed. Not enough people agreed. Carry on!');
          } else {
            winston.error('Unknown challenge error...', e);
          }
        } finally {
          this.unlock();
        }
      }, ((this.studio.values.challengeTimeout) * 1000) + 100);
    }
  }
}
