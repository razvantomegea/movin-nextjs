export const isCapacitorNative = (): boolean => {
  return typeof window !== "undefined" && typeof window.Capacitor !== "undefined" && window.Capacitor.isNative === true
}

export const isAndroid = (): boolean => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === "android"
}

export const isIOS = (): boolean => {
  return isCapacitorNative() && window.Capacitor.getPlatform() === "ios"
}

export const isWeb = (): boolean => {
  return !isCapacitorNative() || window.Capacitor.getPlatform() === "web"
}

// Add this to the global Window interface
declare global {
  interface Window {
    Capacitor?: {
      isNative: boolean
      getPlatform: () => string
    }
  }
}
