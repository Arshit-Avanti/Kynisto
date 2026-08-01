// Polyfill WeakRef globally for environments lacking it (like Cloudflare workerd)
if (typeof (globalThis as any).WeakRef === "undefined") {
  (globalThis as any).WeakRef = class WeakRef<T extends object> {
    private value: T;
    constructor(value: T) {
      this.value = value;
    }
    deref(): T | undefined {
      return this.value;
    }
  };
}
