const frequencyButtons = document.querySelectorAll(".toggle");
const amountButtons = document.querySelectorAll(".amount");
const stepElements = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
];
const dots = [
  document.querySelector(".step-dot"),
  document.getElementById("dot2"),
  document.getElementById("dot3"),
];

const customAmountInput = document.getElementById("customAmount");
const causeSelect = document.getElementById("cause");
const emailInput = document.getElementById("email");
const updatesInput = document.getElementById("updates");
const cardNumberInput = document.getElementById("cardNumber");
const expiryInput = document.getElementById("expiry");
const cvcInput = document.getElementById("cvc");

const impactText = document.getElementById("impactText");
const summaryText = document.getElementById("summaryText");
const confirmText = document.getElementById("confirmText");
const stepLabel = document.getElementById("stepLabel");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const doneBtn = document.getElementById("doneBtn");
const gratitudeModal = document.getElementById("gratitudeModal");
const toast = document.getElementById("toast");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let selectedFrequency = "one-time";
let selectedAmount = 25;
let currentStep = 1;

function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString("en-US")}`;
}

function getImpactCopy(amount, cause) {
  if (cause === "School Meals") {
    return `School meals for ${Math.max(1, Math.round(amount / 3))} students this week.`;
  }
  if (cause === "Teacher Training") {
    return `${Math.max(
      1,
      Math.round(amount / 40)
    )} teacher workshop resources funded this month.`;
  }
  if (cause === "Digital Access") {
    return `${Math.max(
      1,
      Math.round(amount / 25)
    )} shared learning-device days supported.`;
  }
  return `${Math.max(1, Math.round(amount / 5))} learning kits for students.`;
}

function syncAmountButtons(amount) {
  amountButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.amount) === amount);
  });
}

function updateImpactAndSummary() {
  const cause = causeSelect.value;
  impactText.textContent = getImpactCopy(selectedAmount, cause);
  summaryText.textContent = `${formatCurrency(
    selectedAmount
  )} ${selectedFrequency} for ${cause}`;
}

function updateStepUI() {
  stepElements.forEach((step, index) => {
    step.classList.toggle("active", index + 1 === currentStep);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index + 1 <= currentStep);
  });

  stepLabel.textContent = `Step ${currentStep} of 3`;
  backBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === 3 ? "Complete Donation" : "Continue";
}

function validateCurrentStep() {
  if (currentStep === 1) {
    if (!selectedAmount || selectedAmount < 1) {
      showToast("Choose a valid donation amount.");
      return false;
    }
  }

  if (currentStep === 2) {
    const email = emailInput.value.trim();
    if (!email || !email.includes("@")) {
      showToast("Enter a valid email to continue.");
      return false;
    }
  }

  if (currentStep === 3) {
    if (cardNumberInput.value.replace(/\s+/g, "").length < 12) {
      showToast("Enter a valid card number.");
      return false;
    }
    if (expiryInput.value.trim().length < 4) {
      showToast("Enter card expiry.");
      return false;
    }
    if (cvcInput.value.trim().length < 3) {
      showToast("Enter card CVC.");
      return false;
    }
  }

  return true;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function launchCelebrationBurst(originButton) {
  const rect = originButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const layer = document.createElement("div");
  const colors = [
    "#ffd84a",
    "#06a63f",
    "#5c7cff",
    "#ffffff",
    "#ff9b52",
    "#7c5cff",
    "#3fd5a5",
  ];
  const particleCount = 56;

  layer.className = "burst-layer";
  document.body.appendChild(layer);

  function createWave(count, distanceMin, distanceMax, delayBase) {
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("span");
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.42;
      const distance = distanceMin + Math.random() * (distanceMax - distanceMin);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 20;
      const size = 14 + Math.random() * 18;
      const rotation = (Math.random() - 0.5) * 520;

      particle.className = "burst-star";
      particle.textContent = Math.random() > 0.4 ? "✦" : "✶";
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.fontSize = `${size}px`;
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      layer.appendChild(particle);

      particle.animate(
        [
          { transform: "translate(-50%, -50%) scale(0.55)", opacity: 0 },
          {
            transform: "translate(-50%, -50%) scale(1.14)",
            opacity: 1,
            offset: 0.18,
          },
          {
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg) scale(0.78)`,
            opacity: 0,
          },
        ],
        {
          duration: 900 + Math.random() * 560,
          delay: delayBase + Math.random() * 90,
          easing: "cubic-bezier(0.12, 0.86, 0.22, 1)",
          fill: "forwards",
        }
      );
    }
  }

  createWave(particleCount, 110, 230, 0);
  createWave(26, 80, 170, 220);

  setTimeout(() => {
    layer.remove();
  }, 2200);
}

function openGratitudeModal() {
  gratitudeModal.classList.add("show");
  gratitudeModal.setAttribute("aria-hidden", "false");
}

function launchConfettiRain() {
  const layer = document.createElement("div");
  const colors = [
    "#ffd84a",
    "#06a63f",
    "#5c7cff",
    "#ff9b52",
    "#7c5cff",
    "#3fd5a5",
    "#ffffff",
  ];
  const count = 130;

  layer.className = "burst-layer";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    const width = 6 + Math.random() * 6;
    const height = 10 + Math.random() * 12;
    const left = Math.random() * 100;
    const delay = Math.random() * 750;
    const duration = 1600 + Math.random() * 1200;

    piece.className = "confetti-piece";
    piece.style.left = `${left}vw`;
    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animation = `confettiFall ${duration}ms cubic-bezier(0.16, 0.84, 0.32, 1) ${delay}ms forwards`;
    layer.appendChild(piece);
  }

  setTimeout(() => {
    layer.remove();
  }, 3100);
}

frequencyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    frequencyButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    selectedFrequency = button.dataset.frequency;
    updateImpactAndSummary();
  });
});

amountButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedAmount = Number(button.dataset.amount);
    customAmountInput.value = selectedAmount;
    syncAmountButtons(selectedAmount);
    updateImpactAndSummary();
  });
});

customAmountInput.addEventListener("input", () => {
  const value = Number(customAmountInput.value);
  selectedAmount = value > 0 ? value : 1;
  syncAmountButtons(selectedAmount);
  updateImpactAndSummary();
});

causeSelect.addEventListener("change", updateImpactAndSummary);

backBtn.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep -= 1;
    updateStepUI();
  }
});

nextBtn.addEventListener("click", () => {
  if (!validateCurrentStep()) return;

  if (currentStep < 3) {
    currentStep += 1;
    updateStepUI();
    return;
  }

  const updatesMessage = updatesInput.checked
    ? "Impact updates are enabled."
    : "You can opt into impact updates anytime.";
  confirmText.textContent = `You donated ${formatCurrency(
    selectedAmount
  )} ${selectedFrequency} for ${
    causeSelect.value
  }. A receipt has been sent to ${emailInput.value.trim()}. ${updatesMessage}`;

  if (reducedMotion.matches) {
    openGratitudeModal();
    return;
  }

  nextBtn.disabled = true;
  nextBtn.classList.add("btn-celebrate");
  launchCelebrationBurst(nextBtn);
  setTimeout(() => {
    launchConfettiRain();
  }, 200);

  setTimeout(() => {
    nextBtn.classList.remove("btn-celebrate");
    openGratitudeModal();
    nextBtn.disabled = false;
  }, 1700);
});

doneBtn.addEventListener("click", () => {
  gratitudeModal.classList.remove("show");
  gratitudeModal.setAttribute("aria-hidden", "true");
  showToast("Donation completed. Thank you for making an impact.");
});

updateImpactAndSummary();
updateStepUI();
