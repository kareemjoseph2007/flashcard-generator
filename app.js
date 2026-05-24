const SUPABASE_URL = "https://rzytgxadqhrccqydvtes.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_okYCEha7aBddt5wEbJo5bQ_mz-WJ4CE";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const LOCAL_GROQ_KEY = "KIX_groq_api_key";

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
  ui.groqApiKey = $("groqApiKey");
  ui.saveGroqBtn = $("saveGroqBtn");
  ui.sourceText = $("sourceText");
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
  ui.weakModeBtn = $("weakModeBtn");
  ui.prevBtn = $("prevBtn");
  ui.nextBtn = $("nextBtn");
  ui.flipModeView = $("flipModeView");
  ui.quizModeView = $("quizModeView");
  ui.flipCard = $("flipCard");
  ui.flipQuestion = $("flipQuestion");
  ui.flipAnswer = $("flipAnswer");
  ui.quizQuestion = $("quizQuestion");
  ui.quizInput = $("quizInput");
  ui.checkAnswerBtn = $("checkAnswerBtn");
  ui.showAnswerBtn = $("showAnswerBtn");
  ui.quizFeedback = $("quizFeedback");
  ui.quizCorrectAnswer = $("quizCorrectAnswer");
}

function authUserFromData(data) {
  return data?.session?.user ?? data?.user ?? null;
}

const state = {
  user: null,
  extractedPdfText: "",
  decks: [],
  currentDeck: null,
  currentMode: "flip",
  currentIndex: 0,
  weakOnly: false,
  weakIndexes: new Set()
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

async function generateFlashcardsFromText(rawText, groqKey) {
  const source = rawText.trim().slice(0, 30000);
  const prompt = `
Create exactly 15 study flashcards from the text below.
Return ONLY valid JSON with this exact shape:
[
  { "question": "string", "answer": "string" }
]

Rules:
- Exactly 15 objects
- Clear concise question and answer
- No extra keys
- No markdown, no explanation, only JSON

Text:
${source}
`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a precise flashcard generation assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content returned from Groq.");

  let parsed;
  try {
    parsed = JSON.parse(stripJsonFence(content));
  } catch (error) {
    throw new Error("Could not parse AI response as valid JSON.");
  }

  if (!Array.isArray(parsed) || parsed.length !== 15) {
    throw new Error("AI response must be an array of exactly 15 flashcards.");
  }

  const cards = parsed.map((item, idx) => {
    const question = String(item?.question || "").trim();
    const answer = String(item?.answer || "").trim();
    if (!question || !answer) {
      throw new Error(`Flashcard ${idx + 1} is missing question or answer.`);
    }
    return { question, answer };
  });

  return cards;
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
    .select("id,title,cards,created_at")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(ui.generateStatus, `Could not load decks: ${error.message}`, "error");
    return;
  }

  state.decks = data || [];
  renderDecks();
}

function renderDecks() {
  ui.decksContainer.innerHTML = "";
  if (!state.decks.length) {
    ui.decksContainer.innerHTML = "<p class='muted'>No decks yet. Generate your first deck.</p>";
    return;
  }

  state.decks.forEach((deck) => {
    const wrap = document.createElement("article");
    wrap.className = "deck-item";
    const count = Array.isArray(deck.cards) ? deck.cards.length : 0;
    wrap.innerHTML = `
      <div>
        <h3>${deck.title || "Untitled Deck"}</h3>
        <div class="meta">${count} cards</div>
      </div>
      <div class="meta">${new Date(deck.created_at).toLocaleString()}</div>
      <div class="actions actions-tight">
        <button class="btn-primary open-deck-btn" data-id="${deck.id}">Open Deck</button>
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
}

function getActiveIndexes() {
  if (!state.currentDeck) return [];
  const all = state.currentDeck.cards.map((_, idx) => idx);
  if (!state.weakOnly || state.weakIndexes.size === 0) return all;
  return all.filter((idx) => state.weakIndexes.has(idx));
}

function startStudy(deck) {
  state.currentDeck = deck;
  state.currentIndex = 0;
  state.currentMode = "flip";
  state.weakOnly = false;
  state.weakIndexes = new Set();
  ui.studyDeckTitle.textContent = deck.title || "Study Deck";
  ui.studySection.classList.remove("hidden");
  switchMode("flip");
  renderStudyCard();
  setTimeout(() => {
    ui.studySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

function switchMode(mode) {
  state.currentMode = mode;
  const isFlip = mode === "flip";
  ui.flipModeView.classList.toggle("hidden", !isFlip);
  ui.quizModeView.classList.toggle("hidden", isFlip);
  ui.modeFlipBtn.className = isFlip ? "btn-primary" : "btn-soft";
  ui.modeQuizBtn.className = isFlip ? "btn-soft" : "btn-primary";
  ui.quizFeedback.textContent = "";
  ui.quizCorrectAnswer.textContent = "";
  ui.quizInput.value = "";
  ui.flipCard.classList.remove("is-flipped");
  renderStudyCard();
}

function moveCard(step) {
  const active = getActiveIndexes();
  if (!active.length) return;
  state.currentIndex = (state.currentIndex + step + active.length) % active.length;
  ui.flipCard.classList.remove("is-flipped");
  ui.quizFeedback.textContent = "";
  ui.quizCorrectAnswer.textContent = "";
  ui.quizInput.value = "";
  renderStudyCard();
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

  const realIndex = active[state.currentIndex % active.length];
  const card = state.currentDeck.cards[realIndex];
  const weakCount = state.weakIndexes.size;
  ui.studyMeta.textContent = `Mode: ${state.currentMode.toUpperCase()} | Weak cards tracked: ${weakCount}`;
  ui.studyProgress.textContent = `Card ${state.currentIndex + 1} / ${active.length}`;
  ui.flipQuestion.textContent = card.question;
  ui.flipAnswer.textContent = card.answer;
  ui.quizQuestion.textContent = card.question;
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

  on(ui.saveGroqBtn, "click", () => {
  const key = ui.groqApiKey.value.trim();
  if (!key) {
    setStatus(ui.generateStatus, "Enter a Groq API key first.", "error");
    return;
  }
    localStorage.setItem(LOCAL_GROQ_KEY, key);
    setStatus(ui.generateStatus, "Groq API key saved locally.", "success");
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
  const groqKey = ui.groqApiKey.value.trim() || localStorage.getItem(LOCAL_GROQ_KEY) || "";
  const typedText = ui.sourceText.value.trim();
  const source = typedText || state.extractedPdfText;

  if (!groqKey) {
    setStatus(ui.generateStatus, "Enter and save your Groq API key.", "error");
    return;
  }
  if (!source || source.length < 80) {
    setStatus(ui.generateStatus, "Please provide enough text (at least ~80 characters) or upload a PDF.", "error");
    return;
  }

  ui.generateBtn.disabled = true;
  setStatus(ui.generateStatus, "Generating flashcards...", "");

  try {
    const cards = await generateFlashcardsFromText(source, groqKey);
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
  on(ui.weakModeBtn, "click", () => {
    state.weakOnly = !state.weakOnly;
    state.currentIndex = 0;
    ui.weakModeBtn.textContent = state.weakOnly ? "Show All Cards" : "Focus on Weak Cards";
    renderStudyCard();
  });
  on(ui.prevBtn, "click", () => moveCard(-1));
  on(ui.nextBtn, "click", () => moveCard(1));
  on(ui.flipCard, "click", () => {
    ui.flipCard.classList.toggle("is-flipped");
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
    return;
  }

  const savedKey = localStorage.getItem(LOCAL_GROQ_KEY);
  if (savedKey && ui.groqApiKey) ui.groqApiKey.value = savedKey;

  const { data, error } = await client.auth.getSession();
  if (error) {
    setStatus(ui.authStatus, `Session restore failed: ${error.message}`, "error");
    applyAuthState(null);
  } else {
    applyAuthState(data?.session?.user || null);
  }

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
  initAuth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
