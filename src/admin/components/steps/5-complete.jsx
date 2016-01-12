// Congratulate them on setting up the new API.
// Tell them to get started by inviting JeopardyBot to rooms in order to play.
// Remind that they can always say "help" to get help on how to use JeopardyBot

import React, { PropTypes } from 'react';
import {
  Card,
  CardTitle,
  CardText,
  CardActions,
  Button,
} from 'react-mdl';

const propTypes = {
  token: PropTypes.string.isRequired,
};

function saveToken(token) {
  return fetch(`/api/v1/apps/${window.GlobalAppId}`, {
    credentials: 'include',
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiToken: token,
    }),
  }).then(res => res.json());
}

function goToAdminConsole() {
  window.location = '/admin/';
}

const Complete = ({ token }) => {
  saveToken(token);
  return (
    <Card shadow={0} className="setup-card">
      <CardTitle className="card-contrast card-contrast--tall">You're All Set!</CardTitle>
      <CardText>
        <p>
          <strong>You have successfully set up JeopardyBot on your Slack team!</strong>
        </p>
        <p>
          You can get started by inviting your new bot to rooms in order to play.
          If you ever need help, just type "help" in a room with the bot to get help.
        </p>
      </CardText>
      <CardActions border>
        <Button colored onClick={goToAdminConsole}>Go to the Admin Console</Button>
      </CardActions>
    </Card>
  );
};

Complete.propTypes = propTypes;

export default Complete;
