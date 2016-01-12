import React from 'react';
import {
  Layout,
  Header,
  HeaderRow,
  Content,
  ProgressBar,
  Footer,
  FooterSection,
  FooterLinkList,
  Button,
} from 'react-mdl';

import Welcome from './components/steps/1-welcome';
import SetupSlack from './components/steps/2-setupslack';
import ConnectBot from './components/steps/3-connectbot';
import TestAPI from './components/steps/4-testapi';
import Complete from './components/steps/5-complete';

const propTypes = {

};

const defaultProps = {

};

class Setup extends React.Component {
  constructor(props) {
    super(props);

    this.onNext = this.onNext.bind(this);
    this.onBack = this.onBack.bind(this);

    this.state = {
      token: '',
      step: 0,
    };
  }

  onNext(state) {
    this.setState({
      step: this.state.step + 1,
      ...state,
    });
  }

  onBack() {
    this.setState({
      step: this.state.step - 1,
    });
  }

  renderBack() {
    return (
      <Button onClick={this.onBack} className="setup-back" raised accent ripple>
        Go Back
      </Button>
    );
  }

// {/*token="xoxb-17442029383-0t6awBBW3GIR3cPcJQmdSwXM"*/}
  renderStep() {
    switch (this.state.step) {
      default:
      case 0:
        return <Welcome onNext={this.onNext} />;
      case 1:
        return <SetupSlack onNext={this.onNext} BackButton={this.renderBack()} />;
      case 2:
        return (
          <ConnectBot
            onNext={this.onNext}
            BackButton={this.renderBack()}
            token={this.state.token}
          />
        );
      case 3:
        return (
          <TestAPI
            onNext={this.onNext}
            BackButton={this.renderBack()}
            token={this.state.token}
          />
        );
      case 4:
        return <Complete token={this.state.token} />;
    }
  }

  render() {
    return (
      <Layout fixedHeader>
        <Header>
          <HeaderRow title="JeopardyBot Setup" className="header-row-sans-menu" />
        </Header>
        <Content>
          <div className="page-content">
            {/* The buffer at 90 makes it animated which is kind of pretty. */}
            <ProgressBar
              progress={this.state.step * 25}
              buffer={this.state.step === 4 ? 100 : 90}
              className="setup-progress"
            />
            {this.renderStep()}
          </div>
        </Content>
        <Footer size="mini">
          <FooterSection type="left" logo="JeopardyBot">
            <FooterLinkList>
              <a href="https://github.com/kesne/jeopardy-bot">Github</a>
              <a href="https://twitter.com/kesne">Twitter</a>
            </FooterLinkList>
          </FooterSection>
        </Footer>
      </Layout>
    );
  }
}

Setup.propTypes = propTypes;
Setup.defaultProps = defaultProps;

export default Setup;
