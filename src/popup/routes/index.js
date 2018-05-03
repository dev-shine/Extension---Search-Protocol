import HomePage from '../containers/home'
import LoginPage from '../containers/login'
import UserInactivePage from '../containers/user_inactive'
import AnnotateStepOnePage from '../containers/annotate_step_1'
import AnnotateStepTwoPage from '../containers/annotate_step_2'
import CreateLinkPage from '../containers/create_link'
import SettingsPage from '../containers/settings'

const routes = [
  { path: '/', component: HomePage, exact: true },
  { path: '/login', component: LoginPage, exact: true },
  { path: '/user-inactive', component: UserInactivePage, exact: true },
  { path: '/annotate-step-1', component: AnnotateStepOnePage, exact: true },
  { path: '/annotate-step-2', component: AnnotateStepTwoPage, exact: true },
  { path: '/create-link', component: CreateLinkPage, exact: true },
  { path: '/settings', component: SettingsPage, exact: true }
];

export default routes;
