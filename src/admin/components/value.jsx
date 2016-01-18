import React, { PropTypes } from 'react';
import { Card, CardText, CardTitle, Textfield } from 'react-mdl';

class Feature extends React.Component {
  constructor(props) {
    super(props);
    this.onValueChange = this.onValueChange.bind(this);
  }

  onValueChange(e) {
    this.props.onChange(
      this.props.value,
      e.target.value
    );
  }

  render() {
    return (
      <Card
        shadow={0}
        style={{
          width: '100%',
          minHeight: 140,
        }}
      >
        <CardTitle>{this.props.name}</CardTitle>
        <CardText>
          <p>
            {this.props.description}
          </p>
          <Textfield
            onChange={this.onValueChange}
            value={this.props.currentValue}
            label={this.props.name + '...'}
            {...this.props.input}
          />
        </CardText>
      </Card>
    );
  }
}

Feature.propTypes = {
  input: PropTypes.object,
  value: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  currentValue: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Feature;
