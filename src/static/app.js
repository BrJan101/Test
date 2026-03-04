document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");

  const toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  toastContainer.style.position = "fixed";
  toastContainer.style.right = "20px";
  toastContainer.style.bottom = "20px";
  toastContainer.style.display = "flex";
  toastContainer.style.flexDirection = "column-reverse";
  toastContainer.style.gap = "10px";
  toastContainer.style.zIndex = "2147483647";
  toastContainer.style.maxWidth = "min(92vw, 380px)";
  toastContainer.style.pointerEvents = "none";
  document.body.appendChild(toastContainer);

  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.pointerEvents = "auto";
    toastContainer.prepend(toast);

    setTimeout(() => {
      toast.classList.add("toast-hiding");
      setTimeout(() => {
        toast.remove();
      }, 220);
    }, 5000);
  };

  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? `<ul class="participants-list">${details.participants
              .map((participant) => {
                const safeParticipant = escapeHtml(participant);
                const encodedParticipant = encodeURIComponent(participant);
                const encodedActivity = encodeURIComponent(name);

                return `<li class="participant-item">
                  <span class="participant-email">${safeParticipant}</span>
                  <button
                    type="button"
                    class="participant-delete"
                    data-activity="${encodedActivity}"
                    data-email="${encodedParticipant}"
                    aria-label="Unregister ${safeParticipant}"
                    title="Unregister"
                  >🗑</button>
                </li>`;
              })
              .join("")}</ul>`
          : '<p class="participants-empty">No participants yet.</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title"><strong>Participants:</strong></p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showToast(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showToast("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");

    if (!deleteButton) {
      return;
    }

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    if (!activity || !email) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${activity}/participants?email=${email}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(result.message, "unregistered");
        await fetchActivities();
      } else {
        showToast(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showToast("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
