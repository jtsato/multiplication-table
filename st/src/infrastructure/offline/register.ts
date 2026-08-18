export type ServiceWorkerLike = {
  state?: string;
  addEventListener?: (type: string, listener: () => void) => void;
};

export type ServiceWorkerRegistrationLike = {
  waiting?: ServiceWorkerLike | null;
  installing?: ServiceWorkerLike | null;
  addEventListener?: (type: string, listener: () => void) => void;
};

export type ServiceWorkerRegistrar = {
  controller?: ServiceWorkerLike | null;
  register: (
    scriptURL: string,
    options: { updateViaCache: "none" },
  ) => Promise<ServiceWorkerRegistrationLike>;
};

export async function registerServiceWorker(
  registrar?: ServiceWorkerRegistrar,
  onUpdate?: () => void,
): Promise<void> {
  if (!registrar) return;
  const registration = await registrar.register("/sw.js", { updateViaCache: "none" });
  if (registration.waiting) {
    onUpdate?.();
    return;
  }

  registration.addEventListener?.("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener?.("statechange", () => {
      if (worker.state === "installed" && registrar.controller) onUpdate?.();
    });
  });
}
