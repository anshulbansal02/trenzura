import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { projectRoot } from './lib/runtime'

const generatedDir = path.join(projectRoot, 'src/generated')
const generatedFiles = [
  path.join(generatedDir, 'products.json'),
  path.join(generatedDir, 'products-sync.json'),
]

await mkdir(generatedDir, { recursive: true })

for (const filePath of generatedFiles) {
  try {
    await access(filePath)
  } catch {
    await writeFile(filePath, '[]\n')
  }
}
