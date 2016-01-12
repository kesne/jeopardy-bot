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
};

const defaultProps = {};

const Welcome = ({ onNext }) => {
  return (
    <Card shadow={0} className="setup-card">
      <CardTitle className="card-contrast card-contrast--tall">Welcome</CardTitle>
      <CardText>
        <p>
          <strong>Welcome to your new Jeopardy Slack Bot! </strong>
          It looks like you haven't been here before,
          so let's get start by setting up your application.
        </p>
      </CardText>
      <CardActions border>
        <Button colored onClick={onNext}>Get Started</Button>
      </CardActions>
    </Card>
  );
};

Welcome.propTypes = propTypes;
Welcome.defaultProps = defaultProps;

export default Welcome;
