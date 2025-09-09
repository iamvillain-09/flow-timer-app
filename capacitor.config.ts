import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.flowtimer.app",   // ✅ valid Java-style ID
  appName: "Flow Timer",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  plugins: {
    App: {
      backgroundMode: true
    },
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#488AFF"
    }
  }
};

export default config;
