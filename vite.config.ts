import path from 'path'
import { defineConfig, splitVendorChunkPlugin, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer';
import { cdn } from "vite-plugin-cdn2";
import { defineResolve, type HTMLTagDescriptor } from 'vite-plugin-cdn2/resolve'
// import { cdnjs } from 'vite-plugin-cdn2/resolver/cdnjs'
import externalGlobals from 'rollup-plugin-external-globals';
import { minify } from 'html-minifier-terser';

const isProduction = process.env.NODE_ENV === "production";

function myHtmlMinify(): Plugin {
  return {
    name: 'custom-html-minify',
    apply: 'build',
    async transformIndexHtml(html) {
      return await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      });
    },
  };
}

export function myCdnjs(options: HTMLTagDescriptor = {}) {
  const { injectTo = 'head-prepend', attrs = {} } = options
  const baseURL = 'https://cdnjs.cloudflare.com/ajax/libs/'
  return defineResolve({
    name: 'resolve:cdnjs',
    setup({ extra }) {
      const { version, name, relativeModule } = extra
      let baseName = path.basename(relativeModule)
      if (name.startsWith("react")) {
        baseName = "umd/" + baseName
      }
      const url = new URL(`${name}/${version}/${baseName}`, baseURL)
      return {
        url: url.href,
        injectTo,
        attrs: { ...attrs }
      }
    }
  })
}

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
  // if (id.includes("antd")) {
  //   console.log(id)
  // }
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
          { name: 'antd', relativeModule: './dist/antd.min.js', global: "antd", aliases: ['es'] },
        ],
        apply: command,
        resolve: myCdnjs(),
      } : {}),
      visualizer({ template: "treemap" }),
      myHtmlMinify(),
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
