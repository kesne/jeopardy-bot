import React, { PropTypes } from 'react';
import { Grid, Cell } from 'react-mdl';
import Feature from './feature';

const FEATURE_LIST = [
  {
    name: 'Challenges',
    feature: 'challenges',
    description: 'Allows challenges to be called on questions that were incorrectly judged.',
  },
  {
    name: 'Board Control',
    feature: 'boardControl',
    description: 'Restricts category selection to the contestant that last answered correctly.',
  },
  {
    name: 'Daily Doubles',
    feature: 'dailyDoubles',
    description: 'Enables daily double wagers for certain questions.',
  },
  {
    name: 'Manual Game End',
    feature: 'endGame',
    description: 'Allows the game to be ended with the "end game" message.',
  },
  {
    name: 'Stats',
    feature: 'stats',
    description: 'Allows contestants to check the stats of themselves and other players.',
  },
  {
    name: 'Room Greetings',
    feature: 'greetings',
    description: 'Welcomes users joining Jeopardy channels with a simple message.',
  },
  {
    name: 'Guess Reactions',
    feature: 'guessReactions',
    description: 'Add reactions to guesses to indicate if the contestant was correct or not.',
  },
  {
    name: 'Challenge Reaction Voting',
    feature: 'challengeReactionVoting',
    description: 'Vote on challenges with thumbs-up and thumbs-down emojis.',
  },
];

class Features extends React.Component {

  render() {
    const { studio } = this.props;
    return (
      <Grid>
        {FEATURE_LIST.map(({ feature, name, description }) => (
          <Cell col={6} key={feature}>
            <Feature
              feature={feature}
              name={name}
              description={description}
              enabled={studio.features[feature]}
              onChange={this.props.onFeatureChanged}
            />
          </Cell>
        ))}
      </Grid>
    );
  }
}

Features.propTypes = {
  studio: PropTypes.object.isRequired,
  onFeatureChanged: PropTypes.func.isRequired,
};

export default Features;
