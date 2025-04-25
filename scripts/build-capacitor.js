const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Set environment variable for Capacitor build
process.env.CAPACITOR = "true"

console.log("Building for Capacitor...")

// Build Next.js app with static export
execSync("next build", { stdio: "inherit" })

// Ensure the out directory exists
if (!fs.existsSync("out")) {
  console.error("Build failed: out directory not found")
  process.exit(1)
}

// Fix paths in HTML files
console.log("Fixing paths in HTML files...")
const fixPaths = (dir) => {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      fixPaths(filePath)
    } else if (file.endsWith(".html")) {
      let content = fs.readFileSync(filePath, "utf8")

      // Fix script and stylesheet paths
      content = content.replace(/src="\/_next\//g, 'src="./_next/')
      content = content.replace(/href="\/_next\//g, 'href="./_next/')

      fs.writeFileSync(filePath, content)
    }
  })
}

fixPaths("out")

// Sync with Capacitor
console.log("Syncing with Capacitor...")
execSync("npx cap sync", { stdio: "inherit" })

console.log("Build completed successfully!")
