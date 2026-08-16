export type ServiceWorkerRegistrar = {
  register: (scriptURL: string, options: { updateViaCache: "none" }) => Promise<unknown>;
};

export async function registerServiceWorker(registrar?: ServiceWorkerRegistrar): Promise<void> {
  if (!registrar) return;
  await registrar.register("/sw.js", { updateViaCache: "none" });
}
