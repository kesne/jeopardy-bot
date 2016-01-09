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

const Second = ({ onNext }) => {
  return (
    <Card shadow={0} className="setup-card">
      <CardTitle>Create Slack Integration</CardTitle>
      <CardText>
        First, you need to create the integration on your Slack team that JeopardyBot will use.
        To do this, you can go HERE and enter the information you want.
        Don't forget to give it great profile picture!
      </CardText>
      <CardActions border>
        <Button colored onClick={onNext}>I've Created My Slack Integration</Button>
      </CardActions>
    </Card>
  );
};

Second.propTypes = propTypes;
Second.defaultProps = defaultProps;

export default Second;
