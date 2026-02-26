import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.personal.friction',
  appName: 'Friction',
  webDir: 'dist',
  android: {
    backgroundColor: '#1a120a'
  },
  server: {
    androidScheme: 'https'
  }
}

export default config
