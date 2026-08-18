import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { I18nProvider } from "./shared/i18n/I18nProvider";
// Tipografia do sistema de design: Cinzel Decorative (títulos) + Inter (corpo).
// Apenas o subset `latin`: os idiomas suportados (pt-BR, en-US) cabem nele, e os
// demais subsets (latin-ext, cyrillic, greek, vietnamese) somavam ~665KB de
// fontes nunca baixadas.
import "@fontsource/cinzel-decorative/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./shared/styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
