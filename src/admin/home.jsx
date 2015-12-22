import React from 'react';
import { Grid, Cell } from 'react-mdl';
import Settings from './components/settings';
import Configuration from './components/configuration';
import Broadcast from './components/broadcast';

export default class Home extends React.Component {
  render() {
    return (
      <Grid>
        <Cell col={6}>
          <Settings />
        </Cell>
        <Cell col={6}>
          <Configuration />
        </Cell>
        <Cell col={12}>
          <Broadcast studio="all" />
        </Cell>
      </Grid>
    );
  }
}
