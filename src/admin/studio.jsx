import React, { PropTypes } from 'react';
import { Button, Card, CardActions, CardMenu, CardText, CardTitle, Tabs, Tab, Switch, Grid, Cell } from 'react-mdl';
import Broadcast from './components/broadcast';
import Features from './components/features';
import Configure from './components/configure';

class Studio extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeEnabled = this.onChangeEnabled.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.onFeatureChanged = this.onFeatureChanged.bind(this);
    this.onValueChanged = this.onValueChanged.bind(this);

    this.getStudio();
    this.state = {
      activeTab: 0,
      studio: {},
    };
  }

  onChangeTab(activeTab) {
    this.setState({ activeTab });
  }

  onFeatureChanged(feature, enabled) {
    this.updateStudio({
      features: {
        [feature]: enabled,
      },
    });
  }

  onValueChanged(prop, value) {
    this.updateStudio({
      values: {
        [prop]: value,
      },
    });
  }

  onChangeEnabled() {
    const enabled = !this.state.studio.enabled;
    this.updateStudio({
      enabled,
    });
  }

  getStudio() {
    fetch(`/api/v1/studios/${this.props.params.studio}`, {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(studio => {
      this.setState({ studio });
    });
  }

  updateStudio(updates) {
    return fetch(`/api/v1/studios/${this.state.studio.id}`, {
      credentials: 'include',
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }).then(res => {
      return res.json();
    }).then(studio => {
      this.setState({ studio });
    });
  }

  renderTab() {
    switch (this.state.activeTab) {
    default:
    case 0:
      return this.renderInfo();
    case 1:
      return this.renderFeatures();
    case 2:
      return this.renderConfigure();
    }
  }

  renderInfo() {
    const { studio } = this.state;
    return (
      <Grid>
        <Cell col={6}>
          <Card shadow={0} style={{
            width: '100%',
          }}>
            <CardTitle>
              {studio.enabled ? 'Disable Studio' : 'Enable Studio'}
            </CardTitle>
            <CardText>
              This jeopardy studio is currently
              <strong> {studio.enabled ? 'enabled' : 'disabled'}</strong>.
              <br />
              {studio.enabled ? (
                <div>
                  Disabling the bot will prevent games from being played, and will end any games currently
                  being played in the studio.
                  <br /> <br />
                  If you disable the studio, a message will be sent to the room informing the users that
                  the bot has been disabled.
                </div>
              ) : (
                <div>
                  Enabling the bot will allow games to be played in the studio.
                  <br /> <br />
                  If you enable the studio, a message will be sent to the room informing the users that
                  the bot has been enabled.
                </div>
              )}
            </CardText>
            <CardActions border>
              <Button onClick={this.onChangeEnabled} colored ripple>
                {studio.enabled ? 'Disable Studio' : 'Enable Studio'}
              </Button>
            </CardActions>
            <CardMenu>
              <Switch checked={studio.enabled} onChange={this.onChangeEnabled} ripple />
            </CardMenu>
          </Card>
        </Cell>
        <Cell col={6}>
          <Broadcast studio={studio.id} />
        </Cell>
      </Grid>
    );
  }

  renderFeatures() {
    return (
      <Features
        studio={this.state.studio}
        onFeatureChanged={this.onFeatureChanged}
      />
    );
  }

  renderConfigure() {
    return (
      <Configure
        studio={this.state.studio}
        onValueChanged={this.onValueChanged}
      />
    );
  }

  render() {
    return (
      <div>
        <h3 style={{
          margin: 0,
          padding: 20,
        }}>
          <span className="mdl-color-text--grey-400" style={{
            paddingRight: 10,
          }}>
            #
          </span>
          {this.state.studio.name}
        </h3>
        <Tabs activeTab={0} onChange={this.onChangeTab} ripple>
          <Tab>Info</Tab>
          <Tab>Features</Tab>
          <Tab>Configure</Tab>
        </Tabs>
        <section>
          {this.renderTab()}
        </section>
      </div>
    );
  }
}

Studio.propTypes = {
  params: PropTypes.object.isRequired,
};

export default Studio;
