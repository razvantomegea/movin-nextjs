#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to update
const FILES = {
  packageJson: path.join(process.cwd(), 'package.json'),
  settingsPage: path.join(process.cwd(), 'app/dashboard/settings/components/settings-page.tsx'),
  connectPage: path.join(process.cwd(), 'components/connect-page.tsx')
};

// Get command line arguments
const args = process.argv.slice(2);
const newVersion = args[0];
const buildDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');

if (!newVersion) {
  console.error('Please provide a version number (e.g. npm run update-version 1.5.0)');
  process.exit(1);
}

// Validate version format (semver)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Version must be in format x.y.z (e.g. 1.5.0)');
  process.exit(1);
}

console.log(`🚀 Updating version to ${newVersion} with build date ${buildDate}`);

// Update package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(FILES.packageJson, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(FILES.packageJson, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated ${FILES.packageJson}`);
} catch (err) {
  console.error(`❌ Failed to update ${FILES.packageJson}:`, err);
  process.exit(1);
}

// Update settings page
try {
  let content = fs.readFileSync(FILES.settingsPage, 'utf8');
  // Update version
  content = content.replace(
    /<span className="text-sm">\d+\.\d+\.\d+<\/span>/,
    `<span className="text-sm">${newVersion}</span>`
  );
  // Update build date
  content = content.replace(
    /<span className="text-sm">\d{4}\.\d{2}\.\d{2}<\/span>/,
    `<span className="text-sm">${buildDate}</span>`
  );
  fs.writeFileSync(FILES.settingsPage, content);
  console.log(`✅ Updated ${FILES.settingsPage}`);
} catch (err) {
  console.error(`❌ Failed to update ${FILES.settingsPage}:`, err);
}

// Update connect page
try {
  let content = fs.readFileSync(FILES.connectPage, 'utf8');
  content = content.replace(
    /<p className="text-gray-400 dark:text-blue-200\/50 text-xs text-center">v\d+\.\d+\.\d+<\/p>/g,
    `<p className="text-gray-400 dark:text-blue-200/50 text-xs text-center">v${newVersion}</p>`
  );
  fs.writeFileSync(FILES.connectPage, content);
  console.log(`✅ Updated ${FILES.connectPage}`);
} catch (err) {
  console.error(`❌ Failed to update ${FILES.connectPage}:`, err);
}

console.log('🎉 Version update complete!'); 