import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import { cdn } from "vite-plugin-cdn2";
// import { cdnjs } from 'vite-plugin-cdn2/resolver/cdnjs'
import externalGlobals from 'rollup-plugin-external-globals';
import { createHtmlPlugin } from 'vite-plugin-html'

const isProduction = process.env.NODE_ENV === "production";

// 手动引入
const globals = externalGlobals((id: string) => {
  {
    const lodashs = id.split("lodash.")
    if (lodashs.length == 2) {
      return "_." + lodashs[1]
    }
  }
  {
    const lodashs = id.split("lodash/")
    if (lodashs.length == 2 && !id.includes("?")) {
      return "_." + lodashs[1]
    }
  }
  if (id.includes("lodash")) {
    // console.log(id)
    return "_";
  }
  if (id == "@ant-design/charts") {
    return "Charts"
  }
});

export default defineConfig(({ command }) => {
  return {
    base: "./", // 相对路径
    plugins: [
      react(),
      // splitVendorChunkPlugin(),
      cdn(isProduction ? { // 自动引入
        modules: [
          { name: 'dayjs', relativeModule: './dayjs.min.js' }, // antd 依赖，要放前面
          { name: 'react', relativeModule: './umd/react.production.min.js', },
          { name: 'react-dom', relativeModule: './umd/react-dom.production.min.js', aliases: ['client'] },
          // { name: '@remix-run/router' }, // react-router-dom 的依赖
          // { name: 'react-router' }, // react-router-dom 的依赖
          // { name: 'react-router-dom', relativeModule: './dist/umd/react-router-dom.production.min.js', global: "ReactRouterDOM" },
          { name: 'antd', relativeModule: './dist/antd.min.js', global: "antd", aliases: ['es', 'lib'] },
          // { name: '@ant-design/pro-components', relativeModule: './dist/pro-components.min.js', global: "ProComponents" }, // TODO 主题 BUG
        ],
        apply: command,
        // resolve: cdnjs(), // TODO 这个有点小 BUG
      } : {}),
      visualizer({ template: "treemap" }),
      createHtmlPlugin({
        minify: true,
      }),
    ],
    build: {
      reportCompressedSize: false,
      rollupOptions: {
        plugins: isProduction ? [
          globals,
        ] : []
      }
    }
  }
})
