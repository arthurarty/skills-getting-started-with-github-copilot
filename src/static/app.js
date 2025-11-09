document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Helper to compute initials from an email
      function getInitials(email) {
        const name = email.split("@")[0];
        const parts = name.split(/[.\-_]/).filter(Boolean);
        const initials = parts.length
          ? parts.map(p => p[0].toUpperCase()).slice(0, 2).join("")
          : name.slice(0, 2).toUpperCase();
        return initials || "?";
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build the basic HTML for the card
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5 class="participants-heading">Participants (${details.participants.length})</h5>
            <!-- participants list will be inserted here -->
          </div>
        `;

        // Create and insert the participants list (bulleted, with avatars)
        const participantsContainer = activityCard.querySelector(".participants-section");
        if (details.participants && details.participants.length) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach(email => {
            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = getInitials(email);

            const spanEmail = document.createElement("span");
            spanEmail.className = "participant-email";
            spanEmail.textContent = email;

            li.appendChild(avatar);
            li.appendChild(spanEmail);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        } else {
          const p = document.createElement("p");
          p.className = "info";
          p.textContent = "No participants yet";
          participantsContainer.appendChild(p);
        }

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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
