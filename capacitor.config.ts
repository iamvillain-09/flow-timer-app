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
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  }
};

export default config;
