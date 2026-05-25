const SUPABASE_URL = "https://rzytgxadqhrccqydvtes.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_okYCEha7aBddt5wEbJo5bQ_mz-WJ4CE";

let clientsupabase = null;
let pdfjsLibPromise = null;

const $ = (id) => document.getElementById(id);

const ui = {};

function cacheUi() {
  ui.authSection = $("authSection");
  ui.appSection = $("appSection");
  ui.loginForm = $("loginForm");
  ui.authEmail = $("authEmail");
  ui.authPassword = $("authPassword");
  ui.authStatus = $("authStatus");
  ui.signupBtn = $("signupBtn");
  ui.loginBtn = $("loginBtn");
  ui.logoutBtn = $("logoutBtn");
  ui.userInfo = $("userInfo");
  ui.sourceText = $("sourceText");
  ui.charCount = $("charCount");
  ui.pdfInput = $("pdfInput");
  ui.pdfStatus = $("pdfStatus");
  ui.generateBtn = $("generateBtn");
  ui.generateStatus = $("generateStatus");
  ui.decksContainer = $("decksContainer");
  ui.deckTitle = $("deckTitle");
  ui.studySection = $("studySection");
  ui.studyDeckTitle = $("studyDeckTitle");
  ui.studyMeta = $("studyMeta");
  ui.studyProgress = $("studyProgress");
  ui.modeFlipBtn = $("modeFlipBtn");
  ui.modeQuizBtn = $("modeQuizBtn");
  ui.modeMcqBtn = $("modeMcqBtn");
  ui.weakModeBtn = $("weakModeBtn");
  ui.shuffleBtn = $("shuffleBtn");
  ui.prevBtn = $("prevBtn");
  ui.nextBtn = $("nextBtn");
  ui.flipModeView = $("flipModeView");
  ui.quizModeView = $("quizModeView");
  ui.mcqModeView = $("mcqModeView");
  ui.flipCard = $("flipCard");
  ui.flipQuestion = $("flipQuestion");
  ui.flipAnswer = $("flipAnswer");
  ui.quizQuestion = $("quizQuestion");
  ui.quizInput = $("quizInput");
  ui.checkAnswerBtn = $("checkAnswerBtn");
  ui.showAnswerBtn = $("showAnswerBtn");
  ui.quizFeedback = $("quizFeedback");
  ui.quizCorrectAnswer = $("quizCorrectAnswer");
  ui.mcqQuestion = $("mcqQuestion");
  ui.mcqOptions = $("mcqOptions");
  ui.mcqFeedback = $("mcqFeedback");
  ui.mcqCorrectAnswer = $("mcqCorrectAnswer");
}

function authUserFromData(data) {
  return data?.session?.user ?? data?.user ?? null;
}

const LIBRARY_DECKS = [
  {
    id: "lib-ielts-vocabulary",
    title: "IELTS Core Vocabulary",
    category: "IELTS",
    cards: [
      { question: "What does 'Abundant' mean?", answer: "Existing or available in large quantities; plentiful." },
      { question: "What does 'Ambiguous' mean?", answer: "Open to more than one interpretation; not clear." },
      { question: "What does 'Coherent' mean?", answer: "Logical and consistent; clearly expressed." },
      { question: "What does 'Comprehensive' mean?", answer: "Complete; including all or nearly all elements." },
      { question: "What does 'Controversial' mean?", answer: "Giving rise to public disagreement." },
      { question: "What does 'Deteriorate' mean?", answer: "Become progressively worse." },
      { question: "What does 'Elaborate' mean?", answer: "Involving many carefully arranged parts; detailed." },
      { question: "What does 'Fluctuate' mean?", answer: "Rise and fall irregularly in number or amount." },
      { question: "What does 'Inevitable' mean?", answer: "Certain to happen; unavoidable." },
      { question: "What does 'Substantial' mean?", answer: "Of considerable importance, size, or worth." },
      { question: "What does 'Ambivalent' mean?", answer: "Having mixed feelings about something." },
      { question: "What does 'Predominantly' mean?", answer: "Mainly; for the most part." },
      { question: "What does 'Superficial' mean?", answer: "Existing or occurring at the surface level; shallow." },
      { question: "What does 'Tedious' mean?", answer: "Too long, slow, or dull; boring." },
      { question: "What does 'Volatile' mean?", answer: "Liable to change rapidly and unpredictably." }
    ]
  },
  {
    id: "lib-ielts-writing",
    title: "IELTS Writing Task 2 Phrases",
    category: "IELTS",
    cards: [
      { question: "How do you introduce an essay opinion?", answer: "In my opinion, / It is my contention that / I would argue that..." },
      { question: "How do you add a point?", answer: "Furthermore, / Moreover, / In addition to this..." },
      { question: "How do you show contrast?", answer: "However, / On the other hand, / Nevertheless..." },
      { question: "How do you give an example?", answer: "For instance, / For example, / To illustrate this..." },
      { question: "How do you conclude?", answer: "In conclusion, / To summarise, / Overall, it is clear that..." },
      { question: "How do you show cause?", answer: "This is due to / As a result of / This stems from..." },
      { question: "How do you show effect?", answer: "Consequently, / As a result, / Therefore..." },
      { question: "How do you concede a point?", answer: "Admittedly, / It is true that / While it may be argued that..." },
      { question: "How do you emphasise a point?", answer: "It is worth noting that / Significantly, / Above all..." },
      { question: "How do you introduce a counterargument?", answer: "Some people believe that / It could be argued that / Opponents claim..." },
      { question: "How do you show frequency?", answer: "Increasingly, / In many cases, / More often than not..." },
      { question: "How do you generalise?", answer: "In general, / On the whole, / By and large..." },
      { question: "How do you refer to data?", answer: "According to recent statistics, / Research suggests that / Studies indicate..." },
      { question: "How do you show possibility?", answer: "It is possible that / This may lead to / There is a chance that..." },
      { question: "How do you write a thesis statement?", answer: "This essay will examine... / This paper argues that... / The following points will demonstrate..." }
    ]
  },
  {
    id: "lib-sat-math",
    title: "SAT Math Formulas",
    category: "SAT",
    cards: [
      { question: "Area of a circle?", answer: "A = πr²" },
      { question: "Circumference of a circle?", answer: "C = 2πr" },
      { question: "Area of a triangle?", answer: "A = ½ × base × height" },
      { question: "Pythagorean theorem?", answer: "a² + b² = c²" },
      { question: "Slope formula?", answer: "m = (y₂ - y₁) / (x₂ - x₁)" },
      { question: "Slope-intercept form?", answer: "y = mx + b" },
      { question: "Quadratic formula?", answer: "x = (-b ± √(b²-4ac)) / 2a" },
      { question: "Area of a rectangle?", answer: "A = length × width" },
      { question: "Volume of a cylinder?", answer: "V = πr²h" },
      { question: "Distance formula?", answer: "d = √((x₂-x₁)² + (y₂-y₁)²)" },
      { question: "Percent change formula?", answer: "((New - Old) / Old) × 100" },
      { question: "Simple interest formula?", answer: "I = P × r × t" },
      { question: "Volume of a cone?", answer: "V = ⅓πr²h" },
      { question: "Sum of interior angles of a polygon?", answer: "(n - 2) × 180°" },
      { question: "Probability formula?", answer: "P = favorable outcomes / total outcomes" }
    ]
  },
  {
    id: "lib-sat-vocabulary",
    title: "SAT High-Frequency Vocabulary",
    category: "SAT",
    cards: [
      { question: "What does 'Aberrant' mean?", answer: "Departing from an accepted standard; abnormal." },
      { question: "What does 'Acrimony' mean?", answer: "Bitterness or ill feeling." },
      { question: "What does 'Adulterate' mean?", answer: "Render something poorer by adding inferior substances." },
      { question: "What does 'Anachronism' mean?", answer: "Something out of its proper time period." },
      { question: "What does 'Antipathy' mean?", answer: "A deep-seated feeling of dislike." },
      { question: "What does 'Arcane' mean?", answer: "Understood by few; mysterious or secret." },
      { question: "What does 'Audacious' mean?", answer: "Showing willingness to take surprisingly bold risks." },
      { question: "What does 'Austere' mean?", answer: "Severe or strict in manner; having no comforts." },
      { question: "What does 'Banal' mean?", answer: "So lacking in originality as to be obvious and boring." },
      { question: "What does 'Benevolent' mean?", answer: "Well meaning and kindly." },
      { question: "What does 'Candor' mean?", answer: "The quality of being open and honest." },
      { question: "What does 'Capricious' mean?", answer: "Given to sudden changes of mood or behavior." },
      { question: "What does 'Dearth' mean?", answer: "A scarcity or lack of something." },
      { question: "What does 'Eloquent' mean?", answer: "Fluent or persuasive in speaking or writing." },
      { question: "What does 'Ephemeral' mean?", answer: "Lasting for a very short time." }
    ]
  },
  {
    id: "lib-ielts-speaking",
    title: "IELTS Speaking Part 2 Topics",
    category: "IELTS",
    cards: [
      { question: "How do you describe a person you admire?", answer: "Mention who they are, what they do, why you admire them, and how they influenced you." },
      { question: "How do you describe a memorable trip?", answer: "Cover where you went, who you went with, what you did, and why it was memorable." },
      { question: "How do you describe a book or film?", answer: "Mention the title, genre, plot summary, and why you would recommend it." },
      { question: "How do you describe a skill you want to learn?", answer: "Name the skill, explain why you want to learn it, and how you plan to learn it." },
      { question: "How do you describe your hometown?", answer: "Describe its location, size, main features, and what you like or dislike about it." },
      { question: "How do you describe a tradition or festival?", answer: "Name it, explain when and how it is celebrated, and why it is important." },
      { question: "How do you describe a challenge you overcame?", answer: "Describe the situation, the difficulty, what you did, and what you learned." },
      { question: "How do you describe a piece of technology you use?", answer: "Name it, describe what it does, how often you use it, and why it is useful." },
      { question: "How do you describe your dream job?", answer: "Name the job, explain the responsibilities, why it appeals to you, and what skills it requires." },
      { question: "How do you describe a time you helped someone?", answer: "Explain the situation, what help was needed, what you did, and the outcome." },
      { question: "How do you describe a goal you have?", answer: "State the goal, explain why it matters to you, and describe your plan to achieve it." },
      { question: "How do you describe a change in your life?", answer: "Describe what changed, when it happened, why it changed, and how it affected you." },
      { question: "How do you describe a place you want to visit?", answer: "Name the place, describe what it is known for, why you want to go, and what you would do there." },
      { question: "How do you describe something you made by hand?", answer: "Describe what it was, how you made it, how long it took, and why you made it." },
      { question: "How do you describe a subject you enjoy studying?", answer: "Name the subject, explain what it covers, why you enjoy it, and how it is useful." }
    ]
  }
];

const state = {
  user: null,
  extractedPdfText: "",
  decks: [],
  currentDeck: null,
  currentMode: "flip",
  currentIndex: 0,
  weakOnly: false,
  weakIndexes: new Set(),
  shuffledIndexes: null
};

function on(el, eventName, handler) {
  if (el) el.addEventListener(eventName, handler);
}

function setStatus(el, message = "", type = "") {
  if (!el) return;
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
async function handleMagicLink() {
  const client = ensureAuthClient();
  if (!client) return;

  const email = ui.authEmail?.value.trim() || "";
  if (!email) {
    setStatus(ui.authStatus, "Enter your email first.", "error");
    return;
  }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });

  if (error) {
    setStatus(ui.authStatus, `Failed: ${error.message}`, "error");
  } else {
    setStatus(ui.authStatus, "Magic link sent! Check your email.", "success");
  }
}

function isAnswerCorrect(userAnswer, expectedAnswer) {
  const userNorm = normalizeText(userAnswer);
  const expectedNorm = normalizeText(expectedAnswer);
  if (!userNorm || !expectedNorm) return false;
  if (userNorm === expectedNorm) return true;
  if (expectedNorm.includes(userNorm) && userNorm.length > 6) return true;
  return false;
}

function stripJsonFence(text) {
  const cleaned = text.trim();
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : cleaned;
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await getPdfJsLib();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    text += `${pageText}\n`;
  }
  return text.trim();
}

function getSupabaseClient() {
  if (clientsupabase) return clientsupabase;
  if (!window.supabase?.createClient) return null;

  clientsupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return clientsupabase;
}

function ensureAuthClient() {
  const client = getSupabaseClient();
  if (!client) {
    setStatus(
      ui.authStatus,
      "Authentication failed to initialize. Refresh the page and try again.",
      "error"
    );
    return null;
  }
  return client;
}

async function getPdfJsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.min.mjs")
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs";
        return lib;
      });
  }
  return pdfjsLibPromise;
}

async function saveDeckToSupabase(title, cards, sourceText) {
  const user = state.user;
  if (!user) throw new Error("You must be logged in.");
  const client = ensureAuthClient();
  if (!client) throw new Error("Authentication client unavailable.");

  const payload = {
    user_id: user.id,
    title: title?.trim() || `Deck ${new Date().toLocaleString()}`,
    cards,
    source_text: sourceText || ""
  };

  const { error } = await client.from("decks").insert(payload);
  if (error) throw error;
}

async function loadUserDecks() {
  if (!state.user) return;
  const client = ensureAuthClient();
  if (!client) return;

  const { data, error } = await client
    .from("decks")
    .select("id,title,cards,created_at,last_studied")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(ui.generateStatus, `Could not load decks: ${error.message}`, "error");
    return;
  }

  state.decks = data || [];
  const used = state.decks.length;
  const limitText = document.getElementById("deckLimitText");
  const limitFill = document.getElementById("deckLimitFill");
  if (limitText) limitText.textContent = `${used} of 10 free decks used`;
  if (limitFill) limitFill.style.width = `${Math.min((used / 10) * 100, 100)}%`;
  if (limitFill) limitFill.style.background = used >= 8 ? "#FF4757" : used >= 5 ? "#FFA502" : "#6C63FF";
  renderDecks();
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printDeckAsPdf(deck) {
  const title = escapeHtml(deck.title || "Untitled Deck");
  const date = new Date().toLocaleDateString();
  const cards = Array.isArray(deck.cards) ? deck.cards : [];

  const cardsHtml = cards.map((card) => `
    <div class="card-box">
      <div class="q-label">Question</div>
      <p class="q-text">${escapeHtml(card.question)}</p>
      <div class="a-label">Answer</div>
      <p class="a-text">${escapeHtml(card.answer)}</p>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: #fff;
      color: #111;
      margin: 0;
      padding: 40px;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111;
      border-bottom: 3px solid #6C63FF;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .card-box {
      border-left: 4px solid #6C63FF;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 14px;
      background: #fafafa;
      page-break-inside: avoid;
    }
    .q-label, .a-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 4px;
    }
    .q-label { color: #6C63FF; }
    .a-label { color: #999; margin-top: 10px; }
    .q-text { color: #111; font-size: 1rem; font-weight: 600; margin: 0; }
    .a-text { color: #444; font-size: 0.95rem; margin: 0; }
    .footer {
      text-align: center;
      font-size: 0.78rem;
      color: #bbb;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    @media print {
      @page { margin: 24px; }
      body { margin: 0; padding: 24px; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${cardsHtml}
  <div class="footer">Generated by Kix · ${escapeHtml(date)}</div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 600);

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);
}

function renderDecks() {
  ui.decksContainer.innerHTML = "";
  if (!state.decks.length) {
    ui.decksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No decks yet</p>
        <span>Generate your first deck to get started</span>
      </div>`;
    return;
  }

  state.decks.forEach((deck) => {
    const wrap = document.createElement("article");
    wrap.className = "deck-item";
    const count = Array.isArray(deck.cards) ? deck.cards.length : 0;
    const lastStudied = deck.last_studied ? `Last studied: ${new Date(deck.last_studied).toLocaleDateString()}` : "Not studied yet";
    wrap.innerHTML = `
      <div>
        <h3>${deck.title || "Untitled Deck"}</h3>
        <div class="meta">${count} cards</div>
        <div class="meta">${lastStudied}</div>
      </div>
      <div class="meta">${new Date(deck.created_at).toLocaleString()}</div>
      <div class="actions actions-tight">
        <button class="btn-primary open-deck-btn" data-id="${deck.id}">Open Deck</button>
        <button class="btn-soft share-deck-btn" data-id="${deck.id}">Share</button>
        <button class="btn-ghost save-pdf-btn" data-id="${deck.id}">Save as PDF</button>
        <button class="btn-ghost rename-deck-btn" data-id="${deck.id}" data-title="${deck.title}">Rename</button>
        <button class="btn-danger delete-deck-btn" data-id="${deck.id}">Delete</button>
      </div>
    `;
    ui.decksContainer.appendChild(wrap);
  });

  document.querySelectorAll(".open-deck-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const deck = state.decks.find((d) => String(d.id) === btn.dataset.id);
      if (deck) startStudy(deck);
    });
  });

  document.querySelectorAll(".share-deck-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const deck = state.decks.find((d) => String(d.id) === btn.dataset.id);
      if (!deck) return;
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ title: deck.title, cards: deck.cards }))));
      const url = `${window.location.origin}${window.location.pathname}?deck=${encodeURIComponent(encoded)}`;
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = "Link Copied!";
        setTimeout(() => { btn.textContent = "Share"; }, 2000);
      } catch {
        try {
          const textarea = document.createElement("textarea");
          textarea.value = url;
          textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          btn.textContent = "Link Copied!";
          setTimeout(() => { btn.textContent = "Share"; }, 2000);
        } catch {
          btn.textContent = "Copy failed!";
          setTimeout(() => { btn.textContent = "Share"; }, 2000);
        }
      }
    });
  });

  document.querySelectorAll(".save-pdf-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const deck = state.decks.find((d) => String(d.id) === btn.dataset.id);
      if (deck) printDeckAsPdf(deck);
    });
  });

  document.querySelectorAll(".delete-deck-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this deck? This cannot be undone.")) return;
      const client = ensureAuthClient();
      if (!client) return;
      const { error } = await client.from("decks").delete().eq("id", btn.dataset.id);
      if (error) { alert("Failed to delete deck."); return; }
      await loadUserDecks();
    });
  });

  document.querySelectorAll(".rename-deck-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const newTitle = prompt("Enter new deck title:", btn.dataset.title);
      if (!newTitle || !newTitle.trim()) return;
      const client = ensureAuthClient();
      if (!client) return;
      const { error } = await client.from("decks").update({ title: newTitle.trim() }).eq("id", btn.dataset.id);
      if (error) { alert("Failed to rename deck."); return; }
      await loadUserDecks();
    });
  });
}

function showSharedDeckBanner() {
  let banner = document.getElementById("sharedDeckBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "sharedDeckBanner";
    banner.className = "status";
    banner.setAttribute("role", "status");
    banner.textContent = "You're viewing a shared deck. Log in to save it to your library.";
    ui.studySection?.parentNode?.insertBefore(banner, ui.studySection);
  }
}

function handleSharedDeckFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("deck");
    if (!encoded) return;

    const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))));
    if (!decoded?.cards || !Array.isArray(decoded.cards)) return;

    window.history.replaceState({}, "", window.location.pathname);

    const deck = {
      id: `shared-${Date.now()}`,
      title: decoded.title || "Shared Deck",
      cards: decoded.cards,
      created_at: new Date().toISOString()
    };

    ui.authSection?.classList.add("hidden");
    ui.appSection?.classList.remove("hidden");
    showSharedDeckBanner();
    startStudy(deck);
  } catch {
    // invalid share link — load app normally
  }
}

function getActiveIndexes() {
  if (!state.currentDeck) return [];
  const all = state.shuffledIndexes || state.currentDeck.cards.map((_, idx) => idx);
  if (!state.weakOnly || state.weakIndexes.size === 0) return all;
  return all.filter((idx) => state.weakIndexes.has(idx));
}

function shuffleDeck() {
  const active = state.currentDeck.cards.map((_, i) => i);
  for (let i = active.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [active[i], active[j]] = [active[j], active[i]];
  }
  state.shuffledIndexes = active;
  state.currentIndex = 0;
  ui.flipCard.classList.remove("is-flipped");
  renderStudyCard();
}

function startStudy(deck) {
  state.currentDeck = deck;
  state.currentIndex = 0;
  state.currentMode = "flip";
  state.weakOnly = false;
  state.weakIndexes = new Set();
  state.shuffledIndexes = null;
  ui.studyDeckTitle.textContent = deck.title || "Study Deck";
  ui.studySection.classList.remove("hidden");
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const hint = document.getElementById("keyboardHint");
  if (hint) hint.style.display = isTouch ? "none" : "flex";
  const client = ensureAuthClient();
  if (client && deck.id && !String(deck.id).startsWith("local-")) {
    client.from("decks").update({ last_studied: new Date().toISOString() }).eq("id", deck.id);
  }
  switchMode("flip");
  renderStudyCard();
  setTimeout(() => {
    ui.studySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

function switchMode(mode) {
  state.currentMode = mode;
  const isFlip = mode === "flip";
  const isQuiz = mode === "quiz";
  const isMcq = mode === "mcq";

  ui.flipModeView.classList.toggle("hidden", !isFlip);
  ui.quizModeView.classList.toggle("hidden", !isQuiz);
  ui.mcqModeView.classList.toggle("hidden", !isMcq);

  ui.modeFlipBtn.className = isFlip ? "btn-primary" : "btn-soft";
  ui.modeQuizBtn.className = isQuiz ? "btn-primary" : "btn-soft";
  ui.modeMcqBtn.className = isMcq ? "btn-primary" : "btn-soft";

  if (ui.quizFeedback) ui.quizFeedback.textContent = "";
  if (ui.quizCorrectAnswer) ui.quizCorrectAnswer.textContent = "";
  if (ui.quizInput) ui.quizInput.value = "";
  if (ui.flipCard) ui.flipCard.classList.remove("is-flipped");

  renderStudyCard();
}

function moveCard(step) {
  const active = getActiveIndexes();
  if (!active.length) return;
  ui.flipCard.classList.remove("is-flipped");

  const outClass = step > 0 ? "slide-out-left" : "slide-out-right";
  const inClass  = step > 0 ? "slide-in-right" : "slide-in-left";

  ui.flipCard.classList.add(outClass);

  setTimeout(() => {
    ui.flipCard.classList.remove(outClass);
    state.currentIndex = (state.currentIndex + step + active.length) % active.length;
    ui.quizFeedback.textContent = "";
    ui.quizCorrectAnswer.textContent = "";
    ui.quizInput.value = "";
    renderStudyCard();
    ui.flipCard.classList.add(inClass);
    setTimeout(() => {
      ui.flipCard.classList.remove(inClass);
    }, 180);
  }, 180);
}

function renderStudyCard() {
  if (!state.currentDeck || !Array.isArray(state.currentDeck.cards)) return;
  const active = getActiveIndexes();
  if (!active.length) {
    ui.studyMeta.textContent = "No weak cards yet. Get some wrong answers in quiz mode first.";
    ui.flipQuestion.textContent = "No cards to show.";
    ui.flipAnswer.textContent = "";
    ui.quizQuestion.textContent = "No cards to show.";
    ui.studyProgress.textContent = "0 / 0";
    return;
  }

  if (state.currentIndex >= active.length && active.length > 0) {
    const total = active.length;
    const weak = state.weakIndexes.size;
    const correct = total - weak;
    ui.flipQuestion.textContent = `🎉 Deck Complete! ${correct}/${total} correct`;
    ui.flipAnswer.textContent = weak > 0 ? `${weak} weak card${weak > 1 ? "s" : ""} to review` : "Perfect score!";
    ui.studyMeta.textContent = "Well done!";
    ui.studyProgress.textContent = `${total} / ${total}`;
    if (typeof confetti !== "undefined") {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    if (state.currentDeck.id && !String(state.currentDeck.id).startsWith("local-")) {
      saveProgress(state.currentDeck.id);
    }
    return;
  }

  const realIndex = active[state.currentIndex % active.length];
  const card = state.currentDeck.cards[realIndex];
  const weakCount = state.weakIndexes.size;
  ui.studyMeta.textContent = `Mode: ${state.currentMode.toUpperCase()} | Weak cards tracked: ${weakCount}`;
  ui.studyProgress.textContent = `Card ${state.currentIndex + 1} / ${active.length}`;
  ui.flipQuestion.textContent = card.question;
  ui.flipAnswer.textContent = card.answer;
  ui.quizQuestion.textContent = card.question;
  if (state.currentMode === "mcq" && card) {
    ui.mcqQuestion.textContent = card.question;
    loadMcqOptions(card);
  }
}

async function refreshAuthUI(sessionOverride) {
  const client = ensureAuthClient();
  if (!client) return;

  let session = sessionOverride;
  if (session === undefined) {
    const { data, error } = await client.auth.getSession();
    if (error) {
      setStatus(ui.authStatus, `Session restore failed: ${error.message}`, "error");
      session = null;
    } else {
      session = data?.session || null;
    }
  }

  applyAuthState(session?.user || null);
}

function applyAuthState(user) {
  state.user = user || null;

  if (state.user) {
    ui.authSection?.classList.add("hidden");
    ui.appSection?.classList.remove("hidden");
    if (ui.userInfo) ui.userInfo.textContent = state.user.email || "Logged in";
    setStatus(ui.authStatus, "");
    loadUserDecks();
    renderLibrary();
    loadProgress();
    return;
  }

  ui.authSection?.classList.remove("hidden");
  ui.appSection?.classList.add("hidden");
}

async function handleSignup() {
  const client = ensureAuthClient();
  if (!client) return;

  setStatus(ui.authStatus, "");
  const email = ui.authEmail?.value.trim() || "";
  const password = ui.authPassword?.value || "";
  if (!email || password.length < 6) {
    setStatus(ui.authStatus, "Enter a valid email and password (min 6 chars).", "error");
    return;
  }

  if (ui.signupBtn) ui.signupBtn.disabled = true;
  try {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      const lowered = String(error.message || "").toLowerCase();
      if (lowered.includes("already")) {
        setStatus(ui.authStatus, "This email is already registered. Please log in instead.", "error");
      } else {
        setStatus(ui.authStatus, `Sign up failed: ${error.message}`, "error");
      }
      return;
    }

    const user = authUserFromData(data);
    if (user) {
      applyAuthState(user);
    } else {
      setStatus(ui.authStatus, "Sign up successful. Check your email if confirmation is enabled.", "success");
    }
  } catch (error) {
    setStatus(ui.authStatus, `Sign up failed: ${error.message || "Unknown error"}`, "error");
  } finally {
    if (ui.signupBtn) ui.signupBtn.disabled = false;
  }
}

async function handleLogin(event) {
  if (event) event.preventDefault();

  const client = ensureAuthClient();
  if (!client) return;

  setStatus(ui.authStatus, "");
  const email = ui.authEmail?.value.trim() || "";
  const password = ui.authPassword?.value || "";
  if (!email || !password) {
    setStatus(ui.authStatus, "Enter both email and password.", "error");
    return;
  }

  if (ui.loginBtn) ui.loginBtn.disabled = true;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      const lowered = String(error.message || "").toLowerCase();
      if (lowered.includes("invalid login credentials")) {
        setStatus(ui.authStatus, "Wrong email or password. Please try again.", "error");
      } else {
        setStatus(ui.authStatus, error.message, "error");
      }
      return;
    }

    const user = authUserFromData(data);
    if (user) {
      applyAuthState(user);
    } else {
      setStatus(ui.authStatus, "Login succeeded but no session was returned. Try again.", "error");
    }
  } catch (error) {
    setStatus(ui.authStatus, `Login failed: ${error.message || "Unknown error"}`, "error");
  } finally {
    if (ui.loginBtn) ui.loginBtn.disabled = false;
  }
}

async function generateFlashcards(sourceText) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceText })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to generate flashcards.");
  }

  const data = await response.json();
  return data.cards;
}

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (!state.currentDeck) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "ArrowRight") moveCard(1);
    if (e.key === "ArrowLeft") moveCard(-1);
    if (e.key === " ") {
      e.preventDefault();
      if (state.currentMode === "flip") ui.flipCard.classList.toggle("is-flipped");
    }
  });
}

async function saveProgress(deckId) {
  const client = ensureAuthClient();
  if (!client || !state.user) return;
  const total = state.currentDeck?.cards?.length || 0;
  const weak = state.weakIndexes.size;
  const mastered = total - weak;
  const score = total > 0 ? Math.round((mastered / total) * 100) : 0;

  await client.from("progress").upsert({
    user_id: state.user.id,
    deck_id: deckId,
    cards_mastered: mastered,
    cards_weak: weak,
    last_score: score,
    total_cards: total,
    studied_at: new Date().toISOString()
  }, { onConflict: "user_id,deck_id" });
}

async function loadProgress() {
  const client = ensureAuthClient();
  if (!client || !state.user) return;

  const { data, error } = await client
    .from("progress")
    .select("*")
    .eq("user_id", state.user.id);

  if (error || !data) return;

  const bar = document.getElementById("progressBar");
  if (bar) bar.classList.remove("hidden");

  const decksStudied = data.length;
  const totalMastered = data.reduce((sum, r) => sum + (r.cards_mastered || 0), 0);
  const totalWeak = data.reduce((sum, r) => sum + (r.cards_weak || 0), 0);
  const avgScore = decksStudied > 0
    ? Math.round(data.reduce((sum, r) => sum + (r.last_score || 0), 0) / decksStudied)
    : 0;

  const el = (id) => document.getElementById(id);
  if (el("statDecks")) el("statDecks").textContent = decksStudied;
  if (el("statMastered")) el("statMastered").textContent = totalMastered;
  if (el("statWeak")) el("statWeak").textContent = totalWeak;
  if (el("statAvgScore")) el("statAvgScore").textContent = `${avgScore}%`;
}

function renderLibrary() {
  const container = document.getElementById("libraryContainer");
  if (!container) return;
  container.innerHTML = "";

  LIBRARY_DECKS.forEach((deck) => {
    const wrap = document.createElement("article");
    wrap.className = "deck-item";
    wrap.innerHTML = `
      <div>
        <h3>${deck.title}</h3>
        <div class="meta">${deck.cards.length} cards · ${deck.category}</div>
      </div>
      <div class="actions actions-tight">
        <button class="btn-primary lib-study-btn" data-id="${deck.id}">Study Now</button>
      </div>
    `;
    container.appendChild(wrap);
  });

  document.querySelectorAll(".lib-study-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const deck = LIBRARY_DECKS.find((d) => d.id === btn.dataset.id);
      if (deck) startStudy(deck);
    });
  });
}

async function loadMcqOptions(card) {
  if (!ui.mcqOptions) return;
  ui.mcqOptions.innerHTML = "<div class='mcq-loading'>Generating options...</div>";
  ui.mcqFeedback.textContent = "";
  ui.mcqCorrectAnswer.textContent = "";

  const prompt = `Given this flashcard:
Question: ${card.question}
Correct Answer: ${card.answer}

Generate exactly 3 wrong but plausible answer options for a multiple choice question.
Return ONLY a JSON array of 3 strings like this:
["wrong answer 1", "wrong answer 2", "wrong answer 3"]
No explanation, no markdown, only JSON.`;

  let wrongOptions = null;
  try {
    const response = await fetch("/api/generate-mcq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.options) && data.options.length === 3) {
        wrongOptions = data.options.map(String);
      }
    }
  } catch {
    wrongOptions = null;
  }

  if (!wrongOptions) {
    wrongOptions = getClientFallbackWrongOptions(card);
  }

  renderMcqOptions(card, wrongOptions);
}

function getClientFallbackWrongOptions(card) {
  const correctAnswer = String(card.answer || "").trim();
  const otherAnswers = state.currentDeck.cards
    .map((c) => String(c.answer || "").trim())
    .filter((answer) => answer && answer !== correctAnswer);
  const unique = [...new Set(otherAnswers)];
  const shuffled = unique.sort(() => Math.random() - 0.5);
  const wrongOptions = shuffled.slice(0, 3);
  const pads = ["None of the above", "All of the above", "Cannot be determined"];

  for (const pad of pads) {
    if (wrongOptions.length >= 3) break;
    if (pad !== correctAnswer && !wrongOptions.includes(pad)) {
      wrongOptions.push(pad);
    }
  }

  return wrongOptions.slice(0, 3);
}

function renderMcqOptions(card, wrongOptions) {
  const allOptions = [...wrongOptions, card.answer].sort(() => Math.random() - 0.5);

  ui.mcqOptions.innerHTML = "";
  allOptions.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "mcq-option";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      const isCorrect = option === card.answer;
      document.querySelectorAll(".mcq-option").forEach((b) => {
        b.disabled = true;
        if (b.textContent === card.answer) b.classList.add("correct");
      });
      if (!isCorrect) {
        btn.classList.add("wrong");
        state.weakIndexes.add(state.currentIndex);
        setStatus(ui.mcqFeedback, "Wrong! Marked as weak card.", "error");
      } else {
        state.weakIndexes.delete(state.currentIndex);
        setStatus(ui.mcqFeedback, "Correct!", "success");
      }
    });
    ui.mcqOptions.appendChild(btn);
  });
}

function wireEventHandlers() {
  console.log("magicLinkBtn found:", $("magicLinkBtn"));
  on($("magicLinkBtn"), "click", handleMagicLink);
  on(ui.signupBtn, "click", handleSignup);
  on(ui.loginBtn, "click", handleLogin);
  on(ui.loginForm, "submit", handleLogin);

  on(ui.logoutBtn, "click", async () => {
  const client = ensureAuthClient();
  if (!client) return;

  await client.auth.signOut();
  state.currentDeck = null;
  ui.studySection.classList.add("hidden");
    refreshAuthUI();
  });

  on(ui.sourceText, "input", () => {
    const len = ui.sourceText.value.length;
    if (ui.charCount) {
      ui.charCount.textContent = `${len.toLocaleString()} / 30,000 characters`;
      ui.charCount.style.color = len > 28000 ? "#FF4757" : len > 20000 ? "#FFA502" : "";
    }
  });

  on(ui.pdfInput, "change", async (event) => {
  const file = event.target.files?.[0];
  state.extractedPdfText = "";
  ui.pdfStatus.textContent = "";
  if (!file) return;

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    ui.pdfStatus.textContent = "Please upload a PDF file.";
    return;
  }

  ui.pdfStatus.textContent = "Reading PDF...";
  try {
    const text = await extractTextFromPdf(file);
    state.extractedPdfText = text;
    ui.pdfStatus.textContent = `PDF loaded. Extracted ${text.length.toLocaleString()} characters.`;
    } catch (error) {
      ui.pdfStatus.textContent = `Failed to read PDF: ${error.message}`;
    }
  });

  on(ui.generateBtn, "click", async () => {
  setStatus(ui.generateStatus, "");
  const typedText = ui.sourceText.value.trim();
  const source = typedText || state.extractedPdfText;

  if (!source || source.length < 80) {
    setStatus(ui.generateStatus, "Please provide enough text (at least ~80 characters) or upload a PDF.", "error");
    return;
  }

  if (state.decks.length >= 10) {
    setStatus(ui.generateStatus, "You've reached the 10 deck limit. Delete a deck to create a new one.", "error");
    return;
  }

  ui.generateBtn.disabled = true;
  setStatus(ui.generateStatus, "Generating flashcards...", "");

  try {
    const cards = await generateFlashcards(source);
    const title = ui.deckTitle.value.trim() || `Generated Deck ${new Date().toLocaleDateString()}`;
    await saveDeckToSupabase(title, cards, source.slice(0, 50000));
    setStatus(ui.generateStatus, "Deck generated and saved successfully.", "success");

    const localDeck = {
      id: `local-${Date.now()}`,
      title,
      cards,
      created_at: new Date().toISOString()
    };
    startStudy(localDeck);
    await loadUserDecks();
  } catch (error) {
    setStatus(ui.generateStatus, error.message || "Failed to generate deck.", "error");
  } finally {
    ui.generateBtn.disabled = false;
  }
  });

  on(ui.modeFlipBtn, "click", () => switchMode("flip"));
  on(ui.modeQuizBtn, "click", () => switchMode("quiz"));
  on(ui.modeMcqBtn, "click", () => switchMode("mcq"));
  on(ui.weakModeBtn, "click", () => {
    state.weakOnly = !state.weakOnly;
    state.currentIndex = 0;
    ui.weakModeBtn.textContent = state.weakOnly ? "Show All Cards" : "Focus on Weak Cards";
    renderStudyCard();
  });
  on(ui.shuffleBtn, "click", shuffleDeck);
  on(ui.prevBtn, "click", () => moveCard(-1));
  on(ui.nextBtn, "click", () => moveCard(1));
  on(ui.flipCard, "click", () => {
    ui.flipCard.classList.toggle("is-flipped");
  });

  on(ui.quizInput, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ui.checkAnswerBtn.click();
    }
  });

  on(ui.checkAnswerBtn, "click", () => {
  if (!state.currentDeck) return;
  const active = getActiveIndexes();
  if (!active.length) return;
  const realIndex = active[state.currentIndex];
  const card = state.currentDeck.cards[realIndex];
  const userAnswer = ui.quizInput.value.trim();

  if (!userAnswer) {
    setStatus(ui.quizFeedback, "Type an answer first.", "error");
    return;
  }

  const correct = isAnswerCorrect(userAnswer, card.answer);
  if (correct) {
    state.weakIndexes.delete(realIndex);
    setStatus(ui.quizFeedback, "Correct!", "success");
  } else {
    state.weakIndexes.add(realIndex);
    setStatus(ui.quizFeedback, "Not quite. Marked as a weak card.", "error");
  }
    ui.quizCorrectAnswer.textContent = `Correct answer: ${card.answer}`;
    renderStudyCard();
  });

  on(ui.showAnswerBtn, "click", () => {
    if (!state.currentDeck) return;
    const active = getActiveIndexes();
    if (!active.length) return;
    const realIndex = active[state.currentIndex];
    const card = state.currentDeck.cards[realIndex];
    state.weakIndexes.add(realIndex);
    setStatus(ui.quizFeedback, "Marked as weak card.", "error");
    ui.quizCorrectAnswer.textContent = `Correct answer: ${card.answer}`;
    renderStudyCard();
  });
}

async function initAuth() {
  const client = ensureAuthClient();
  if (!client) {
    applyAuthState(null);
    handleSharedDeckFromUrl();
    return;
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    setStatus(ui.authStatus, `Session restore failed: ${error.message}`, "error");
    applyAuthState(null);
  } else {
    applyAuthState(data?.session?.user || null);
  }

  handleSharedDeckFromUrl();

  client.auth.onAuthStateChange((_event, session) => {
    applyAuthState(session?.user || null);
  });
}

function startApp() {
  cacheUi();
  if (!ui.loginForm || !ui.signupBtn) {
    setStatus(ui.authStatus, "App failed to load UI. Hard refresh the page (Ctrl+F5).", "error");
    return;
  }
  wireEventHandlers();
  initKeyboardShortcuts();
  initAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
