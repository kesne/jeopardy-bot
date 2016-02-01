import React, { PropTypes } from 'react';
import {
  Button,
  Card,
  CardText,
  CardTitle,
  CardMenu,
  CardActions,
  Icon,
  Tooltip,
  Textfield,
  Switch,
} from 'react-mdl';

const propTypes = {
  app: PropTypes.object.isRequired,
  onValueChanged: PropTypes.func.isRequired,
};

const defaultProps = {};

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeAdapter = this.onChangeAdapter.bind(this);
    this.onChangeHost = this.onChangeHost.bind(this);
    this.onChangeApiToken = this.onChangeApiToken.bind(this);
    this.onChangeOwner = this.onChangeOwner.bind(this);
    this.onClickSave = this.onClickSave.bind(this);
    this.onChangeEnabledByDefault = this.onChangeEnabledByDefault.bind(this);

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

  onChangeHost(e) {
    this.setState({
      host: e.target.value,
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

  onChangeEnabledByDefault(e) {
    this.setState({
      studiosEnabledByDefault: e.target.checked,
    });
  }

  onClickSave() {
    const { host, owner, apiToken, imageMode, studiosEnabledByDefault } = this.state;
    this.props.onValueChanged({
      host,
      owner,
      apiToken,
      imageMode,
      studiosEnabledByDefault,
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

  getState({ host = window.location.origin, owner, apiToken, imageMode, studiosEnabledByDefault }) {
    this.setState({
      host,
      owner,
      apiToken,
      imageMode,
      studiosEnabledByDefault,
    });
  }

  render() {
    return (
      <Card
        shadow={0}
        style={{
          width: '100%',
        }}
      >
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
            <select
              className="jbot-select"
              value={this.state.imageMode}
              onChange={this.onChangeAdapter}
            >
              <option value="" disabled>Select an adapter...</option>
              <option value="imgur">Imgur</option>
              <option value="local">Local</option>
              {/* <option value="s3">S3</option> */}
            </select>
          </div>
          {this.state.imageMode === 'local' && (
            <div>
              <h6 className="no-margin">
                Bot Host Location
                <Tooltip
                  label="The host location of the bot. Used for local images."
                >
                  <Icon className="jbot-inline-icon" name="help" />
                </Tooltip>
              </h6>
              <Textfield
                onChange={this.onChangeHost}
                value={this.state.host}
                label="Host location..."
              />
            </div>
          )}

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
                label="The contestant that is responsible for the bot."
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

          <div>
            <h6 className="no-margin">
              Studios Enabled By Default
              <Tooltip
                label="Determines if JeopardyBot is enabled or disabled when invited to new rooms."
              >
                <Icon className="jbot-inline-icon" name="help" />
              </Tooltip>
            </h6>
            <Switch
              className="jbot-setting-switch"
              checked={this.state.studiosEnabledByDefault}
              onChange={this.onChangeEnabledByDefault}
              ripple
            >
              Enabled by Default
            </Switch>
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
