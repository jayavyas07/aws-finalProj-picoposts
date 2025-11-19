
const API_BASE = "http://13.56.79.179";

// Simple helper for API calls
async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("API error", res.status, text);
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
}

function showJson(obj) {
    const box = document.getElementById("feed-json");
    box.innerHTML = "";
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(obj, null, 2);
    box.appendChild(pre);
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("PicoPosts frontend loaded");

    const emailInput = document.getElementById("email");
    const userIdInput = document.getElementById("user-id");
    const contentInput = document.getElementById("content");
    const feedUserIdInput = document.getElementById("feed-user-id");

    const signupBtn = document.getElementById("signup-btn");
    const postBtn = document.getElementById("post-btn");
    const feedBtn = document.getElementById("feed-btn");

    // SIGN UP
    signupBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();
        if (!email) {
            alert("Enter an email first");
            return;
        }

        try {
            const data = await api("/api/users", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            console.log("Create user response", data);
            userIdInput.value = data.userId;
            feedUserIdInput.value = data.userId;
            alert(`User created. User ID:\n${data.userId}`);
        } catch (err) {
            console.error("Create user failed", err);
            alert("Error creating user. See console.");
        }
    });

    // CREATE POST
    postBtn.addEventListener("click", async () => {
        const userId = userIdInput.value.trim();
        const content = contentInput.value.trim();

        if (!userId || !content) {
            alert("User ID and content are required.");
            return;
        }

        try {
            const data = await api("/api/posts", {
                method: "POST",
                body: JSON.stringify({ userId, content }),
            });
            console.log("Create post response", data);
            alert("Post saved! Now load the feed.");
        } catch (err) {
            console.error("Create post failed", err);
            alert("Error creating post. See console.");
        }
    });

    // LOAD FEED
    feedBtn.addEventListener("click", async () => {
        const userId = feedUserIdInput.value.trim();
        if (!userId) {
            alert("Enter the user ID whose feed you want to see.");
            return;
        }

        try {
            const data = await api(`/api/feed?userId=${encodeURIComponent(userId)}`);
            console.log("Feed response", data);
            showJson(data);
        } catch (err) {
            console.error("Load feed failed", err);
            alert("Error loading feed. See console.");
        }
    });
});
