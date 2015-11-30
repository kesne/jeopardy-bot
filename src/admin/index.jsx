import React from 'react';
import { render } from 'react-dom';
import { Layout, Drawer, Navigation, Content } from 'react-mdl';
import { Router, Route, Link } from 'react-router';

import Home from './home';
import Studio from './studio';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};

  }

  render() {
    return (
      <Layout fixedDrawer>
        <Drawer title="Title">
            <Navigation>
                <Link>Link</Link>
                <Link>Link</Link>
                <Link>Link</Link>
                <Link>Link</Link>
                <Link>Link</Link>
            </Navigation>
        </Drawer>
        <Content />
      </Layout>
    );
  }
}

render((
  <Router>
    <Route path="/" component={App}>
      <Route path="home" component={Home} />
      <Route path="studios/:name" component={Studio} />
      <Route path="*" component={Home} />
    </Route>
  </Router>
), document.getElementById('react-app'));
