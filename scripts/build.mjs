import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const node = process.execPath
const commands = [
  [node, [resolve('node_modules/vue-tsc/index.js'), '--noEmit']],
  [node, [resolve('node_modules/vite/bin/vite.js'), 'build']],
]

const children = commands.map(([command, args]) => spawn(command, args, { stdio: 'inherit', env: process.env }))
let finished = false
let failures = 0

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (finished) return
    if (code !== 0 || signal) {
      failures += 1
      finished = true
      for (const other of children) {
        if (other !== child && other.exitCode === null) other.kill('SIGTERM')
      }
      process.exitCode = code || 1
      return
    }
    if (children.every(other => other.exitCode !== null)) {
      finished = true
      process.exitCode = failures ? 1 : 0
    }
  })
}
