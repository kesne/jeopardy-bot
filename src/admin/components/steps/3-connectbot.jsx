import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import {
  Card,
  CardTitle,
  CardActions,
  Button,
  CardText,
  Textfield,
} from 'react-mdl';

const propTypes = {
  onNext: PropTypes.func.isRequired,
  BackButton: PropTypes.element.isRequired,
  token: PropTypes.string.isRequired,
};

const defaultProps = {};

class ConnectBot extends React.Component {
  constructor(props) {
    super(props);

    this.onChangeKey = this.onChangeKey.bind(this);
    this.onNext = this.onNext.bind(this);

    this.state = {
      token: props.token,
    };
  }

  componentDidMount() {
    const input = ReactDOM.findDOMNode(this.refs.input).querySelector('input');
    input.focus();
    input.select();
  }

  onChangeKey(e) {
    this.setState({
      token: e.target.value,
    });
  }

  onNext() {
    this.props.onNext({
      token: this.state.token,
    });
  }

  render() {
    const { BackButton } = this.props;

    return (
      <Card shadow={0} className="setup-card">
        <CardTitle className="card-contrast">Connect Your Bot</CardTitle>
        <CardText>
          <p>
            Now that you have an integration configured, let's connect JeopardyBot to use it.
            Copy the "<strong>API Token</strong>" from the integration page, and paste it into the
            input below.
          </p>
          <Textfield
            ref="input"
            onChange={this.onChangeKey}
            value={this.state.token}
            label="API Token..."
            floatingLabel
          />
        </CardText>
        <CardActions border>
          <Button onClick={this.onNext} disabled={!this.state.token} colored>
            Test Slack Connection
          </Button>
          {BackButton}
        </CardActions>
      </Card>
    );
  }
}

ConnectBot.propTypes = propTypes;
ConnectBot.defaultProps = defaultProps;

export default ConnectBot;
