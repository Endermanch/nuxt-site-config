import {
  hasProtocol,
  parseURL,
  withBase,
  withHttps,
  withLeadingSlash,
  withTrailingSlash,
  withoutTrailingSlash,
} from 'ufo'
import type { SiteConfig } from './type'

export function normalizeSiteConfig(config: SiteConfig) {
  // fix booleans index / trailingSlash
  if (typeof config.indexable !== 'undefined')
    config.indexable = String(config.indexable) !== 'false'
  if (typeof config.trailingSlash !== 'undefined')
    config.trailingSlash = String(config.trailingSlash) !== 'false'
  if (config.url && !hasProtocol(config.url, { acceptRelative: true, strict: false }))
    config.url = withHttps(config.url)

  // sort the keys
  const keys = Object.keys(config)
    .sort((a, b) => a.localeCompare(b))
  // create new object
  const newConfig: Partial<SiteConfig> = {}
  for (const k of keys)
    newConfig[k] = config[k]

  return newConfig as SiteConfig
}

export function resolveSitePath(pathOrUrl: string, options: { siteUrl: string; trailingSlash: boolean; base?: string; absolute?: boolean; withBase?: boolean }) {
  let path = pathOrUrl
  // check we should check what we're working with, either an absolute or relative path
  if (hasProtocol(pathOrUrl, { strict: false, acceptRelative: true })) {
    // need to extract just the path
    const parsed = parseURL(pathOrUrl)
    path = parsed.pathname
  }
  const base = withLeadingSlash(options.base || '/')
  if (base !== '/' && path.startsWith(base)) {
    // remove the base from the path, it will be re-added if we need it
    path = path.slice(base.length)
  }
  const origin = options.absolute ? options.siteUrl : ''
  const baseWithOrigin = options.withBase ? withBase(base, origin || '/') : origin
  const resolvedUrl = withBase(path, baseWithOrigin)
  return (path === '/' && !options.withBase) ? withTrailingSlash(resolvedUrl) : fixSlashes(options.trailingSlash, resolvedUrl)
}

export function fixSlashes(trailingSlash: boolean, pathOrUrl: string) {
  const $url = parseURL(pathOrUrl)
  const isFileUrl = $url.pathname.includes('.')
  if (isFileUrl)
    return pathOrUrl
  const fixedPath = trailingSlash ? withTrailingSlash($url.pathname) : withoutTrailingSlash($url.pathname)
  // reconstruct the url
  return `${$url.protocol ? `${$url.protocol}//` : ''}${$url.host || ''}${fixedPath}${$url.search || ''}${$url.hash || ''}`
}
