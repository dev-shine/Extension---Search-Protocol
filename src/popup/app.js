import React, { Component } from 'react'
import { HashHistory as Router, Route, Link, Switch, Redirect } from 'react-router-dom'

import Header from './components/header'
import Footer from './components/footer'
import routes from './routes'
import 'antd/dist/antd.less'
import './app.scss'

class App extends Component {
  renderContent () {
    return (
      <section className="content">
        <Switch>
          {routes.map((route) => (
            <Route {...route} key={route.path} />
          ))}
        </Switch>
      </section>
    )
  }

  render () {
    return (
      <div className="app">
        <Header />
        {this.renderContent()}
        <Footer />
      </div>
    );
  }
}

export default App;
