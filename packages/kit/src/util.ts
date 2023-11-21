import { useNuxt } from '@nuxt/kit'
import { fixSlashes, resolveSitePath } from 'site-config-stack'
import { withoutProtocol } from 'ufo'
import { env, isDevelopment } from 'std-env'
import { useSiteConfig } from './'

export function useNitroOrigin() {
  const cert = env.NITRO_SSL_CERT
  const key = env.NITRO_SSL_KEY

  let host = env.NITRO_HOST || env.HOST || false
  let port = env.NITRO_PORT || env.PORT || (isDevelopment ? 3000 : false)
  let protocol = ((cert && key) || !isDevelopment) ? 'https' : 'http'
  // don't trust development nitro headers
  // in dev and prerendering we can rely on the vite node env
  if ((isDevelopment || env.prerender) && env.NUXT_VITE_NODE_OPTIONS) {
    const origin = JSON.parse(env.NUXT_VITE_NODE_OPTIONS).baseURL.replace('/__nuxt_vite_node__', '')
    host = withoutProtocol(origin)
    protocol = origin.includes('https') ? 'https' : 'http'
  }
  if (typeof host === 'string' && host.includes(':')) {
    port = host.split(':').pop()!
    host = host.split(':')[0]
  }
  port = port ? `:${port}` : ''
  return `${protocol}://${host}${port}/`
}

export function withSiteUrl(path: string, options: { withBase?: boolean, throwErrorOnMissingSiteUrl?: boolean } = {}) {
  const siteConfig = useSiteConfig()
  if (!siteConfig.url && options.throwErrorOnMissingSiteUrl)
    throw new Error('Missing url in site config. Please add `{ site: { url: <url> } }` to nuxt.config.ts.')

  const nuxt = useNuxt()
  const base = nuxt.options.app.baseURL || nuxt.options.nitro.baseURL || '/'
  return resolveSitePath(path, {
    absolute: true,
    siteUrl: siteConfig.url || '',
    trailingSlash: siteConfig.trailingSlash,
    base,
    withBase: options.withBase,
  })
}

export function withSiteTrailingSlash(path: string) {
  const siteConfig = useSiteConfig()
  return fixSlashes(siteConfig.trailingSlash, path)
}

export function createSitePathResolver(options: { canonical?: boolean, absolute?: boolean, withBase?: boolean } = {}, nuxt = useNuxt()): (path: string) => string {
  const siteConfig = useSiteConfig()
  const nitroOrigin = useNitroOrigin()
  const canUseSiteUrl = (options.canonical !== false || env.prerender) && siteConfig.url
  const nuxtBase = nuxt.options.app.baseURL || '/'
  return (path: string) => {
    // don't use any composables within here
    return resolveSitePath(path, {
      ...options,
      siteUrl: canUseSiteUrl ? siteConfig.url! : nitroOrigin,
      trailingSlash: siteConfig.trailingSlash,
      base: nuxtBase,
    })
  }
}
