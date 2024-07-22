import fs from 'node:fs/promises'
import LogTransform from './logTransform'

(async () => {
  const readFileHandle = await fs.open('qgames.log', 'r')
  const writeFileHandle = await fs.open('log_parsed.log', 'w')
  const originalFileSize = await readFileHandle.stat()

  const readStream = readFileHandle.createReadStream()
  const writeStream = writeFileHandle.createWriteStream()

  const logParser = new LogTransform(originalFileSize.size)

  readStream.pipe(logParser).pipe(writeStream)
})()