import React from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Textfield } from 'react-mdl';

const propTypes = {

};

const defaultProps = {

};

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeMode = this.onChangeMode.bind(this);
    this.onChangeApiToken = this.onChangeApiToken.bind(this);
    this.onChangeOwner = this.onChangeOwner.bind(this);
    this.onClickSave = this.onClickSave.bind(this);

    this.getContestants();
    this.state = {
      contestants: [],
    };
  }

  componentWillReceiveProps(props) {
    this.getState(props.app);
  }

  onChangeMode(e) {
    this.setState({
      mode: e.target.value,
    });
  }

  onChangeApiToken(e) {
    this.setState({
      api_token: e.target.value,
    });
  }

  onChangeOwner(e) {
    this.setState({
      owner: e.target.value,
    });
  }

  onClickSave() {
    const { owner, api_token, mode } = this.state;
    this.props.onValueChanged({
      owner,
      api_token,
      mode,
    });
  }

  getContestants() {
    fetch('/api/v1/contestants/', {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(contestants => {
      this.setState({ contestants });
    });
  }

  getState({ owner, api_token, mode }) {
    this.setState({
      owner,
      api_token,
      mode,
    });
  }

  render() {
    return (
      <Card shadow={0} style={{
        width: '100%',
      }}>
        <CardTitle>Settings</CardTitle>
        <CardText>
          <h6 className="no-margin">Mode</h6>
          <select className="jbot-select" value={this.state.mode} onChange={this.onChangeMode}>
            <option value="" disabled>Select a mode...</option>
            <option value="bot">Bot</option>
            <option value="hybrid">Hybrid</option>
            <option value="response">Response</option>
          </select>

          <h6 className="no-margin">API Token</h6>
          <Textfield
            onChange={this.onChangeApiToken}
            value={this.state.api_token}
            label="API Token..."
          />

          <h6 className="no-margin">Jeopardy Owner</h6>
          <select className="jbot-select" value={this.state.owner} onChange={this.onChangeOwner}>
            <option value="" disabled>Select an owner...</option>
            {this.state.contestants.map((contestant) => (
              <option value={contestant.slackid}>{contestant.name}</option>
            ))}
          </select>
        </CardText>
        <CardActions border>
          <Button colored ripple onClick={this.onClickSave}>Save</Button>
        </CardActions>
        <CardMenu>
          <Icon name="settings" />
        </CardMenu>
      </Card>
    );
  }
}

Settings.propTypes = propTypes;
Settings.defaultProps = defaultProps;

export default Settings;
