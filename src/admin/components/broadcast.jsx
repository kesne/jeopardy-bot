// TODO: Post to the server, clear the form, and show a little message.
import React, { PropTypes } from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Textfield } from 'react-mdl';

class Broadcast extends React.Component {
  render() {
    const allBroadcast = this.props.studio === 'all';
    return (
      <Card shadow={0} style={{
        width: '100%',
      }}>
        <CardTitle>Send Broadcast</CardTitle>
        <CardText>
          {allBroadcast ?
            `Send a message to all public and private slack channels the bot is currently in.
            This will not send any private messages.` :
            'Send a message to this studio as the bot.'
          }
          <Textfield
            onChange={() => {}}
            label="Message..."
            rows={3}
          />
        </CardText>
        <CardActions border>
          <Button colored ripple>Send Message</Button>
        </CardActions>
        <CardMenu>
          <Icon name="announcement" />
        </CardMenu>
    </Card>
    );
  }
}

Broadcast.propTypes = {
  studio: PropTypes.string.isRequired,
};

export default Broadcast;
