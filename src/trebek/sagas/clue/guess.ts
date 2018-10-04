import { input, say } from '../utils';
import { delay } from 'redux-saga';
import { race } from 'redux-saga/effects';

function* guessAnswer(clue) {
    while (true) {
        const { action, matches } = yield input([
            /(?:whats?|wheres?|whos?|whens?) (?:(?:is|are|was|were|the|an?) ){1,2}(.*)/,
            /w (.*)/,
        ]);

        // Support both the guess shorthand and
        const guess = matches[0] || matches[1];

        console.log('Guessed...', guess);

        // let correct;
        // try {
        //     correct = await this.game.guess({
        //         guess,
        //         contestant: this.contestant,
        //     });
        // } catch (e) {
        //     if (e.message.includes('contestant')) {
        //         this.say(
        //             `You had your chance, ${
        //                 this.contestant.name
        //             }. Let someone else answer.`,
        //         );
        //         if (this.studio.features.guessReactions) {
        //             const possibleEmojis = [
        //                 'speak_no_evil',
        //                 'no_good',
        //                 'no_mouth',
        //             ];
        //             const randIndex = Math.floor(
        //                 Math.random() * possibleEmojis.length,
        //             );
        //             const reaction = possibleEmojis[randIndex];
        //             this.addReaction(reaction);
        //         }
        //     } else if (e.message.includes('wager')) {
        //         this.say('You need to make a wager before you guess.');
        //     }

        //     // Just ignore guesses if they're outside of the game context:
        //     return;
        // }

        // // Extract the value from the current clue:
        // let { value } = clue;

        // // Daily doubles have a different value:
        // if (this.game.isDailyDouble()) {
        //     value = this.game.dailyDouble.wager;
        // }

        // if (correct) {
        //     await Promise.all([
        //         // Award the value:
        //         this.contestant.correct({
        //             value,
        //             channel_id: this.data.channel_id,
        //         }),
        //         // Mark the question as answered:
        //         this.game.answer(this.contestant),
        //     ]);

        //     await this.say(
        //         `That is correct, ${this.contestant.name}. The answer was \`${
        //             clue.answer
        //         }\`.\nYour score is now ${currency(
        //             this.contestant.channelScore(this.data.channel_id).value,
        //         )}.`,
        //     );

        //     if (this.studio.features.guessReactions) {
        //         this.addReaction('white_check_mark');
        //     }

        //     if (this.game.isComplete()) {
        //         const contestants = await this.channelContestants();
        //         this.say(
        //             `${await endgameMessage(
        //                 this.game,
        //                 contestants,
        //                 this.data.channel_id,
        //             )}`,
        //         );
        //     } else {
        //         // Get the new board url:
        //         const url = await boardImage(this.game);
        //         this.say(newClueMessage(this.game), url);
        //     }
        // } else {
        //     await this.contestant.incorrect({
        //         value,
        //         channel_id: this.data.channel_id,
        //     });

        //     await this.say(
        //         `That is incorrect, ${
        //             this.contestant.name
        //         }. Your score is now ${currency(
        //             this.contestant.channelScore(this.data.channel_id).value,
        //         )}.`,
        //     );

        //     if (this.studio.features.guessReactions) {
        //         this.addReaction('x');
        //     }

        //     // If the clue is a daily double, the game progresses
        //     if (this.game.isDailyDouble()) {
        //         await Promise.all([
        //             this.game.answer(),
        //             this.say(`The correct answer is \`${clue.answer}\`.`),
        //         ]);

        //         if (this.game.isComplete()) {
        //             const contestants = await this.channelContestants();
        //             this.say(
        //                 `${await endgameMessage(
        //                     this.game,
        //                     contestants,
        //                     this.data.channel_id,
        //                 )}`,
        //             );
        //         } else {
        //             // Get the new board url:
        //             const url = await boardImage(this.game);
        //             this.say(newClueMessage(this.game), url);
        //         }
        //     }
        // }
    }
}

// Clues are active for 30 seconds:
// const DELAY_AMOUNT = 30;
const DELAY_AMOUNT = 5;

export default function* guess(clue) {
    const { answer, timeout } = yield race({
        // TODO: Daily doubles don't time out.
        // TODO: Allow configuring delay:
        timeout: delay(DELAY_AMOUNT * 1000),
        answer: guessAnswer(clue),
    });

    if (timeout) {
        yield say(`Time's up! The correct answer was \`${clue.answer}\`.`);
    }
}
