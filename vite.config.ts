import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  /*
   * 相対パスで出力する。
   * GitHub Pages は https://<ユーザー名>.github.io/<リポジトリ名>/ のように
   * サブディレクトリで配信されるため、既定の '/' だと /assets/... を見に行って
   * 404 になり、画面が真っ白になる。'./' にしておけばリポジトリ名が変わっても、
   * どの階層に置いても動く。
   */
  base: './',
  plugins: [react(), tailwindcss()],
})
