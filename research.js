/**
 * Creator Research — YouTube channel analysis.
 * Renders into the design system defined in index.html.
 */

async function researchCreator() {
    const input = document.getElementById("researchUrl");
    const value = input.value.trim();

    if (!value) {
        input.focus();
        return;
    }

    const button = document.querySelector(".research-btn");
    const originalText = button ? button.innerHTML : "";

    if (button) {
        button.disabled = true;
        button.innerHTML = "Researching\u2026";
    }

    const box = ensureResultBox(input);

    box.classList.add("show");
    box.innerHTML =
        '<div style="color:var(--gold)"><span class="spin"></span>' +
        "Reading the channel \u2014 this one takes a moment</div>";

    try {
        const response = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: value })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Research failed.");
        }

        const channel = data.channel || {};

        const stat = (label, raw) =>
            '<div style="flex:1;min-width:104px">' +
            '<div class="serif" style="font-size:22px;color:var(--gold)">' +
            Number(raw || 0).toLocaleString() +
            "</div>" +
            '<div class="label" style="margin-top:5px">' + label + "</div>" +
            "</div>";

        const header = channel.title
            ? '<div style="display:flex;flex-wrap:wrap;gap:18px;padding-bottom:20px;' +
              'margin-bottom:20px;border-bottom:1px solid var(--hair)">' +
              '<div class="serif" style="width:100%;font-size:19px;color:var(--bone)">' +
              escapeResearch(channel.title) + "</div>" +
              stat("Subscribers", channel.subscribers) +
              stat("Total views", channel.totalViews) +
              stat("Videos", channel.totalVideos) +
              "</div>"
            : "";

        const engine =
            typeof renderEngineBadge === "function"
                ? renderEngineBadge(data.engine)
                : "";

        box.innerHTML =
            header +
            '<div class="body-text" id="researchText">' +
            escapeResearch(data.result || "") +
            "</div>" +
            '<div class="controls" style="margin-top:16px">' +
            '<button class="mini" onclick="copyText(this,\'researchText\')">Copy</button>' +
            "</div>" +
            engine;

        box.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        console.error("Research error:", error);

        box.innerHTML =
            '<div style="color:var(--rose)">' + escapeResearch(error.message) + "</div>";

        if (typeof toast === "function") toast(error.message, "err");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}

function ensureResultBox(input) {
    let box = document.getElementById("researchResult");

    if (!box) {
        box = document.createElement("div");
        box.id = "researchResult";
        box.className = "out";
        input.closest(".research").appendChild(box);
    }

    return box;
}

function escapeResearch(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
}

window.researchCreator = researchCreator;
