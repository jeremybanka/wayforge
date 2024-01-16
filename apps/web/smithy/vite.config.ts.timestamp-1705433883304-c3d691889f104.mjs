// vite.config.ts
import react from "file:///Users/jem/dojo/apps/wayforge/node_modules/.pnpm/@vitejs+plugin-react@4.2.1_vite@5.0.11/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/jem/dojo/apps/wayforge/node_modules/.pnpm/vite@5.0.11_sass@1.69.7/node_modules/vite/dist/node/index.js";
import svgrPlugin from "file:///Users/jem/dojo/apps/wayforge/node_modules/.pnpm/vite-plugin-svgr@4.2.0_typescript@5.3.3_vite@5.0.11/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///Users/jem/dojo/apps/wayforge/node_modules/.pnpm/vite-tsconfig-paths@4.3.0_typescript@5.3.3_vite@5.0.11/node_modules/vite-tsconfig-paths/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamVtL2Rvam8vYXBwcy93YXlmb3JnZS9hcHBzL3dlYi9zbWl0aHlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qZW0vZG9qby9hcHBzL3dheWZvcmdlL2FwcHMvd2ViL3NtaXRoeS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvamVtL2Rvam8vYXBwcy93YXlmb3JnZS9hcHBzL3dlYi9zbWl0aHkvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCJcbmltcG9ydCBzdmdyUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCJcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHBsdWdpbnM6IFtcblx0XHRyZWFjdCgpLFxuXHRcdHRzY29uZmlnUGF0aHMoKSxcblx0XHRzdmdyUGx1Z2luKHtcblx0XHRcdHN2Z3JPcHRpb25zOiB7XG5cdFx0XHRcdGljb246IHRydWUsXG5cdFx0XHRcdC8vIC4uLnN2Z3Igb3B0aW9ucyAoaHR0cHM6Ly9yZWFjdC1zdmdyLmNvbS9kb2NzL29wdGlvbnMvKVxuXHRcdFx0fSxcblx0XHR9KSxcblx0XSxcblxuXHRlc2J1aWxkOiB7XG5cdFx0ZGVmaW5lOiB7XG5cdFx0XHR0aGlzOiBgd2luZG93YCxcblx0XHR9LFxuXHR9LFxuXG5cdHRlc3Q6IHtcblx0XHRnbG9iYWxzOiB0cnVlLFxuXHRcdGVudmlyb25tZW50OiBgaGFwcHktZG9tYCxcblx0XHRjc3M6IGZhbHNlLFxuXHR9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxtQkFBbUI7QUFHMUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1IsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLE1BQ1YsYUFBYTtBQUFBLFFBQ1osTUFBTTtBQUFBO0FBQUEsTUFFUDtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNSLFFBQVE7QUFBQSxNQUNQLE1BQU07QUFBQSxJQUNQO0FBQUEsRUFDRDtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLEVBQ047QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
