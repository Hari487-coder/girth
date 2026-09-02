// GitHub Pages serves 404.html for unknown paths; serving the SPA shell there
// makes deep links like /girth/trees/GIRTH-001 work.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
console.log('dist/404.html written')
