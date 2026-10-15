import fs from "node:fs";
import path from "node:path";

const rel = "frontend/src/pages/Admin.jsx";
const full = path.join(process.cwd(), rel);

if (!fs.existsSync(full)) {
  console.error(`Missing required file: ${rel}`);
  process.exit(1);
}

let source = fs.readFileSync(full, "utf8");

if (!source.includes("const NewsletterManager =")) {
  console.error("Could not locate NewsletterManager in frontend/src/pages/Admin.jsx");
  process.exit(1);
}

if (!source.includes("const handleNewsletterBodyKeyDown")) {
  const marker = `  const startNew = () => {`;

  const handler = `  const handleNewsletterBodyKeyDown = (event) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;

    event.preventDefault();
    event.stopPropagation();

    const textarea = event.currentTarget;
    const currentBody = String(form.body || "");
    const start = textarea.selectionStart ?? currentBody.length;
    const end = textarea.selectionEnd ?? start;

    if (currentBody.length >= 12000 && start === end) return;

    const nextBody = (
      currentBody.slice(0, start) +
      "\\n" +
      currentBody.slice(end)
    ).slice(0, 12000);

    setForm((current) => ({
      ...current,
      body: nextBody,
    }));

    const nextCursorPosition = Math.min(start + 1, nextBody.length);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        nextCursorPosition,
        nextCursorPosition,
      );
    });
  };

`;

  if (!source.includes(marker)) {
    console.error("Could not locate NewsletterManager startNew() insertion point.");
    process.exit(1);
  }

  source = source.replace(marker, handler + marker);
}

const textareaMarker = `              <textarea
                rows={14}
                value={form.body || ""}
                onChange={(event) => setForm({ ...form, body: event.target.value })}`;

if (source.includes(textareaMarker) && !source.includes("onKeyDownCapture={handleNewsletterBodyKeyDown}")) {
  source = source.replace(
    textareaMarker,
    `              <textarea
                rows={14}
                value={form.body || ""}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                onKeyDownCapture={handleNewsletterBodyKeyDown}`
  );
} else if (!source.includes("onKeyDownCapture={handleNewsletterBodyKeyDown}")) {
  console.error("Could not locate the Newsletter Issue body textarea.");
  process.exit(1);
}

fs.writeFileSync(full, source, "utf8");

console.log(`updated ${rel}`);
console.log("");
console.log("Newsletter Issue body Enter-key fix applied.");
console.log("Run:");
console.log("  cd frontend");
console.log("  yarn build");
