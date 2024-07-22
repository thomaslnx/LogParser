import fs from 'fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const distPath = path.join(__dirname, 'dist')

const replaceInputFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8')
  const fileImportStatement = content.match(/(import\s+.*?\s+from\s+['"](\.\/|\.\.\/).*?['"])/gmi)
  const importSubstring1 = fileImportStatement[0].substring(0, 40)
  const importSubstring2 = fileImportStatement[0].substring(40)
  const updatedFileImportStatement = importSubstring1 + '.js' + importSubstring2
  content = content.replace(fileImportStatement, updatedFileImportStatement)
  fs.writeFileSync(filePath, content, 'utf8')
}

const processDirectory = (distPath) => {
  fs.readdirSync(distPath).forEach(file => {
    const fullPath = path.join(distPath, file)

    if (fs.lstatSync(fullPath).isDirectory()) {
      processDirectory(fullPath)
    } else if (fullPath.endsWith('index.js')) {
      replaceInputFile(fullPath)
    }
  })
}

processDirectory(distPath)