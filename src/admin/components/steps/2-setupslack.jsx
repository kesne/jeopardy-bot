import React, { PropTypes } from 'react';
import {
  Card,
  CardTitle,
  CardActions,
  Button,
  CardText,
} from 'react-mdl';

const propTypes = {
  onNext: PropTypes.func.isRequired,
  BackButton: PropTypes.element.isRequired,
};

const defaultProps = {};

function openSlackBotPage() {
  window.open('https://my.slack.com/services/new/bot');
}

const SetupSlack = ({ onNext, BackButton }) => {
  return (
    <Card shadow={0} className="setup-card">
      <CardTitle className="card-contrast">Create Slack Integration</CardTitle>
      <CardText>
        <p>
          First, you need to create the integration on your Slack team that JeopardyBot will use.
          To do this, click the button below and enter the desired username of the Slack bot.
        </p>
        <div className="setup-slack-button">
          <Button
            onClick={openSlackBotPage}
            raised
            colored
            ripple
          >
            Create Slack Bot Integration
          </Button>
        </div>
        <p>
          After it's been created, you can add more details, and give it a great profile picture.
          Keep the integration page open for the next step.
        </p>
      </CardText>
      <CardActions border>
        <Button colored onClick={onNext}>I've Created My Slack Integration</Button>
        {BackButton}
      </CardActions>
    </Card>
  );
};

SetupSlack.propTypes = propTypes;
SetupSlack.defaultProps = defaultProps;

export default SetupSlack;
