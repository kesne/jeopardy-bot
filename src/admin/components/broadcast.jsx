// TODO: Post to the server, clear the form, and show a little message.
import React, { PropTypes } from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Textfield } from 'react-mdl';

class Broadcast extends React.Component {
  render() {
    return (
      <Card shadow={1}>
        <CardTitle>Send Broadcast</CardTitle>
        <CardText>
          Send a message to this as the bot.
          <Textfield
            onChange={() => {}}
            label="Text lines..."
            rows={3}
          />
        </CardText>
        <CardActions border>
          <Button colored>Send Message</Button>
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
