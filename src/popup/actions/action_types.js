export const make3 = (name) => [name + '_REQUEST', name + '_SUCCESS', name + '_FAIL'];

export const type3 = (name) => make3(name).map((key) => types[key]);

const promiseTypes = [
  'LOAD_SOMETHING'
].reduce((prev, cur) => {
  make3(cur).forEach((key) => {
    prev[key] = key;
  });

  return prev;
}, {});

const simpleTypes = [
  'SET_ROUTE',
  'SET_USER_INFO',
  'SET_LOADED',
  'SET_LINK_PAIR'
].reduce((prev, cur) => {
  prev[cur] = cur
  return prev
}, {})

export const types = { ...simpleTypes, ...promiseTypes }
