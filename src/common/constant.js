
const mk = (list) => list.reduce((prev, key) => {
  prev[key] = key;
  return prev
}, {})

export const URL_STATUS = mk([
  'PENDING',
  'ERROR',
  'DONE',
  'ONGOING'
])

export const UPSERT_MODE = mk([
  'EDIT',
  'ADD'
])
