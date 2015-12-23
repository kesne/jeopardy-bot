import React, { PropTypes } from 'react';
import { Grid, Cell } from 'react-mdl';
import Value from './value';

const VALUE_LIST = [
  {
    name: 'Timeout',
    value: 'timeout',
    description: 'The number of seconds before a clue times out.',
    input: {
      min: 1,
      type: 'number',
    },
  },
  {
    name: 'Challenge Timeout',
    value: 'challengeTimeout',
    description: 'The number of seconds before a challenge times out.',
    input: {
      min: 1,
      type: 'number',
    },
  },
  {
    name: 'Board Control Timeout',
    value: 'boardControlTimeout',
    description: 'The number of seconds that control of the board is held.',
    input: {
      min: 1,
      type: 'number',
    },
  },
  {
    name: 'Minimum Challenge Votes',
    value: 'minimumChallengeVotes',
    description: 'The minimum number of votes required for a challenge to be accepted.',
    input: {
      min: 1,
      type: 'number',
    },
  },
  {
    name: 'Challenge Threshold',
    value: 'challengeAcceptenceThreshold',
    description: 'The percentage of votes that are required for a challenge to be accepted.',
    input: {
      min: 0,
      max: 1,
      type: 'number',
      step: 0.01,
    },
  },
];

class Configure extends React.Component {
  render() {
    const { studio } = this.props;
    return (
      <Grid>
        {VALUE_LIST.map(({ name, value, description, input }) => (
          <Cell col={6} key={value}>
            <Value
              value={value}
              name={name}
              description={description}
              input={input}
              currentValue={studio.values[value]}
              onChange={this.props.onValueChanged}
            />
          </Cell>
        ))}
      </Grid>
    );
  }
}

Configure.propTypes = {
  studio: PropTypes.object.isRequired,
  onValueChanged: PropTypes.func.isRequired,
};

export default Configure;
