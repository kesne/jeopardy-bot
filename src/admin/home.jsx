import React from 'react';
import { Grid, Cell } from 'react-mdl';
import Broadcast from './components/broadcast';

export default class Home extends React.Component {
  render() {
    return (
      <Grid>
        <Cell col={3} />
        <Cell col={6}>
          <Broadcast studio="all" />
        </Cell>
        <Cell col={3} />
      </Grid>
    );
  }
}
