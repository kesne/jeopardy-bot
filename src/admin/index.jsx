import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import { Header, Layout, Drawer, Navigation, Content, Menu, MenuItem, Icon, IconButton } from 'react-mdl';
import { Router, Route, Link, IndexRoute } from 'react-router';

import Home from './home';
import Studio from './studio';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.loadStudios();
    this.state = {
      studios: [],
    };
  }

  onClickGithub() {
    window.location = 'https://github.com/kesne/jeopardy-bot';
  }

  onClickSetup() {
    // TODO:
  }

  loadStudios() {
    fetch('/api/v1/studios/', {
      credentials: 'include',
    }).then(res => {
      return res.json();
    }).then(studios => {
      this.setState({ studios });
    });
  }

  render() {
    return (
      <Layout fixedDrawer fixedHeader className="jbot-layout">
        <Header title="JeopardyBot">
        <div style={{ position: 'relative' }}>
          <IconButton name="more_vert" id="jbot-menu-lower-right" ripple />
          <Menu target="jbot-menu-lower-right" align="right">
            <MenuItem>Setup</MenuItem>
            <MenuItem onClick={this.onClickGithub}>Github</MenuItem>
          </Menu>
        </div>
        </Header>
        <Drawer className="jbot-drawer">
          <Navigation className="jbot-navigation">
            <Link to="/">
              <Icon name="home" />
              Home
            </Link>
            {/* <Link to="/stats">Stats</Link> */}
            <Link to="/studio">
              <Icon name="keyboard_arrow_down" />
              Studios
            </Link>
            {this.state.studios.map((studio) => (
              <Link to={`/studio/${studio.id}`} key={studio.id} className="jbot-sublink">
                <span className="jbot-hashtag">#</span>
                {studio.name}
              </Link>
            ))}
          </Navigation>
        </Drawer>
        <Content>
          <div className="page-content">
            {this.props.children}
          </div>
        </Content>
      </Layout>
    );
  }
}

App.propTypes = {
  children: PropTypes.any.isRequired,
};

render((
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Home}/>
      <Route path="studio/:studio" component={Studio} />

      {/* Catch all route: */}
      <Route path="*" component={Home} />
    </Route>
  </Router>
), document.getElementById('react-app'));
