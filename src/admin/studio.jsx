import React from 'react';
import { Button, Card, CardActions, CardMenu, CardText, CardTitle, Tabs, Tab, Switch } from 'react-mdl';
import Broadcast from './components/broadcast';

export default class Studio extends React.Component {
  constructor(props) {
    super(props);

    this.toggleStudio = this.toggleStudio.bind(this);

    this.state = {
      enabled: false,
    };
  }

  toggleStudio() {
    fetch('/admin/update/studio', {
      method: 'post',
      data: JSON.stringify({
        id: studio.name,
        name: studio.name,
        enabled: this.state.enabled
      })
    })
  }

  renderInfo() {
    return (
      <section>
        <Card>
          <CardTitle>
            {studio.enabled ? 'Disable Studio' : 'Enable Studio'}
          </CardTitle>
          <CardText>
            This jeopardy studio is currently
            <strong>{studio.enabled ? 'enabled' : 'disabled'}</strong>.
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
          <CardActions>
            <Button colored>
              {studio.enabled ? 'Disable Studio' : 'Enable Studio'}
            </Button>
          </CardActions>
          <CardMenu>
            <Switch ripple id="switch1" checked={this.state.enabled} onChange={this.toggleStudio} />
          </CardMenu>
        </Card>

        <Broadcast studio="all" />
      </section>
    );
  }

  render() {
    return (
      <div className="demo-tabs">
        <Tabs activeTab={1} onChange={() => {}} ripple>
          <Tab>Info</Tab>
          <Tab>Features</Tab>
          <Tab>Configure</Tab>
        </Tabs>
        <section>
          <div className="content">You can add logic to update the content of this container based on the "activeTab" receive in the `onChange` callback.</div>
        </section>
      </div>
    );
  }
}
