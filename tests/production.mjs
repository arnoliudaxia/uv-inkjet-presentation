import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const base = '/uv-inkjet-presentation/'
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
  })
}
await run('npm', ['run', 'build', '--', '--base', base])
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const root = resolve('dist')
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  if (!pathname.startsWith(base)) { res.writeHead(404).end(); return }
  let file = resolve(root, pathname.slice(base.length) || 'index.html')
  if (!file.startsWith(`${root}/`)) { res.writeHead(403).end(); return }
  try {
    let data
    try { data = await readFile(file) } catch {
      // Pages returns Slidev's generated 404.html for history-mode deep links.
      if (extname(file)) { res.writeHead(404).end(); return }
      file = resolve(root, '404.html')
      data = await readFile(file)
      res.statusCode = 404
    }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
    res.end(data)
  } catch (error) { res.writeHead(500).end(String(error)) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const env = { ...process.env, TEST_URL: `http://127.0.0.1:${server.address().port}${base.slice(0, -1)}`, SCREENSHOT_DIR: '/tmp/uv-sidebar-production' }
try {
  await run(process.execPath, ['tests/sidebar.mjs'], env)
  await run(process.execPath, ['tests/browser.mjs'], env)
} finally {
  await new Promise(resolve => server.close(resolve))
}
