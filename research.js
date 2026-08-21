/**
 * Creator Research — ইউটিউব চ্যানেল বিশ্লেষণ
 * index.html-এর ডিজাইন সিস্টেম ব্যবহার করে ফলাফল দেখায়।
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
        button.innerHTML = "Researching…";
    }

    const box = ensureResultBox(input);

    box.classList.add("show");
    box.innerHTML =
        '<div style="color:var(--lime)"><span class="spin"></span>' +
        'চ্যানেলটি বিশ্লেষণ করা হচ্ছে… এতে কিছুটা সময় লাগে</div>';

    try {
        const response = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: value })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Research failed");
        }

        const channel = data.channel || {};

        const stat = (label, raw) => {
            const number = Number(raw || 0);
            return (
                '<div style="flex:1;min-width:96px">' +
                '<div style="font-family:\'Space Grotesk\';font-size:17px;font-weight:700;color:var(--lime)">' +
                number.toLocaleString() +
                "</div>" +
                '<div style="font-size:10px;color:var(--dim);margin-top:2px">' +
                label +
                "</div></div>"
            );
        };

        const header = channel.title
            ? '<div style="display:flex;flex-wrap:wrap;gap:14px;padding-bottom:14px;' +
              'margin-bottom:14px;border-bottom:1px solid var(--line)">' +
              '<div style="width:100%;font-family:\'Space Grotesk\';font-size:15px;font-weight:600">' +
              escapeResearch(channel.title) +
              "</div>" +
              stat("সাবস্ক্রাইবার", channel.subscribers) +
              stat("মোট ভিউ", channel.totalViews) +
              stat("ভিডিও", channel.totalVideos) +
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
            '<div class="controls" style="margin-top:12px">' +
            '<button class="mini" onclick="copyText(this,\'researchText\')">⧉ কপি</button>' +
            "</div>" +
            engine;

        box.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        console.error("Research error:", error);

        box.innerHTML =
            '<div style="color:var(--coral)">✕ ' +
            escapeResearch(error.message) +
            "</div>";

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
