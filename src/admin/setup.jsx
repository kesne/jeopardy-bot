import React, { PropTypes } from 'react';
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

import First from './components/steps/first';
import Second from './components/steps/second';

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
      step: 0,
    };
  }

  onNext() {
    this.setState({
      step: this.state.step + 1,
    });
  }

  onBack() {
    this.setState({
      step: this.state.step - 1,
    });
  }

  renderStep() {
    switch (this.state.step) {
      default:
      case 0:
        return <First onNext={this.onNext} />;
      case 1:
        return <Second onNext={this.onNext} />;
    }
  }

  render() {
    return (
      <Layout fixedHeader>
        <Header>
          <HeaderRow title="JeopardyBot Setup" />
        </Header>
        <Content>
          <div className="page-content">
            <ProgressBar progress={this.state.step * 20} buffer={90} className="setup-progress" />
            {this.renderStep()}
          </div>
          <Button onClick={this.onBack} className="setup-back">
            Back
          </Button>
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
