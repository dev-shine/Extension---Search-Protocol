import {Provider} from 'react-redux';
import {createStore as oldCreateStore, applyMiddleware} from 'redux';
import createPromiseMiddleware from './promise_middleware';
import reducer from '../reducers';

const createStore = applyMiddleware(createPromiseMiddleware())(oldCreateStore)

export {
  Provider,
  reducer,
  createStore
};
