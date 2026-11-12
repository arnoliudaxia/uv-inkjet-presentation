import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// Slidev treats a root index.html as an HTML injection snippet. The untouched
// legacy document has a lowercase doctype, so exclude its body and assets here.
const legacyBody = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
  .match(/<body>([\s\S]*?)<\/body>/i)?.[1].trim()
function isolate(html: string) {
  return html.replace(legacyBody || '\u0000', '')
    .replace(/<script\b[^>]*src=["']\/app\.js["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*href=["']\/styles\.css["'][^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>UV 打印喷头课堂</title>')
}

// Slidev 53 CLI has no --host option. Vite's project config overrides its
// localhost default, without enabling Slidev's remote-control mode.
export default defineConfig({
  plugins: [{
    name: 'legacy-isolation-and-loopback',
    enforce: 'pre',
    load(id) {
      // Slidev also auto-imports root styles.css; do not mix the legacy sheet
      // into the new deck. The legacy HTTP server still serves it unchanged.
      if (id.split('?')[0] === new URL('./styles.css', import.meta.url).pathname) return ''
    },
    // CLI inline config wins over top-level server.host; a config hook runs
    // after that merge and explicitly pins IPv4 loopback.
    config() { return { server: { host: '127.0.0.1', strictPort: true } } },
    transformIndexHtml: { order: 'pre', handler: isolate },
    configureServer(server) {
      // Slidev serves its generated dev HTML directly, bypassing Vite's HTML
      // transforms. Filter that HTML response too; other assets are untouched.
      server.middlewares.use((_req, res, next) => {
        const end = res.end
        res.end = function (chunk: any, ...args: any[]) {
          if (typeof chunk === 'string' && chunk.startsWith('<!DOCTYPE html>')) chunk = isolate(chunk)
          return end.call(this, chunk, ...args)
        } as typeof res.end
        next()
      })
    },
  }],
  server: { host: '127.0.0.1', strictPort: true },
  preview: { host: '127.0.0.1', strictPort: true },
})
