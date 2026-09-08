"use client";

import { type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CatalogMediaControl } from "@/components/dashboard/CatalogMediaControl";

export type Item = Record<string, string | number | null | undefined>;

export function CatalogPanel({
  resource,
  storeId,
  items,
  mutate,
  onChanged,
  onError,
}: {
  resource: "products" | "services" | "offers";
  storeId: string;
  items: Item[];
  mutate: (path: string, method: string, json: unknown, message: string) => Promise<void>;
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const media = formData.getAll("media").filter((value): value is File => value instanceof File && value.size > 0);
    formData.delete("media");
    const values = Object.fromEntries(formData);
    if (resource === "offers") {
      await mutate("/api/owner/catalog", "POST", { ...values, resource, storeId }, "Offer added");
      form.reset();
      return;
    }
    onError("");
    let itemId = "";
    try {
      const created = await apiFetch<{ id: string }>("/api/owner/catalog", {
        method: "POST",
        json: { ...values, resource, storeId },
      });
      itemId = created.id;
      for (const [index, file] of media.entries()) {
        const upload = new FormData();
        upload.set("ownerType", resource === "products" ? "product" : "service");
        upload.set("itemId", itemId);
        upload.set("storeId", storeId);
        upload.set("altText", String(values.name ?? resource.slice(0, -1)));
        upload.set("featured", index === 0 && file.type.startsWith("image/") ? "true" : "false");
        upload.set("file", file);
        await apiFetch("/api/catalog-media", { method: "POST", body: upload });
      }
      form.reset();
      await onChanged(`${resource === "products" ? "Product" : "Service"}${media.length ? ` with ${media.length} media item${media.length === 1 ? "" : "s"}` : ""} added`);
    } catch (error) {
      if (itemId) await onChanged(`${resource === "products" ? "Product" : "Service"} added; some media needs attention`);
      onError(itemId ? `The item was saved, but media upload stopped: ${error instanceof Error ? error.message : "Upload failed."}` : error instanceof Error ? error.message : "Item could not be added.");
    }
  }

  function edit(item: Item) {
    const currentName = String(item.name ?? item.title ?? "");
    const name = window.prompt(resource === "offers" ? "Offer title" : "Name", currentName);
    if (!name) return;
    const description = window.prompt("Description", String(item.description ?? "")) ?? String(item.description ?? "");
    const common = { resource, storeId, id: item.id, description, status: item.status ?? "active" };
    if (resource === "offers") void mutate("/api/owner/catalog", "PATCH", { ...common, title: name, code: item.code ?? "" }, "Offer updated");
    else if (resource === "products") void mutate("/api/owner/catalog", "PATCH", { ...common, name, price: item.price ?? "" }, "Product updated");
    else void mutate("/api/owner/catalog", "PATCH", { ...common, name, priceFrom: item.price_from ?? item.priceFrom ?? "", durationMinutes: item.duration_minutes ?? item.durationMinutes ?? "" }, "Service updated");
  }

  return (
    <div className="portalGrid">
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Add {resource.slice(0, -1)}</h2>
        </div>
        <form className="portalForm" onSubmit={submit}>
          {resource === "offers" ? (
            <>
              <label className="full">
                Offer title<input name="title" required />
              </label>
              <label>
                Offer code<input name="code" />
              </label>
            </>
          ) : (
            <>
              <label className="full">
                Name<input name="name" required />
              </label>
              <label>
                {resource === "products" ? "Price" : "Starting price"}
                <input name={resource === "products" ? "price" : "priceFrom"} type="number" min="0" step=".01" />
              </label>
              {resource === "services" && (
                <label>
                  Duration (minutes)<input name="durationMinutes" type="number" min="1" />
                </label>
              )}
            </>
          )}
          <label className="full">
            Description<textarea name="description" />
          </label>
          {resource !== "offers" && (
            <label className="full">
              Images and videos <small>Optional · choose multiple · images 8 MB, videos 40 MB each</small>
              <input name="media" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" />
            </label>
          )}
          <div className="formActions">
            <button className="portalButton" type="submit">Add to store</button>
          </div>
        </form>
      </section>
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Current {resource}</h2>
          <small>{items.length} items</small>
        </div>
        {items.map((item) => (
          <div className={`catalogLine ${resource !== "offers" ? "catalogProductLine" : ""}`} key={String(item.id)}>
            <p>
              <b>{item.name ?? item.title}</b>
              <small>{item.description}</small>
            </p>
            <span>{item.price ?? item.price_from ?? item.priceFrom ? `₹${item.price ?? item.price_from ?? item.priceFrom}` : item.code ?? ""}</span>
            {resource !== "offers" && (
              <CatalogMediaControl ownerType={resource === "products" ? "product" : "service"} itemId={String(item.id)} storeId={storeId} itemName={String(item.name ?? resource.slice(0, -1))} onChanged={onChanged} />
            )}
            <div className="tableActions">
              <button onClick={() => edit(item)}>Edit</button>
              <button onClick={() => void mutate("/api/owner/catalog", "DELETE", { resource, storeId, id: item.id }, "Item deleted")}>Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
