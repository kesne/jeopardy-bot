import React, { PropTypes } from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Tooltip, Textfield } from 'react-mdl';

const propTypes = {
  app: PropTypes.object.isRequired,
};

const defaultProps = {};

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeAdapter = this.onChangeAdapter.bind(this);
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

  onChangeAdapter(e) {
    this.setState({
      imageMode: e.target.value,
    });
  }

  onChangeApiToken(e) {
    this.setState({
      apiToken: e.target.value,
    });
  }

  onChangeOwner(e) {
    this.setState({
      owner: e.target.value,
    });
  }

  onClickSave() {
    const { owner, apiToken, imageMode } = this.state;
    this.props.onValueChanged({
      owner,
      apiToken,
      imageMode,
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

  getState({ owner, apiToken, imageMode }) {
    this.setState({
      owner,
      apiToken,
      imageMode,
    });
  }

  render() {
    return (
      <Card shadow={0} style={{
        width: '100%',
      }}>
        <CardTitle>Settings</CardTitle>
        <CardText>
          <div>
            <h6 className="no-margin">
              Image Storage
              <Tooltip
                label="The storage that the bot will use for images."
              >
                <Icon className="jbot-inline-icon" name="help" />
              </Tooltip>
            </h6>
            <select className="jbot-select" value={this.state.imageMode} onChange={this.onChangeAdapter}>
              <option value="" disabled>Select an adapter...</option>
              <option value="imgur">Imgur</option>
              <option value="local">Local</option>
              {/* <option value="s3">S3</option> */}
            </select>
          </div>

          <div>
            <h6 className="no-margin">
              API Token
              <Tooltip
                label="The Slack API Token, used to send responses back to Slack."
              >
                <Icon className="jbot-inline-icon" name="help" />
              </Tooltip>
            </h6>
            <Textfield
              onChange={this.onChangeApiToken}
              value={this.state.apiToken}
              label="API Token..."
            />
          </div>

          <div>
            <h6 className="no-margin">
              Jeopardy Owner
              <Tooltip
                label="The contestant that is responsible for the Jeopardy Bot."
              >
                <Icon className="jbot-inline-icon" name="help" />
              </Tooltip>
            </h6>
            <select className="jbot-select" value={this.state.owner} onChange={this.onChangeOwner}>
              <option value="" disabled>Select an owner...</option>
              {this.state.contestants.map((contestant) => (
                <option key={contestant._id} value={contestant._id}>
                  {contestant.name}
                </option>
              ))}
            </select>
          </div>
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
