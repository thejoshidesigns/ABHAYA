import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AbhayaLovable" },
      { name: "description", content: "AbhayaLovable — a fresh start." },
      { property: "og:title", content: "AbhayaLovable" },
      { property: "og:description", content: "AbhayaLovable — a fresh start." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">AbhayaLovable</h1>
        <p className="mt-2 text-muted-foreground">Your project is ready for editing.</p>
      </div>
    </div>
  );
}

