import React from 'react';
import { Button, Card, CardText, CardTitle, CardMenu, CardActions, Icon, Textfield } from 'react-mdl';

const propTypes = {

};

const defaultProps = {

};

class Configuration extends React.Component {
  constructor(props) {
    super(props);

    this.fetchContestants();

    this.state = {
      contestants: [],
    };
  }

  fetchContestants() {
    fetch('/api/v1/contestants/', {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(contestants => {
      this.setState({ contestants });
    });
  }

  render() {
    return (
      <Card shadow={0} style={{
        width: '100%',
      }}>
        <CardTitle>Bot Configuration</CardTitle>
        <CardText>
          <h6 className="no-margin">Username</h6>
          <Textfield
            onChange={this.onChangeMessage}
            value={this.state.message}
            label="Username..."
          />

          <h6 className="no-margin">Icon Emoji</h6>
          <Textfield
            onChange={this.onChangeMessage}
            value={this.state.message}
            label="Icon Emoji..."
          />
        </CardText>
        <CardActions border>
          <Button colored ripple onClick={this.onClickSendMessage}>Save</Button>
        </CardActions>
        <CardMenu>
          <Icon name="face" />
        </CardMenu>
      </Card>
    );
  }
}

Configuration.propTypes = propTypes;
Configuration.defaultProps = defaultProps;

export default Configuration;
