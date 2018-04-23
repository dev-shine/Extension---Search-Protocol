import HomePage from '../containers/home'
import LoginPage from '../containers/login'

const routes = [
  { path: '/', component: HomePage, exact: true },
  { path: '/login', component: LoginPage, exact: true }
];

export default routes;
