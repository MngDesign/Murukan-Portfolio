// Donation data records details
const donationsData = {
  "TXN-98402": {
    date: "June 12, 2026",
    amount: "$100.00",
    cause: "Books & Supplies",
    impact: "20 school learning kits and writing notebooks delivered"
  },
  "TXN-73412": {
    date: "May 18, 2026",
    amount: "$50.00",
    cause: "School Meals",
    impact: "16 nutritious school lunches for mid-day programs"
  },
  "TXN-56214": {
    date: "April 25, 2026",
    amount: "$25.00",
    cause: "Teacher Training",
    impact: "1 certified workshop resource guide for primary instructors"
  },
  "TXN-43189": {
    date: "March 25, 2026",
    amount: "$25.00",
    cause: "Teacher Training",
    impact: "Classroom teaching aids, lesson plan folders, and whiteboard materials"
  },
  "TXN-32901": {
    date: "February 25, 2026",
    amount: "$25.00",
    cause: "Teacher Training",
    impact: "1 primary teacher workbook and classroom organizer binder"
  }
};

// Modal Elements
const receiptModal = document.getElementById("receiptModal");
const closeReceiptBtn = document.getElementById("closeReceiptBtn");
const downloadReceiptBtn = document.getElementById("downloadReceiptBtn");
const toast = document.getElementById("toast");

// Receipt Details DOM Nodes
const receiptTxn = document.getElementById("receiptTxn");
const receiptDate = document.getElementById("receiptDate");
const receiptAmount = document.getElementById("receiptAmount");
const receiptCause = document.getElementById("receiptCause");
const receiptImpact = document.getElementById("receiptImpact");

// Filters Elements
const filterButtons = document.querySelectorAll(".filter-btn");
const recordsRows = document.querySelectorAll("#recordsBody tr");

// Open Receipt Modal
function openReceipt(txnId) {
  const data = donationsData[txnId];
  if (!data) return;

  receiptTxn.textContent = txnId;
  receiptDate.textContent = data.date;
  receiptAmount.textContent = data.amount;
  receiptCause.textContent = data.cause;
  receiptImpact.textContent = data.impact;

  receiptModal.classList.add("show");
  receiptModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Prevent background scroll
}

// Close Receipt Modal
function closeReceipt() {
  receiptModal.classList.remove("show");
  receiptModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; // Re-enable scroll
}

// Show toast helper
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Attach Event Listeners to View Receipt Buttons
document.querySelectorAll(".view-receipt-btn").forEach(button => {
  button.addEventListener("click", (e) => {
    const txnId = e.currentTarget.dataset.id;
    openReceipt(txnId);
  });
});

// Modal close button
closeReceiptBtn.addEventListener("click", closeReceipt);

// Close on background click
receiptModal.addEventListener("click", (e) => {
  if (e.target === receiptModal) {
    closeReceipt();
  }
});

// Escape key listener to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && receiptModal.classList.contains("show")) {
    closeReceipt();
  }
});

// Download receipt mock action
downloadReceiptBtn.addEventListener("click", () => {
  const txnId = receiptTxn.textContent;
  showToast(`Downloading Tax Receipt & Certificate (${txnId}.pdf)...`);
  
  // Fake download delay
  downloadReceiptBtn.disabled = true;
  const originalText = downloadReceiptBtn.textContent;
  downloadReceiptBtn.textContent = "Generating...";
  
  setTimeout(() => {
    downloadReceiptBtn.disabled = false;
    downloadReceiptBtn.textContent = originalText;
    showToast("Receipt download completed successfully!");
  }, 1500);
});

// Interactive Filtering
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Update active class on filter buttons
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;

    // Show/Hide Rows based on filter type
    recordsRows.forEach(row => {
      const causeAttr = row.dataset.cause;
      if (filter === "all" || causeAttr === filter) {
        row.style.display = ""; // default display
        row.style.opacity = "0";
        // Simple animation to fade in filtered rows
        setTimeout(() => {
          row.style.transition = "opacity 200ms ease";
          row.style.opacity = "1";
        }, 10);
      } else {
        row.style.display = "none";
      }
    });
  });
});
