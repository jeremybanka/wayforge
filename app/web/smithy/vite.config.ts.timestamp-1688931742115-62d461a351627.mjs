// vite.config.ts
import react from "file:///Users/jem/dojo/apps/wayforge/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/jem/dojo/apps/wayforge/node_modules/vite/dist/node/index.js";
import svgrPlugin from "file:///Users/jem/dojo/apps/wayforge/node_modules/vite-plugin-svgr/dist/index.js";
import tsconfigPaths from "file:///Users/jem/dojo/apps/wayforge/node_modules/vite-tsconfig-paths/dist/index.mjs";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvamVtL2Rvam8vYXBwcy93YXlmb3JnZS9hcHAvd2ViL3NtaXRoeVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2plbS9kb2pvL2FwcHMvd2F5Zm9yZ2UvYXBwL3dlYi9zbWl0aHkvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2plbS9kb2pvL2FwcHMvd2F5Zm9yZ2UvYXBwL3dlYi9zbWl0aHkvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCJcbmltcG9ydCBzdmdyUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCJcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCh7XG4gICAgICBqc3hJbXBvcnRTb3VyY2U6IGBAZW1vdGlvbi9yZWFjdGAsXG4gICAgICBiYWJlbDoge1xuICAgICAgICBwbHVnaW5zOiBbYEBlbW90aW9uL2JhYmVsLXBsdWdpbmBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICB0c2NvbmZpZ1BhdGhzKCksXG4gICAgc3ZnclBsdWdpbih7XG4gICAgICBzdmdyT3B0aW9uczoge1xuICAgICAgICBpY29uOiB0cnVlLFxuICAgICAgICAvLyAuLi5zdmdyIG9wdGlvbnMgKGh0dHBzOi8vcmVhY3Qtc3Znci5jb20vZG9jcy9vcHRpb25zLylcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG5cbiAgZXNidWlsZDoge1xuICAgIGRlZmluZToge1xuICAgICAgdGhpczogYHdpbmRvd2AsXG4gICAgfSxcbiAgfSxcblxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogYGhhcHB5LWRvbWAsXG4gICAgY3NzOiBmYWxzZSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sbUJBQW1CO0FBRzFCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLGlCQUFpQjtBQUFBLE1BQ2pCLE9BQU87QUFBQSxRQUNMLFNBQVMsQ0FBQyx1QkFBdUI7QUFBQSxNQUNuQztBQUFBLElBQ0YsQ0FBQztBQUFBLElBQ0QsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLE1BQ1QsYUFBYTtBQUFBLFFBQ1gsTUFBTTtBQUFBO0FBQUEsTUFFUjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUFBLEVBRUEsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLEVBQ1A7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
