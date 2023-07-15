// vite.config.ts
import react from "file:///Users/jem/dojo/apps/wayforge/.yarn/__virtual__/@vitejs-plugin-react-virtual-73c910e4ab/0/cache/@vitejs-plugin-react-npm-4.0.3-2ffd12f539-dd9136aec8.zip/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/jem/dojo/apps/wayforge/.yarn/__virtual__/vite-virtual-3cdd5bea7c/0/cache/vite-npm-4.4.3-8b95dab3e5-2f7c90de35.zip/node_modules/vite/dist/node/index.js";
import svgrPlugin from "file:///Users/jem/dojo/apps/wayforge/.yarn/__virtual__/vite-plugin-svgr-virtual-ab30147a39/0/cache/vite-plugin-svgr-npm-3.2.0-b314906d2d-19887e1db9.zip/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///Users/jem/dojo/apps/wayforge/.yarn/__virtual__/vite-tsconfig-paths-virtual-50ef85065a/0/cache/vite-tsconfig-paths-npm-4.2.0-af5eeb1a7e-73a8467de7.zip/node_modules/vite-tsconfig-paths/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
      babel: {
        plugins: [`@emotion/babel-plugin`]
      }
    }),
    tsconfigPaths(),
    svgrPlugin({
      svgrOptions: {
        icon: true
        // ...svgr options (https://react-svgr.com/docs/options/)
      }
    })
  ],
  esbuild: {
    define: {
      this: `window`
    }
  },
  test: {
    globals: true,
    environment: `happy-dom`,
    css: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamVtL2Rvam8vYXBwcy93YXlmb3JnZS9hcHBzL3dlYi9zbWl0aHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qZW0vZG9qby9hcHBzL3dheWZvcmdlL2FwcHMvd2ViL3NtaXRoeS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvamVtL2Rvam8vYXBwcy93YXlmb3JnZS9hcHBzL3dlYi9zbWl0aHkvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCJcbmltcG9ydCBzdmdyUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCJcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHBsdWdpbnM6IFtcblx0XHRyZWFjdCh7XG5cdFx0XHRqc3hJbXBvcnRTb3VyY2U6IGBAZW1vdGlvbi9yZWFjdGAsXG5cdFx0XHRiYWJlbDoge1xuXHRcdFx0XHRwbHVnaW5zOiBbYEBlbW90aW9uL2JhYmVsLXBsdWdpbmBdLFxuXHRcdFx0fSxcblx0XHR9KSxcblx0XHR0c2NvbmZpZ1BhdGhzKCksXG5cdFx0c3ZnclBsdWdpbih7XG5cdFx0XHRzdmdyT3B0aW9uczoge1xuXHRcdFx0XHRpY29uOiB0cnVlLFxuXHRcdFx0XHQvLyAuLi5zdmdyIG9wdGlvbnMgKGh0dHBzOi8vcmVhY3Qtc3Znci5jb20vZG9jcy9vcHRpb25zLylcblx0XHRcdH0sXG5cdFx0fSksXG5cdF0sXG5cblx0ZXNidWlsZDoge1xuXHRcdGRlZmluZToge1xuXHRcdFx0dGhpczogYHdpbmRvd2AsXG5cdFx0fSxcblx0fSxcblxuXHR0ZXN0OiB7XG5cdFx0Z2xvYmFsczogdHJ1ZSxcblx0XHRlbnZpcm9ubWVudDogYGhhcHB5LWRvbWAsXG5cdFx0Y3NzOiBmYWxzZSxcblx0fSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sbUJBQW1CO0FBRzFCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLE1BQU07QUFBQSxNQUNMLGlCQUFpQjtBQUFBLE1BQ2pCLE9BQU87QUFBQSxRQUNOLFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxNQUNsQztBQUFBLElBQ0QsQ0FBQztBQUFBLElBQ0QsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLE1BQ1YsYUFBYTtBQUFBLFFBQ1osTUFBTTtBQUFBO0FBQUEsTUFFUDtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNSLFFBQVE7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNQO0FBQUEsRUFDRDtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLEVBQ047QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
