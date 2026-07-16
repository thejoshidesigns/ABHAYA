import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abhaya" },
      { name: "description", content: "Abhaya — live site preview." },
    ],
  }),
  component: LiveSite,
});

function LiveSite() {
  return (
    <iframe
      src="https://thejoshidesigns.github.io/ABHAYA/"
      title="Abhaya live site"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
      }}
    />
  );
}
