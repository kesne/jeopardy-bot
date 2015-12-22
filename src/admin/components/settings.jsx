import React from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Textfield } from 'react-mdl';

const propTypes = {

};

const defaultProps = {

};

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.fetchContestants();

    this.state = {
      contestants: [],
    };
  }

  fetchContestants() {
    fetch('/api/v1/contestants/', {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(contestants => {
      this.setState({ contestants });
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
          <select className="jbot-select" value="">
            <option value="" disabled>Select a mode...</option>
            <option value="bot">Bot</option>
            <option value="hybrid">Hybrid</option>
            <option value="response">Response</option>
          </select>

          <h6 className="no-margin">API Token</h6>
          <Textfield
            onChange={this.onChangeMessage}
            value={this.state.message}
            label="API Token..."
          />

          <h6 className="no-margin">Jeopardy Owner</h6>
          <select className="jbot-select" value="">
            <option value="" disabled>Select an owner...</option>
          </select>
        </CardText>
        <CardActions border>
          <Button colored ripple onClick={this.onClickSendMessage}>Save</Button>
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
