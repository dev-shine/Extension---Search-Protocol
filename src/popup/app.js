import React, { Component } from 'react'
import { HashHistory as Router, Route, Link, Switch, Redirect } from 'react-router-dom'

import Header from './components/header'
import routes from './routes'
import 'antd/dist/antd.css'
import './app.scss'

class App extends Component {
  render () {
    return (
      <div className="app">
        <Header />
        <section className="content">
          <Switch>
            {routes.map((route) => (
              <Route {...route} key={route.path} />
            ))}
          </Switch>
        </section>
      </div>
    );
  }
}

export default App;
