const fs = require('fs')
const path = require('path')

const packageJsonPath = path.join(__dirname, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Разбиваем версию на части
const versionParts = packageJson.version.split('.').map(Number)

// Увеличиваем патч-версию (третье число)
versionParts[2] = (versionParts[2] || 0) + 1

// Обновляем версию
packageJson.version = versionParts.join('.')

// Сохраняем обратно в package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

console.log(`Version bumped to ${packageJson.version}`)
