/* ═══════════════════════════════════════════════════
   THEME MANAGER
   Manual toggle + Auto sunrise/sunset switching
═══════════════════════════════════════════════════ */

const Theme = (() => {
  const STORAGE_KEYS = {
    mode: 'msvThemeAuto',
    theme: 'msvTheme',
    coords: 'msvThemeCoords',
  };

  let autoMode = true;         // true = follow sun; false = manual
  let autoCheckTimer = null;

  function clearAutoTimer() {
    if (!autoCheckTimer) return;
    clearTimeout(autoCheckTimer);
    clearInterval(autoCheckTimer);
    autoCheckTimer = null;
  }

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  function normalizeMinutes(minutes) {
    return ((minutes % 1440) + 1440) % 1440;
  }

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function toRadians(deg) {
    return deg * Math.PI / 180;
  }

  function toDegrees(rad) {
    return rad * 180 / Math.PI;
  }

  function getSunTimes(lat, lng) {
    const date = new Date();
    const dayOfYear = getDayOfYear(date);
    const lngHour = lng / 15;
    const tzOffsetHours = -date.getTimezoneOffset() / 60;

    function calculate(isSunrise) {
      const baseHour = isSunrise ? 6 : 18;
      const t = dayOfYear + ((baseHour - lngHour) / 24);
      const M = (0.9856 * t) - 3.289;

      let L = M + (1.916 * Math.sin(toRadians(M))) + (0.020 * Math.sin(toRadians(2 * M))) + 282.634;
      L = ((L % 360) + 360) % 360;

      let RA = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(L))));
      RA = ((RA % 360) + 360) % 360;

      const Lquadrant = Math.floor(L / 90) * 90;
      const RAquadrant = Math.floor(RA / 90) * 90;
      RA = (RA + (Lquadrant - RAquadrant)) / 15;

      const sinDec = 0.39782 * Math.sin(toRadians(L));
      const cosDec = Math.cos(Math.asin(sinDec));
      const cosH =
        (Math.cos(toRadians(90.833)) - (sinDec * Math.sin(toRadians(lat)))) /
        (cosDec * Math.cos(toRadians(lat)));

      if (cosH > 1) return 720;
      if (cosH < -1) return isSunrise ? 0 : 1439;

      let H = isSunrise
        ? 360 - toDegrees(Math.acos(cosH))
        : toDegrees(Math.acos(cosH));
      H /= 15;

      const T = H + RA - (0.06571 * t) - 6.622;
      const UT = ((T - lngHour) % 24 + 24) % 24;
      return normalizeMinutes(Math.round((UT + tzOffsetHours) * 60));
    }

    return {
      sunrise: calculate(true),
      sunset: calculate(false),
    };
  }

  function isDaytime(lat, lng) {
    const { sunrise, sunset } = getSunTimes(lat, lng);
    const now = nowMinutes();

    if (sunrise === sunset) return now >= 360 && now < 1080;
    if (sunrise < sunset) return now >= sunrise && now < sunset;
    return now >= sunrise || now < sunset;
  }

  function isDarkBySystemTime() {
    const now = nowMinutes();
    return now >= 18 * 60 || now < 6 * 60;
  }

  /* ── Apply theme ── */
  function applyTheme(dark, animate = true) {
    if (!animate) document.documentElement.style.transition = 'none';
    document.body.classList.toggle('dark', dark);
    if (!animate) requestAnimationFrame(() => document.documentElement.style.transition = '');
    updateThemeToggleLabel(dark);
    
    // Refresh charts to update grid/text colors
    if (typeof DashboardCharts !== 'undefined') {
      DashboardCharts.updateTheme();
    }
  }

  function updateThemeToggleLabel(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const modeLabel = autoMode ? 'Auto sunrise/sunset mode' : 'Manual mode';
    const nextAction = autoMode
      ? 'Click to override manually. Double-click to refresh auto mode.'
      : `Click to switch manually. Double-click to return to auto ${isDark ? 'light-at-sunrise' : 'dark-at-sunset'} mode.`;

    themeToggle.title = `${modeLabel}. ${nextAction}`;
    themeToggle.setAttribute('aria-label', themeToggle.title);
  }

  function getStoredCoords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.coords);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
        return parsed;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function storeCoords(lat, lng) {
    localStorage.setItem(STORAGE_KEYS.coords, JSON.stringify({ lat, lng }));
  }

  function scheduleNextCheck(lat, lng) {
    clearAutoTimer();
    const { sunrise, sunset } = getSunTimes(lat, lng);
    const now = nowMinutes();

    let nextEvent;
    if (now < sunrise) nextEvent = sunrise;
    else if (now < sunset) nextEvent = sunset;
    else nextEvent = sunrise + 1440;

    const msUntil = Math.max(1000, (nextEvent - now) * 60 * 1000 + 5000);
    autoCheckTimer = setTimeout(() => runAutoTheme(lat, lng), msUntil);
  }

  function runAutoTheme(lat, lng) {
    if (!autoMode) return;
    if (typeof lat === 'number' && typeof lng === 'number') {
      applyTheme(!isDaytime(lat, lng));
      scheduleNextCheck(lat, lng);
      return;
    }

    applyTheme(isDarkBySystemTime());
    autoCheckTimer = setTimeout(() => runAutoTheme(), 30 * 60 * 1000);
  }

  function initAuto() {
    clearAutoTimer();
    const storedCoords = getStoredCoords();
    if (storedCoords) {
      runAutoTheme(storedCoords.lat, storedCoords.lng);
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          storeCoords(lat, lng);
          runAutoTheme(lat, lng);
        },
        () => {
          runAutoTheme();
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 3600000 }
      );
    } else {
      runAutoTheme();
    }
  }

  /* ── Badge label ── */


  /* ── Public: manual toggle ── */
  function toggleManual() {
    clearAutoTimer();
    autoMode = false;
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEYS.mode, 'false');
  }

  /* ── Public: re-enable auto on badge click ── */
  function enableAuto() {
    if (autoMode) return;
    autoMode = true;
    localStorage.removeItem(STORAGE_KEYS.theme);
    localStorage.setItem(STORAGE_KEYS.mode, 'true');
    initAuto();
  }

  /* ── Public: boot ── */
  function boot() {
    const savedAuto  = localStorage.getItem(STORAGE_KEYS.mode);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

    if (savedAuto === 'false' && savedTheme) {
      // Restore manual preference without animation flash
      autoMode = false;
      applyTheme(savedTheme === 'dark', false);

    } else {
      autoMode = true;
      updateThemeToggleLabel(document.body.classList.contains('dark'));
      initAuto();
    }
  }

  return { boot, toggleManual, enableAuto };
})();

// Global wrappers for HTML onclicks
function toggleThemeManual() { Theme.toggleManual(); }
function enableThemeAuto() { Theme.enableAuto(); }



'use strict';

/* ── State ── */
const state = {
  currentPage: 'dashboard',
  currentStep: 1,
  totalSteps: 5,
  isSmoker: false,
  personCount: 1,
  quoteFlow: 'ai', // 'ai' | 'manual'
  chatStep: 0,     // within step 2
  quoteId: null,
};

/* ── Page Navigation ── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));

  const targetPage = document.getElementById('page' + capitalize(page));
  if (targetPage) {
    targetPage.classList.add('active');
    state.currentPage = page;
  }

  const sidebarItem = document.querySelector(`[data-page="${page}"]`);
  if (sidebarItem) sidebarItem.classList.add('active');

  if (page === 'quote') {
    state.currentStep = 1;
    updateStepper();
    showStep(1);
    initQuoteChat();
  }
  if (page === 'success') {
    generateQuoteId();
    launchConfetti();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function goBack() {
  if (state.currentPage === 'quote') {
    if (state.currentStep > 1) {
      prevStep();
    } else {
      showPage('dashboard');
    }
  }
}

/* ── Sidebar Toggle ── */
function isMobile() { return window.innerWidth <= 700; }

function closeMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar.classList.remove('expanded');
  if (backdrop) backdrop.style.display = 'none';
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
  const sidebar  = document.getElementById('sidebar');
  const wrapper  = document.getElementById('mainWrapper');
  const backdrop = document.getElementById('sidebarBackdrop');
  const isExpanded = sidebar.classList.contains('expanded');

  if (isMobile()) {
    // Mobile: slide full sidebar over content with backdrop
    if (isExpanded) {
      sidebar.classList.remove('expanded');
      if (backdrop) backdrop.style.display = 'none';
    } else {
      sidebar.classList.add('expanded');
      if (backdrop) backdrop.style.display = 'block';
    }
  } else {
    // Desktop: toggle between slim (64px) and full (220px)
    if (isExpanded) {
      sidebar.classList.remove('expanded');
      wrapper.classList.remove('sidebar-expanded');
    } else {
      sidebar.classList.add('expanded');
      wrapper.classList.add('sidebar-expanded');
    }
  }
});

/* ── Step Navigation ── */
function showStep(stepNum, direction = 'forward') {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active', 'going-back'));

  const panel = document.getElementById('step' + stepNum);
  if (panel) {
    if (direction === 'back') panel.classList.add('going-back');
    panel.classList.add('active');
  }

  // Stepper update
  document.querySelectorAll('.step').forEach((el, idx) => {
    const n = idx + 1;
    el.classList.remove('active', 'done');
    if (n < stepNum) el.classList.add('done');
    else if (n === stepNum) el.classList.add('active');
  });

  document.querySelectorAll('.step-line').forEach((line, idx) => {
    line.classList.toggle('done', idx < stepNum - 1);
  });

  const info = document.getElementById('stepperInfo');
  if (info) info.textContent = `Step ${stepNum} of ${state.totalSteps}`;

  // Show/hide nav buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const stepNav = document.getElementById('stepNav');

  if (prevBtn) prevBtn.style.display = stepNum > 1 ? 'inline-flex' : 'none';

  if (nextBtn) {
    if (stepNum === 2) {
      nextBtn.style.display = 'none'; // controlled by chat
    } else if (stepNum === 5) {
      nextBtn.textContent = '✓ Generate Quote';
      nextBtn.style.display = 'inline-flex';
    } else {
      nextBtn.textContent = 'Continue →';
      nextBtn.style.display = 'inline-flex';
    }
  }

  if (stepNav) stepNav.style.display = stepNum === 6 ? 'none' : 'flex';

  if (stepNum !== 2) {
    toggleQuoteInfo(false);
  }
}

function nextStep() {
  if (state.currentStep < state.totalSteps) {
    state.currentStep++;
    updateStepper();
    showStep(state.currentStep);
    if (state.currentStep === 2) initQuoteChat();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (state.currentStep === state.totalSteps) {
    showPage('success');
  }
}

function prevStep() {
  if (state.currentStep > 1) {
    state.currentStep--;
    updateStepper();
    showStep(state.currentStep, 'back');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function skipToStep(n) {
  state.quoteFlow = 'manual';
  state.currentStep = n;
  updateStepper();
  showStep(n);
}

function updateStepper() {
  // Updated by showStep
}

function toggleQuoteInfo(forceOpen) {
  const layout = document.querySelector('#step2 .step-two-col');
  const toggle = document.querySelector('.quote-info-toggle');
  if (!layout || !toggle) return;

  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : !layout.classList.contains('info-open');

  layout.classList.toggle('info-open', shouldOpen);
  toggle.setAttribute('aria-expanded', String(shouldOpen));
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 1100) {
    toggleQuoteInfo(false);
  }

  syncAIResponsiveState();
});

/* ── Quote Chat (Step 2) ── */
const CHAT_FLOW = [
  {
    from: 'ai',
    text: "Hi! 👋 Let's find the best plan for your client. First — who is this quote for?",
    options: ['Individual', 'Couple', 'Family'],
    optionKey: 'for',
  },
  {
    from: 'ai',
    text: 'Great choice! What is the primary goal of this insurance plan?',
    options: ['💰 Savings & Wealth', '🛡️ Family Protection', '🏦 Retirement Planning', '👶 Child Future'],
    optionKey: 'goal',
  },
  {
    from: 'ai',
    text: 'And what is the approximate annual income of the applicant?',
    options: ['< ₹3 Lakh', '₹3–6 Lakh', '₹6–12 Lakh', '> ₹12 Lakh'],
    optionKey: 'income',
  },
];

let chatStepIndex = 0;
let chatAnswers = {};
let isTyping = false;

function initQuoteChat() {
  chatStepIndex = 0;
  chatAnswers = {};
  const win = document.getElementById('quoteChatWindow');
  const opts = document.getElementById('optionRow');
  if (win) win.innerHTML = '';
  if (opts) opts.innerHTML = '';

  setTimeout(() => addChatBubble('ai', CHAT_FLOW[0].text, () => showOptions(0)), 300);
}

function addChatBubble(sender, text, callback) {
  const win = document.getElementById('quoteChatWindow');
  if (!win) return;

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg ai-msg typing-bubble';
  typingEl.innerHTML = `<div class="chat-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;

  setTypingStatus('typing…');

  if (sender === 'ai') {
    win.appendChild(typingEl);
    scrollChat(win);

    setTimeout(() => {
      win.removeChild(typingEl);
      setTypingStatus('');
      const msgEl = createMessage(sender, text);
      win.appendChild(msgEl);
      scrollChat(win);
      if (callback) callback();
    }, 900 + Math.random() * 400);
  } else {
    const msgEl = createMessage(sender, text);
    win.appendChild(msgEl);
    scrollChat(win);
    if (callback) callback();
  }
}

function createMessage(sender, text) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.createElement('div');
  el.className = `chat-msg ${sender === 'ai' ? 'ai-msg' : 'user-msg'}`;
  el.innerHTML = `<div class="chat-bubble">${text}</div><span class="chat-time">${time}</span>`;
  el.style.animation = 'fadeSlideIn .25s ease';
  return el;
}

function showOptions(stepIdx) {
  const opts = document.getElementById('optionRow');
  if (!opts) return;
  opts.innerHTML = '';

  const flow = CHAT_FLOW[stepIdx];
  if (!flow) return;

  flow.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectOption(stepIdx, opt, btn);
    opts.appendChild(btn);
  });

  scrollChat(document.getElementById('quoteChatWindow'));
}

function selectOption(stepIdx, value, btn) {
  // Mark selected
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  chatAnswers[CHAT_FLOW[stepIdx].optionKey] = value;

  setTimeout(() => {
    // Clear options
    const opts = document.getElementById('optionRow');
    if (opts) opts.innerHTML = '';

    // User bubble
    addChatBubble('user', value);

    // Next AI message
    if (stepIdx + 1 < CHAT_FLOW.length) {
      setTimeout(() => {
        addChatBubble('ai', CHAT_FLOW[stepIdx + 1].text, () => showOptions(stepIdx + 1));
      }, 400);
    } else {
      // Final recommendation
      setTimeout(() => showRecommendation(), 600);
    }
  }, 250);
}

function showRecommendation() {
  const goal = chatAnswers['goal'] || '';
  let planName = 'Wealth Protection Plan';
  let planDesc = 'Comprehensive life cover with investment + protection benefits.';

  if (goal.includes('Retirement')) { planName = 'RetireSmart Plan'; planDesc = 'Build a corpus for a secure retirement with guaranteed income.'; }
  else if (goal.includes('Child')) { planName = 'ChildFirst Future Plan'; planDesc = 'Secure your child\'s education and future milestones.'; }
  else if (goal.includes('Protection')) { planName = 'FamilyShield Term Plan'; planDesc = 'Pure term life cover — highest protection at lowest cost.'; }

  // Update plan name in step 3
  const planEl = document.getElementById('planName');
  if (planEl) planEl.textContent = planName;

  const win = document.getElementById('quoteChatWindow');
  if (!win) return;

  setTypingStatus('');

  // Typing then recommend
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg ai-msg typing-bubble';
  typingEl.innerHTML = `<div class="chat-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  setTypingStatus('Analysing…');
  win.appendChild(typingEl);
  scrollChat(win);

  setTimeout(() => {
    win.removeChild(typingEl);
    setTypingStatus('');

    const rec = document.createElement('div');
    rec.className = 'chat-msg ai-msg';
    rec.style.animation = 'fadeSlideIn .3s ease';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.style.background = 'transparent';
    bubble.style.border = 'none';
    bubble.style.padding = '0';
    bubble.style.maxWidth = '340px';

    bubble.innerHTML = `
      <div class="recommendation-card">
        <div class="rec-icon">🏆</div>
        <div class="rec-body">
          <div class="rec-label">AI Recommendation</div>
          <div class="rec-name">${planName}</div>
          <div class="rec-desc">${planDesc}</div>
        </div>
      </div>
    `;
    rec.appendChild(bubble);
    win.appendChild(rec);
    scrollChat(win);

    // Action buttons
    const opts = document.getElementById('optionRow');
    if (opts) {
      opts.innerHTML = '';
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'btn-primary btn-sm';
      acceptBtn.textContent = '✓ Accept Plan';
      acceptBtn.onclick = () => {
        opts.innerHTML = '';
        addChatBubble('user', `Accepted: ${planName}`, () => {
          setTimeout(() => {
            addChatBubble('ai', "Perfect! Let's now fill in the cover details. I've pre-filled some values for you. 🚀", () => {
              setTimeout(() => advanceToStep3(), 800);
            });
          }, 400);
        });
      };

      const modifyBtn = document.createElement('button');
      modifyBtn.className = 'btn-outline btn-sm';
      modifyBtn.textContent = '✏️ Modify Plan';
      modifyBtn.onclick = () => {
        opts.innerHTML = '';
        addChatBubble('user', 'I want to choose differently', () => {
          setTimeout(() => {
            addChatBubble('ai', 'No problem! Redirecting you to plan details where you can make changes. ✏️', () => {
              setTimeout(() => advanceToStep3(), 800);
            });
          }, 400);
        });
      };

      opts.appendChild(acceptBtn);
      opts.appendChild(modifyBtn);
      scrollChat(win);
    }
  }, 1400);
}

function advanceToStep3() {
  state.currentStep = 3;
  showStep(3);
}

function setTypingStatus(text) {
  const el = document.getElementById('typingStatus');
  if (el) el.textContent = text;
}

function scrollChat(win) {
  if (!win) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      win.scrollTo({
        top: win.scrollHeight,
        behavior: 'smooth',
      });

      const lastMsg = win.lastElementChild;
      if (lastMsg) {
        lastMsg.scrollIntoView({
          block: 'end',
          behavior: 'smooth',
        });
      }
    });
  });
}

/* ── Dashboard AI Panel ── */
const AI_RESPONSES = {
  default: [
    "I noticed you have 3 hot leads today. Want me to help draft follow-up messages? 📩",
    "Based on your pipeline, you're on track for your monthly target! Keep it up 💪",
    "Priya Sharma's inquiry for a ₹1Cr term plan looks promising. Want to create a quote now?",
    "12 policies are expiring this month — should I pull up the renewal list?",
  ],
  quote: [
    "Sure! Let's create a new quote. I'll guide you through it step by step. Opening the quote flow now... 📄",
    "Starting the AI-assisted quote flow for you! Just answer a few quick questions and I'll handle the rest.",
  ],
  insights: [
    "📊 Here's a quick snapshot:\n• 47 policies sold this month (+12%)\n• Top performer: Term Life plans\n• Renewal risk: ₹3.8L (12 policies)\n• Upsell potential: 3 clients eligible for riders",
    "Your conversion rate of 68% is above the regional average of 54%. Strong work this quarter!",
  ],
  followup: [
    "📞 Priority follow-ups today:\n1. Priya Sharma — Term ₹1Cr (HOT)\n2. Vikram Singh — Term ₹2Cr (HOT)\n3. Rajesh Kumar — ULIP (WARM)\n\nWant me to draft message templates for each?",
    "I'll pull up your warm and hot leads. You have 7 leads that need a touchpoint this week.",
  ],
};

let aiResponseIndex = 0;

function aiQuickAction(type) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;

  // User message
  const messages = {
    quote: 'Create New Quote',
    insights: 'Show Insights',
    followup: 'Follow Up Leads',
  };

  appendDashChat('user', messages[type] || 'Tell me more');

  // AI typing then respond
  showDashTyping(() => {
    const responses = AI_RESPONSES[type] || AI_RESPONSES.default;
    const resp = responses[Math.floor(Math.random() * responses.length)];
    appendDashChat('ai', resp);

    if (type === 'quote') {
      setTimeout(() => showPage('quote'), 1800);
    }
  });
}

function sendAIMessage() {
  const input = document.getElementById('aiInput');
  if (!input || !input.value.trim()) return;

  const msg = input.value.trim();
  input.value = '';

  appendDashChat('user', msg);

  showDashTyping(() => {
    const responses = AI_RESPONSES.default;
    const resp = responses[aiResponseIndex % responses.length];
    aiResponseIndex++;
    appendDashChat('ai', resp);
  });
}

function appendDashChat(sender, text) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el = document.createElement('div');
  el.className = `chat-msg ${sender === 'ai' ? 'ai-msg' : 'user-msg'}`;
  el.style.animation = 'fadeSlideIn .25s ease';

  const formattedText = text.replace(/\n/g, '<br>');
  el.innerHTML = `<div class="chat-bubble">${formattedText}</div><span class="chat-time">${time}</span>`;

  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

let typingTimer = null;

function showDashTyping(callback) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;

  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg ai-msg typing-bubble';
  typingEl.id = 'dashTyping';
  typingEl.innerHTML = `<div class="chat-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatWindow.appendChild(typingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    const existing = document.getElementById('dashTyping');
    if (existing) chatWindow.removeChild(existing);
    if (callback) callback();
  }, 1000 + Math.random() * 600);
}

function toggleAI(forceOpen) {
  const panel = document.getElementById('aiPanel');
  const toggle = document.getElementById('aiPanelToggle');
  if (!panel || !toggle) return;

  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : panel.classList.contains('is-collapsed');

  panel.classList.toggle('is-collapsed', !shouldOpen);
  toggle.classList.toggle('is-hidden', shouldOpen);
  toggle.setAttribute('aria-expanded', String(shouldOpen));
}

let isCompactAIViewport = null;

function syncAIResponsiveState() {
  const panel = document.getElementById('aiPanel');
  const toggle = document.getElementById('aiPanelToggle');
  if (!panel || !toggle) return;

  const isCompact = window.innerWidth <= 1100;
  if (isCompact === isCompactAIViewport) return;

  isCompactAIViewport = isCompact;
  panel.classList.toggle('is-collapsed', isCompact);
  toggle.classList.toggle('is-hidden', !isCompact);
  toggle.setAttribute('aria-expanded', String(!isCompact));
}

/* ── Form Helpers ── */
function adjustCount(delta) {
  const el = document.getElementById('personCount');
  if (!el) return;
  let val = parseInt(el.textContent) + delta;
  val = Math.max(1, Math.min(6, val));
  el.textContent = val;
  state.personCount = val;
}

function setSmoker(isSmoker) {
  state.isSmoker = isSmoker;
  const nsBtn = document.getElementById('nonSmoker');
  const sBtn = document.getElementById('smoker');
  if (!nsBtn || !sBtn) return;

  if (isSmoker) {
    sBtn.classList.add('active');
    nsBtn.classList.remove('active');
  } else {
    nsBtn.classList.add('active');
    sBtn.classList.remove('active');
  }

  // Update premium
  const premEl = document.getElementById('premiumAmount');
  if (premEl) {
    const base = isSmoker ? '33,062' : '28,750';
    premEl.innerHTML = `₹${base} <span>/year</span>`;
  }
}

function acceptAISuggest(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = value;
    // Flash highlight
    field.style.background = '#EFF6FF';
    field.style.borderColor = 'var(--blue)';
    setTimeout(() => {
      field.style.background = '';
      field.style.borderColor = '';
    }, 1000);
  }
}

/* ── Success & Confetti ── */
function generateQuoteId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  state.quoteId = num;
  const el = document.getElementById('quoteNum');
  if (el) el.textContent = num;
}

function copyQuoteId() {
  const el = document.getElementById('quoteIdDisplay');
  if (el) {
    navigator.clipboard.writeText(el.textContent.trim()).catch(() => {});
    const btn = document.querySelector('.copy-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      btn.style.background = 'var(--green-bg)';
      btn.style.borderColor = 'var(--green)';
      btn.style.color = 'var(--green)';
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
    }
  }
}

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#E53935', '#16A34A', '#2563EB', '#D97706', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];
  const count = 80;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const duration = 3 + Math.random() * 2.5;
    const size = 6 + Math.random() * 8;
    const borderRadius = Math.random() > 0.5 ? '50%' : '2px';

    piece.style.cssText = `
      left: ${left}%;
      top: -20px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${borderRadius};
      animation-name: confettiFall;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      opacity: 0;
    `;

    container.appendChild(piece);
  }

  // Clean up after 8 seconds
  setTimeout(() => { if (container) container.innerHTML = ''; }, 8000);
}

function resetQuote() {
  showPage('quote');
}

/* ── Keyboard Shortcuts ── */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) searchInput.focus();
  }
});

/* ── Greeting & Date ── */
function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();

  let greeting;
  if (hour >= 5 && hour < 12)       greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else                               greeting = hour >= 17 ? 'Good evening' : 'Good morning';

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayName  = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const dateStr   = `${dayName}, ${now.getDate()} ${monthName} ${now.getFullYear()}`;

  const greetEl = document.getElementById('dashGreeting');
  const dateEl  = document.getElementById('dashDate');

  if (greetEl) greetEl.innerHTML = `${greeting}, John <span class="wave">👋</span>`;
  if (dateEl)  dateEl.textContent = dateStr;
}

/* ── Dashboard Charts initialization ── */
const DashboardCharts = (() => {
  let policiesChart = null;
  let revenueChart = null;

  function getThemeColors() {
    const isDark = document.body.classList.contains('dark');
    return {
      text: isDark ? '#9A9DB8' : '#6B6B67',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      red: '#E53935',
      redSoft: isDark ? 'rgba(239, 83, 80, 0.22)' : 'rgba(229, 57, 53, 0.12)',
      accent: isDark ? '#FCA5A5' : '#C62828',
      surface: isDark ? '#1A1D27' : '#FFFFFF',
      tooltip: isDark ? '#1A1D27' : '#111827'
    };
  }

  function init() {
    const colors = getThemeColors();
    const ctxDoc = document.getElementById('policiesChart');
    const ctxRev = document.getElementById('revenueChart');
    
    if (!ctxDoc || !ctxRev) return;

    // Common Axis Config
    const axisConfig = {
      grid: { color: colors.grid, borderColor: colors.grid },
      ticks: { color: colors.text, font: { family: 'DM Sans', size: 11 } }
    };

    // Policies Mixed Chart
    const policiesCtx = ctxDoc.getContext('2d');
    const policiesGradient = policiesCtx.createLinearGradient(0, 0, 0, 240);
    policiesGradient.addColorStop(0, 'rgba(229, 57, 53, 0.95)');
    policiesGradient.addColorStop(1, 'rgba(229, 57, 53, 0.35)');

    policiesChart = new Chart(ctxDoc, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            type: 'bar',
            label: 'Policies Issued',
            data: [12, 19, 15, 25, 22, 30],
            backgroundColor: policiesGradient,
            hoverBackgroundColor: colors.red,
            borderRadius: 999,
            borderSkipped: false,
            maxBarThickness: 26,
            categoryPercentage: 0.62,
            barPercentage: 0.9
          },
          {
            type: 'line',
            label: 'Momentum',
            data: [10, 14, 16, 21, 24, 28],
            borderColor: colors.accent,
            backgroundColor: colors.redSoft,
            borderWidth: 2,
            tension: 0.38,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: colors.surface,
            pointBorderColor: colors.accent,
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltip,
            titleFont: { family: 'DM Sans', weight: '600' },
            bodyFont: { family: 'DM Sans' },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: { ...axisConfig, grid: { display: false } },
          y: {
            ...axisConfig,
            beginAtZero: true,
            suggestedMax: 32,
            ticks: { ...axisConfig.ticks, stepSize: 8 }
          }
        }
      }
    });

    // Revenue Area Chart
    const gradient = ctxRev.getContext('2d').createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(229, 57, 53, 0.2)');
    gradient.addColorStop(1, 'rgba(229, 57, 53, 0.0)');

    revenueChart = new Chart(ctxRev, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: [25000, 38000, 32000, 53000, 48000, 65000],
          borderColor: colors.red,
          borderWidth: 3,
          fill: true,
          backgroundColor: gradient,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: colors.red,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1D27',
            padding: 12,
            cornerRadius: 8,
            intersect: false,
            mode: 'index',
            callbacks: {
              label: (ctx) => ` ₹${(ctx.parsed.y / 1000).toFixed(1)}k`
            }
          }
        },
        scales: {
          x: { ...axisConfig, grid: { display: false } },
          y: { 
            ...axisConfig, 
            beginAtZero: true, 
            ticks: { 
              ...axisConfig.ticks,
              callback: (val) => val >= 1000 ? (val/1000) + 'k' : val
            } 
          }
        }
      }
    });
  }

  function updateTheme() {
    const colors = getThemeColors();
    const charts = [policiesChart, revenueChart];
    
    charts.forEach(chart => {
      if (!chart) return;
      chart.options.scales.x.grid.color = colors.grid;
      chart.options.scales.x.ticks.color = colors.text;
      chart.options.scales.y.grid.color = colors.grid;
      chart.options.scales.y.ticks.color = colors.text;
      chart.options.plugins.tooltip.backgroundColor = colors.tooltip;

      if (chart === policiesChart) {
        chart.data.datasets[0].hoverBackgroundColor = colors.red;
        chart.data.datasets[1].borderColor = colors.accent;
        chart.data.datasets[1].pointBorderColor = colors.accent;
        chart.data.datasets[1].pointBackgroundColor = colors.surface;
        chart.data.datasets[1].backgroundColor = colors.redSoft;
      }

      chart.update();
    });
  }

  return { init, updateTheme };
})();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  Theme.boot(); // <--- This was missing!
  DashboardCharts.init();
  updateGreeting();
  syncAIResponsiveState();
  setInterval(updateGreeting, 60000); // Update every minute
});
