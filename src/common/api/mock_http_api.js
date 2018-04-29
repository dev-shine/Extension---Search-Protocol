import storage from '../storage'
import { or } from '../utils'

export const loadLinks = ({ url }) => {
  return storage.get('bridgit_links')
  .then(pairs => {
    return pairs.filter(p => {
      return or(...p.links.map(l => l.url === url))
    })
  })
}

export const postLinks = (linkPair) => {
  return storage.get('bridgit_links')
  .then(pairs => {
    return storage.set('bridgit_links', [...pairs, linkPair])
  })
}
