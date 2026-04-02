// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // ✅ Tell Electron-Vite not to bundle express
        // input: {
        //   index: resolve(__dirname, 'src/main/index.ts')
        // },
        external: ["express"]
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // input: {
        //   index: resolve(__dirname, 'src/preload/index.ts')
        // }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [react()]
  }
});
export {
  electron_vite_config_default as default
};
