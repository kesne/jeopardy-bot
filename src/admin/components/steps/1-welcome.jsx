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

const First = ({ onNext }) => {
  return (
    <Card shadow={0} className="setup-card">
      <CardTitle className="card-contrast">Welcome</CardTitle>
      <CardText>
        Welcome to your new Jeopardy Slack Bot!
        It looks like you haven't set things up yet, so let's start by setting up your application.
      </CardText>
      <CardActions border>
        <Button colored onClick={onNext}>Get Started</Button>
      </CardActions>
    </Card>
  );
};

First.propTypes = propTypes;
First.defaultProps = defaultProps;

export default First;
