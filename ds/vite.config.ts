import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // O jogo é publicado sob um subdiretório (site/ds nas GitHub Pages);
  // caminhos relativos mantêm os assets funcionando em qualquer base.
  base: "./",
  plugins: [react()],
});
