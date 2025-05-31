const fs = require('fs')
const path = require('path')

module.exports = async (context) => {
  const localesPath = path.join(context.appOutDir, 'locales')

  if (!fs.existsSync(localesPath)) return

  const keepLocales = ['en-GB.pak'] // оставляем только этот файл

  fs.readdirSync(localesPath).forEach((file) => {
    if (!keepLocales.includes(file)) {
      fs.unlinkSync(path.join(localesPath, file))
    }
  })

  console.log('✔ Locales cleaned: only en-US.pak kept')
}
