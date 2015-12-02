import React, { PropTypes } from 'react';
import { Card, CardText, CardTitle, CardMenu, Switch } from 'react-mdl';

class Feature extends React.Component {
  constructor(props) {
    super(props);
    this.onSwitchChange = this.onSwitchChange.bind(this);
  }

  onSwitchChange() {
    this.props.onChange(
      this.props.feature,
      !this.props.enabled
    );
  }

  render() {
    return (
      <Card shadow={0} style={{
        width: '100%',
        minHeight: 140,
      }}>
        <CardTitle>{this.props.name}</CardTitle>
        <CardText>
          {this.props.description}
        </CardText>
        <CardMenu>
          <Switch checked={this.props.enabled} onChange={this.onSwitchChange} ripple />
        </CardMenu>
      </Card>
    );
  }
}

Feature.propTypes = {
  feature: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Feature;
