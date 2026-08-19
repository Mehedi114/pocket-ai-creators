async function researchCreator() {
    const input = document.getElementById("researchUrl");
    const value = input.value.trim();

    if (!value) {
        input.focus();
        input.style.borderColor = "#c8ff3d";

        setTimeout(() => {
            input.style.borderColor = "";
        }, 1000);

        return;
    }

    const button = document.querySelector(".research-btn");
    const originalText = button ? button.innerHTML : "";

    if (button) {
        button.disabled = true;
        button.innerHTML = "Researching...";
    }

    try {
        const response = await fetch("/api/research", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || data.message || "Research failed"
            );
        }

        let output = document.getElementById("researchResult");

        if (!output) {
            output = document.createElement("div");
            output.id = "researchResult";

            output.style.marginTop = "20px";
            output.style.padding = "20px";
            output.style.border = "1px solid #252a30";
            output.style.borderRadius = "14px";
            output.style.background = "#0d0f11";
            output.style.color = "#f3f3f3";
            output.style.whiteSpace = "pre-wrap";
            output.style.lineHeight = "1.7";

            input.parentElement.parentElement.appendChild(output);
        }

        if (typeof data.result === "string") {
            output.textContent = data.result;
        } else {
            output.textContent = JSON.stringify(
                data.result || data,
                null,
                2
            );
        }

        output.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    } catch (error) {
        console.error("Research error:", error);

        let output = document.getElementById("researchResult");

        if (!output) {
            output = document.createElement("div");
            output.id = "researchResult";

            output.style.marginTop = "20px";
            output.style.padding = "20px";
            output.style.borderRadius = "14px";
            output.style.background = "#180f0f";
            output.style.color = "#ff6b6b";
            output.style.whiteSpace = "pre-wrap";

            input.parentElement.parentElement.appendChild(output);
        }

        output.textContent =
            "Research failed: " + error.message;
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
}
