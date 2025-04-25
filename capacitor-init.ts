import { execSync } from "child_process"
import fs from "fs"

// Ensure the out directory exists
if (!fs.existsSync("out")) {
  console.log("Building the project first...")
  execSync("npm run static", { stdio: "inherit" })
}

// Initialize Capacitor if not already initialized
if (!fs.existsSync("capacitor.config.json")) {
  console.log("Initializing Capacitor...")
  execSync("npx cap init Movin com.movin.app --web-dir out", { stdio: "inherit" })
}

// Add platforms if they don't exist
if (!fs.existsSync("android")) {
  console.log("Adding Android platform...")
  execSync("npx cap add android", { stdio: "inherit" })
}

if (!fs.existsSync("ios")) {
  console.log("Adding iOS platform...")
  execSync("npx cap add ios", { stdio: "inherit" })
}

// Sync the project
console.log("Syncing Capacitor project...")
execSync("npx cap sync", { stdio: "inherit" })

console.log("Capacitor setup complete!")
console.log("To open Android Studio, run: npm run cap:open:android")
console.log("To open Xcode, run: npm run cap:open:ios")
