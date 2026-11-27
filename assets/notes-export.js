(() => {
  const button = document.querySelector("[data-notes-export]");
  const main = document.querySelector("main");
  const title = main.querySelector("h1").textContent.trim();

  function markdown(node, base, headingOffset = 0) {
    if (node.nodeType === Node.TEXT_NODE) return node.data.replace(/\s+/g, " ");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const tag = node.localName;
    if (node.matches("nav, .note-label, [hidden], script, style")) return "";
    const render = child => markdown(child, base, headingOffset);
    const children = () => Array.from(node.childNodes, render).join("").trim();
    if (/^h[1-6]$/.test(tag)) {
      return `\n\n${"#".repeat(Math.min(6, Number(tag[1]) + headingOffset))} ${children()}\n\n`;
    }
    switch (tag) {
      case "br": return "  \n";
      case "p": case "figcaption": return `\n\n${children()}\n\n`;
      case "b": case "strong": return `**${children()}**`;
      case "i": case "em": return `*${children()}*`;
      case "sub": return `_(${children()})`;
      case "sup": return `^(${children()})`;
      case "code": return `\`${children()}\``;
      case "a": return `[${children()}](<${new URL(node.getAttribute("href"), base).href}>)`;
      case "math": {
        const tex = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent.trim();
        if (!tex) return children();
        return node.getAttribute("display") === "block" ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`;
      }
      case "annotation": return "";
      case "svg": {
        const description = ["title", "desc"].map(name => node.querySelector(name)?.textContent.trim()).filter(Boolean);
        return description.length ? `\n\n${description.join(" — ")}\n\n` : "";
      }
      case "summary": return `\n\n**${children()}**\n\n`;
      case "ul": case "ol": {
        const start = Number(node.getAttribute("start") || 1);
        const lines = Array.from(node.children, (item, index) => {
          const marker = tag === "ol" ? `${start + index}. ` : "- ";
          return marker + render(item).trim().replaceAll("\n", "\n" + " ".repeat(marker.length));
        });
        return `\n\n${lines.join("\n")}\n\n`;
      }
      case "table": {
        const rows = Array.from(node.rows, row => Array.from(row.cells, cell => render(cell).trim()
          .replaceAll("|", "\\|").replaceAll("\n", " ")));
        if (!rows.length) return "";
        rows.splice(1, 0, rows[0].map(() => "---"));
        return `\n\n${rows.map(row => `| ${row.join(" | ")} |`).join("\n")}\n\n`;
      }
      default: return Array.from(node.childNodes, render).join("");
    }
  }

  async function exportSections() {
    const topics = Array.from(main.querySelectorAll("section.topic"));
    if (topics.length) return topics.map(topic => markdown(topic, location.href));

    const urls = new Set(Array.from(main.querySelectorAll("a.subject-row[href]"), link => link.href));
    return Promise.all(Array.from(urls, async url => {
      if (new URL(url).origin !== location.origin) throw new Error("External lesson");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Lesson unavailable");
      const document = new DOMParser().parseFromString(await response.text(), "text/html");
      const lesson = document.querySelector("main article");
      if (!lesson?.querySelector("h1")) throw new Error("Lesson content missing");
      return markdown(lesson, response.url, 1);
    }));
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    main.querySelector(".notes-export-error")?.remove();
    try {
      const sections = await exportSections();
      if (!sections.length) throw new Error("No notes found");
      const content = [`# ${title}`, ...sections].map(section => section.trim())
        .join("\n\n").replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n") + "\n";
      const url = URL.createObjectURL(new Blob([content], {type: "text/markdown;charset=utf-8"}));
      const link = document.createElement("a");
      link.href = url;
      link.download = button.dataset.notesExport;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const error = document.createElement("p");
      error.className = "lead notes-export-error";
      error.lang = "de";
      error.setAttribute("role", "alert");
      error.textContent = "Die Notizen konnten nicht exportiert werden.";
      button.parentElement.after(error);
    } finally {
      button.disabled = false;
    }
  });
  button.hidden = false;
})();
