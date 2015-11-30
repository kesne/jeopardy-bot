import React from 'react';
import { render } from 'react-dom';
import { Layout, Drawer, Navigation, Content } from 'react-mdl';
import { Router, Route, Link } from 'react-router';

import Home from './home';
import Studio from './studio';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      studios: [],
    };

    fetch('/api/v1/studios/', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(studios => this.setState({ studios }));
  }

  render() {
    return (
      <Layout fixedDrawer>
        <Drawer title="Title">
            <Navigation>
              <Link to="/">Home</Link>
              {/* <Link to="/studio">Studios</Link> */}
              <Link to="/studio">Studios</Link>
              {this.state.studios.map((studio) => (
                <Link to={`/studio/${studio.id}`}>{studio.name}</Link>
              ))}
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
