import React, { PropTypes } from 'react';
import {
  Card,
  CardTitle,
  CardText,
  CardActions,
  Button,
  Spinner,
  Icon,
} from 'react-mdl';

const propTypes = {
  onNext: PropTypes.func.isRequired,
  BackButton: PropTypes.element.isRequired,
  token: PropTypes.string.isRequired,
};

const defaultProps = {

};

class TestAPI extends React.Component {
  constructor(props) {
    super(props);

    this.testApi();

    this.state = {
      ok: false,
      attempted: false,
    };
  }

  testApi() {
    fetch('/api/v1/authtest', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: this.props.token,
      }),
    })
    .then(res => res.json())
    .then((res) => {
      this.setState({
        attempted: true,
        ...res,
      });
    });
  }

  render() {
    const { onNext, BackButton } = this.props;
    return (
      <Card shadow={0} className="setup-card">
        <CardTitle className="card-contrast">Testing Connection...</CardTitle>
        <CardText>
          {!this.state.attempted && (
            <Spinner className="setup-spinner" />
          )}

          {this.state.attempted && (
            <div>
              <div className="connection-status">
                {this.state.ok ? (
                  <Icon name="check" className="icon--large mdl-color-text--green-400" />
                ) : (
                  <Icon name="cancel" className="icon--large mdl-color-text--red-400" />
                )}
              </div>
              <h6>
                {this.state.ok ?
                  'Yay, we were able to connect!' :
                  `Hmm... something isn't right.`
                }
              </h6>
              {this.state.ok ? (
                <p>
                  We were able to connect to the Slack team "<strong>{this.state.team}</strong>",
                  as a bot named "<strong>{this.state.user}</strong>".

                  Does this look correct to you?
                </p>
              ) : (
                <p>
                  We were unable to connect to Slack.
                  Try going back and verify that you entered the correct API Token.
                </p>
              )}
            </div>
          )}
        </CardText>
        <CardActions border>
          {this.state.ok && (
            <Button colored onClick={onNext}>Yep, looks correct!</Button>
          )}
          {BackButton}
        </CardActions>
      </Card>
    );
  }
}

TestAPI.propTypes = propTypes;
TestAPI.defaultProps = defaultProps;

export default TestAPI;
