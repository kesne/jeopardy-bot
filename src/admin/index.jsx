import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import {
  Header,
  Layout,
  Drawer,
  Navigation,
  Content,
  Menu,
  MenuItem,
  Icon,
  IconButton,
} from 'react-mdl';
import { Router, Route, Link, IndexRoute, Redirect } from 'react-router';
import { createHistory, useBasename } from 'history';

import Home from './home';
import Studio from './studio';
import Setup from './setup';

// Run our app under the /base URL.
const history = useBasename(createHistory)({
  basename: '/admin',
});

class App extends React.Component {

  constructor(props) {
    super(props);

    this.onStudioDeleted = this.onStudioDeleted.bind(this);

    this.getStudios();
    this.state = {
      studios: [],
    };
  }

  onClickGithub() {
    window.location = 'https://github.com/kesne/jeopardy-bot';
  }

  onStudioDeleted() {
    this.getStudios();
  }

  getStudios() {
    fetch('/api/v1/studios/?sort=name', {
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
            <Link to="/studio" className="jbot-disabled">
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
            {React.cloneElement(this.props.children, {
              onStudioDeleted: this.onStudioDeleted,
            })}
          </div>
        </Content>
      </Layout>
    );
  }
}

App.propTypes = {
  children: PropTypes.any.isRequired,
};

// Verifies that the setup has been completed:
function verifySetup(nextState, replaceState, callback) {
  const onSetup = nextState.location.pathname.includes('/setup');
  fetch('/api/v1/apps/', {
    credentials: 'include',
  }).then(res => {
    return res.json();
  }).then(([app]) => {
    window.GlobalAppId = app._id;
    if (!app.apiToken && !onSetup) {
      replaceState(null, '/setup');
    } else if (app.apiToken && onSetup) {
      replaceState(null, '/');
    }
    callback();
  });
}

render((
  <Router history={history}>
    <Route path="/setup" onEnter={verifySetup} component={Setup} />
    <Route path="/" onEnter={verifySetup} component={App}>
      <IndexRoute component={Home}/>
      <Route path="studio/:studio" component={Studio} />

      {/* Catch all redirect: */}
      <Redirect from="*" to="/" />
    </Route>
  </Router>
), document.getElementById('react-app'));
