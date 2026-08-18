import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerServiceWorker } from "./infrastructure/offline/register";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void registerServiceWorker(navigator.serviceWorker, () => {
    window.dispatchEvent(new Event("lojinha-update-available"));
  });
}
