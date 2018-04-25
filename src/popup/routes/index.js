import HomePage from '../containers/home'
import LoginPage from '../containers/login'
import AnnotateStepOnePage from '../containers/annotate_step_1'
import AnnotateStepTwoPage from '../containers/annotate_step_2'
import CreateLinkPage from '../containers/create_link'

const routes = [
  { path: '/', component: HomePage, exact: true },
  { path: '/login', component: LoginPage, exact: true },
  { path: '/annotate-step-1', component: AnnotateStepOnePage, exact: true },
  { path: '/annotate-step-2', component: AnnotateStepTwoPage, exact: true },
  { path: '/create-link', component: CreateLinkPage, exact: true }
];

export default routes;
