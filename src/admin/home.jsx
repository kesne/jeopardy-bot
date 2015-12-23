import React from 'react';
import { Grid, Cell } from 'react-mdl';
import Settings from './components/settings';
import Configuration from './components/configuration';
import Broadcast from './components/broadcast';

export default class Home extends React.Component {
  constructor(props) {
    super(props);

    this.onValueChanged = this.onValueChanged.bind(this);

    this.getApp();
    this.state = {
      app: {},
    };
  }

  onValueChanged(values) {
    this.updateApp(values);
  }

  getApp() {
    fetch(`/api/v1/apps/`, {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(([app]) => {
      this.setState({ app });
    });
  }

  updateApp(updates) {
    return fetch(`/api/v1/apps/${this.state.app._id}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }).then(res => {
      return res.json();
    }).then(app => {
      this.setState({ app });
    });
  }

  render() {
    return (
      <Grid>
        <Cell col={6}>
          <Settings app={this.state.app} onValueChanged={this.onValueChanged} />
        </Cell>
        <Cell col={6}>
          <Configuration app={this.state.app} onValueChanged={this.onValueChanged} />
        </Cell>
        <Cell col={12}>
          <Broadcast all />
        </Cell>
      </Grid>
    );
  }
}
