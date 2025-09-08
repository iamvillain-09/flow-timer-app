import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5a7a5b803c5340a4933989b2e910411b',
  appName: 'Screen Time Tracker',
  webDir: 'dist',
  server: {
    url: 'https://5a7a5b80-3c53-40a4-9339-89b2e910411b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    App: {
      backgroundMode: true
    }
  }
};

export default config;