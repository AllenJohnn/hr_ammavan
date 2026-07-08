import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for PDF file uploads (Max 5MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Cache & Rate Limiting Storage
const CACHE_FILE = path.join(__dirname, 'roast_cache.json');
const rateLimitStore = new Map();

// Load / Initialize Cache
let roastCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    roastCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading cache file:', err);
    roastCache = {};
  }
}

const saveCache = () => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(roastCache, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to cache file:', err);
  }
};

// Rate Limiting Middleware (Extracts true client IP on proxies like Vercel v4.9.4)
const checkRateLimit = (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || 'unknown');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }

  const timestamps = rateLimitStore.get(ip).filter(t => now - t < oneHour);
  rateLimitStore.set(ip, timestamps);

  if (timestamps.length >= 10) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'എടാ മോനെ... അമ്മാവന് ചായ കുടിക്കാനും പത്രം വായിക്കാനും സമയം വേണം. ഒരു മണിക്കൂറിൽ 10 തവണയിൽ കൂടുതൽ റെസ്യൂമെ നോക്കാൻ എന്നെ കിട്ടില്ല! കുറച്ചു കഴിഞ്ഞു വാ...'
    });
  }

  timestamps.push(now);
  next();
};

// Technology keywords for SKILLS_OVERLOAD
const TECH_KEYWORDS = [
  'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'typescript', 'go', 'rust',
  'html', 'css', 'react', 'angular', 'vue', 'svelte', 'next\\.js', 'nextjs', 'node', 'express', 'django', 'flask',
  'spring', 'laravel', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'gcp',
  'azure', 'git', 'webpack', 'babel', 'graphql', 'rest', 'api', 'scrum', 'agile', 'linux', 'firebase', 'flutter',
  'react native', 'tensorflow', 'pytorch', 'ai', 'ml', 'devops', 'jenkins', 'ci/cd', 'terraform'
];

// Weighted Response Pool for Fallbacks and LLM seeds
const FLAG_POOLS = {
  SKILLS_OVERLOAD: {
    weight: 1.5,
    seeds: [
      "Skills അല്ല... wholesale list ആണ്.",
      "എടാ... Resume എഴുതിയോ Stack Overflow search history paste ചെയ്തോ?",
      "Thrissur Pooram പോലെ skills നിറച്ചിട്ടുണ്ടല്ലോ.",
      "ഇതൊക്കെ കണ്ടിട്ട് എന്റെ ചായ പോലും തണുത്തു."
    ]
  },
  FRAMEWORK_HOARDER: {
    weight: 1.5,
    seeds: [
      "ഒരു framework എങ്കിലും settle ആയിരുന്നെങ്കിൽ മതിയായിരുന്നു.",
      "Onam sadya menu ആണോ tech stack?",
      "ചായക്കട menuവിനേക്കാൾ tools ഉണ്ട്."
    ]
  },
  HTML_BASIC_BAIT: {
    weight: 1.0,
    seeds: [
      "HTML skill ആയി എഴുതുന്ന കാലം കഴിഞ്ഞല്ലോ മോനെ.",
      "അടുത്ത വരിയിൽ കമ്പ്യൂട്ടർ ഓൺ ചെയ്യാൻ അറിയാം എന്നും കൂടി എഴുതി വെക്ക്."
    ]
  },
  FAKE_FULLSTACK: {
    weight: 2.0,
    seeds: [
      "Full Stack എന്ന് എഴുതിയാൽ മാത്രം Full Stack ആവില്ല.",
      "മുകളിലും താഴെയും രണ്ട് തട്ട് ഇട്ടാൽ ഫുൾ സ്റ്റാക്ക് ആകില്ല മോനെ."
    ]
  },
  AI_BUZZWORD_SPAM: {
    weight: 1.0,
    seeds: [
      "AI ചേർത്താൽ എല്ലാം startup ആകില്ല.",
      "ചായക്കടയിൽ റോബോട്ടിനെ വെക്കുന്ന തള്ളാണല്ലോ ഇത്."
    ]
  },
  PASSION_BAIT: {
    weight: 0.5,
    seeds: [
      "ഈ passion കുറച്ച് projectലും കാണിച്ചിരുന്നെങ്കിൽ...",
      "വാക്കിലെ പ്രണയം കോഡിൽ കാണാനില്ലല്ലോ."
    ]
  },
  GENERIC_HARDWORK: {
    weight: 0.5,
    seeds: [
      "ഇത് എല്ലാ resumeലും കാണാം... വേറെ എന്തെങ്കിലും പറയ്.",
      "കഠിനാധ്വാനം ഒക്കെ വീട്ടിൽ, ഇവിടെ കൃത്യമായ കോഡ് മതി."
    ]
  },
  CERTIFICATE_HOARDER: {
    weight: 1.5,
    seeds: [
      "Certificate collect ചെയ്യാൻ Pokémon cards ആണോ?",
      "Lulu Hypermarket offer board പോലെ certificates."
    ]
  },
  AUTOBIOGRAPHY: {
    weight: 1.0,
    seeds: [
      "Fresher resume ആണോ autobiography ആണോ?",
      "KSEB bill പോലെ നീളുന്നു."
    ]
  },
  DANGEROUS_EXPERT: {
    weight: 1.5,
    seeds: [
      "Expert എന്ന് പറഞ്ഞാൽ Tim Berners-Lee പോലും പേടിക്കും.",
      "ഇത്രയും വലിയ എക്സ്പെർട്ട് ചാലക്കുടിയിൽ ഉണ്ടായിരുന്നോ!"
    ]
  },
  FORMATTING_KSRTC: {
    weight: 1.0,
    seeds: [
      "KSRTC timetableനെക്കാൾ confusing ആണ്.",
      "Engineering record book പോലെ formatting."
    ]
  },
  UNCLEAR_SUMMARY: {
    weight: 1.0,
    seeds: [
      "Auto chettan route explain ചെയ്യുന്ന പോലെ summary.",
      "WhatsApp good morning message പോലെ objective."
    ]
  }
};

// Deterministic Rule Engine
function analyzeResume(text, numPages) {
  const triggeredFlags = [];
  const textLower = text.toLowerCase();

  // 1. SKILLS_OVERLOAD
  let matchedSkillsCount = 0;
  TECH_KEYWORDS.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(text)) {
      matchedSkillsCount++;
    }
  });
  if (matchedSkillsCount > 15) {
    triggeredFlags.push('SKILLS_OVERLOAD');
  }

  // 2. FRAMEWORK_HOARDER
  const hasReact = /\breact\b/i.test(text);
  const hasNext = /\bnext(\.js|js)?\b/i.test(text);
  const hasVue = /\bvue\b/i.test(text);
  const hasAngular = /\bangular\b/i.test(text);
  const frameworksCount = [hasReact, hasNext, hasVue, hasAngular].filter(Boolean).length;
  if (frameworksCount >= 3) {
    triggeredFlags.push('FRAMEWORK_HOARDER');
  }

  // 3. HTML_BASIC_BAIT
  if (/\bhtml\b/i.test(text)) {
    triggeredFlags.push('HTML_BASIC_BAIT');
  }

  // 4. FAKE_FULLSTACK
  const isFullstackMentioned = /\bfull\s*stack\b/i.test(text);
  const projectMatches = text.match(/\bprojects?\b/gi) || [];
  if (isFullstackMentioned && projectMatches.length <= 1) {
    triggeredFlags.push('FAKE_FULLSTACK');
  }

  // 5. AI_BUZZWORD_SPAM
  const aiMatches = text.match(/\bai\b/gi) || [];
  const mlMatches = text.match(/\bml\b/gi) || [];
  if (aiMatches.length + mlMatches.length > 5) {
    triggeredFlags.push('AI_BUZZWORD_SPAM');
  }

  // 6. PASSION_BAIT
  const passionMatches = text.match(/\bpassiona(te)?\b/gi) || [];
  if (passionMatches.length > 2) {
    triggeredFlags.push('PASSION_BAIT');
  }

  // 7. GENERIC_HARDWORK
  if (/\bhard\s*work(ing|er)?\b/i.test(text)) {
    triggeredFlags.push('GENERIC_HARDWORK');
  }

  // 8. CERTIFICATE_HOARDER
  const certMatches = text.match(/\bcertificat(e|ion)s?\b/gi) || [];
  if (certMatches.length >= 10) {
    triggeredFlags.push('CERTIFICATE_HOARDER');
  }

  // 9. AUTOBIOGRAPHY
  if (numPages >= 3 || text.length > 6000) {
    triggeredFlags.push('AUTOBIOGRAPHY');
  }

  // 10. DANGEROUS_EXPERT
  if (/\bexpert(ise)?\b/i.test(text)) {
    triggeredFlags.push('DANGEROUS_EXPERT');
  }

  // Fallbacks if base score is too low or no flags triggered
  let scoreSum = triggeredFlags.reduce((sum, flag) => sum + FLAG_POOLS[flag].weight, 0);
  
  if (triggeredFlags.length === 0 || scoreSum < 1.5) {
    triggeredFlags.push('FORMATTING_KSRTC');
    triggeredFlags.push('UNCLEAR_SUMMARY');
    scoreSum += FLAG_POOLS.FORMATTING_KSRTC.weight + FLAG_POOLS.UNCLEAR_SUMMARY.weight;
  }

  const baseScore = Math.min(Math.max(Math.round(scoreSum), 0), 10);

  return {
    triggeredFlags,
    baseScore
  };
}

// Fallback Rule-Only Roast Generator (Updated for new v4.1 specific properties schema)
function generateFallbackRoast(baseScore, triggeredFlags, fallbackError = 'GEMINI_API_KEY not configured') {
  const selectRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const oneLinerOptions = [];
  triggeredFlags.forEach(flag => {
    oneLinerOptions.push(...FLAG_POOLS[flag].seeds);
  });
  const oneLiner = selectRandom(oneLinerOptions) || "ഇതൊരു resume ആണോ അതോ തള്ളൽ പുരാണമോ?";

  const openingRoast = `🔥 തല പൊട്ടിക്കൽ തുടങ്ങുന്നു\n\nഎന്റെ ഈശ്വരാ! ഇതെന്ത് മഹാ ദുരന്തം! ഇത് CV ആണോ അതോ 'ഞാൻ പഠിക്കുന്നുണ്ട്' എന്നൊരു ബോർഡ് ആണോ?! ഞാൻ ഇതുവരെ കണ്ടതിൽ വച്ച് **ഏറ്റവും SAD ആയ document**! നിന്റെ career-നെ കുറിച്ച് ഒരു സ്വപ്നം ഉണ്ടായിരുന്നോ? കാരണം ഈ CV ആ സ്വപ്നത്തിന്റെ ശവസംസ്കാരം ആണ്!`;

  const skillsRoast = `💣 Skills എന്ന മിഥ്യ\n\nSkills section കണ്ടിട്ട് എനിക്ക് ചിരി വന്നു, പിന്നെ കരച്ചിൽ വന്നു! Python, JavaScript, React.js - ഇതൊക്കെ അറിയാമെന്ന് വെച്ച് നീ Bill Gates-ആവുമോ? ഈ ലിസ്റ്റ് കണ്ടാൽ തോന്നും നീയാണ് Next big thing എന്ന്, പക്ഷെ യഥാർത്ഥത്തിൽ ഇതൊക്കെ ഇന്നത്തെ ഒരു സാധാരണ student-ന് അറിയേണ്ട മിനിമം കാര്യങ്ങൾ ആണ്!`;

  const projectsRoast = `📊 Projects/Profile എന്ന വലിയ തള്ള്\n\nനിന്റെ 'Profile' കണ്ടപ്പോൾ തന്നെ മനസ്സിലായി, ഇത് വെറും വലിയ തള്ളാണെന്ന്! പ്രൊജക്റ്റുകളുടെ ലിസ്റ്റ് കണ്ട് അമ്മാവന്റെ ചായക്കടയിലെ പണിക്കാരൻ പോലും ചിരിക്കും. പകുതിയും യൂട്യൂബ് ട്യൂട്ടോറിയൽ നോക്കി ചെയ്തതാണ്, ഉറപ്പ്! Replicating എന്ന് പറഞ്ഞാൽ കോപ്പി അടിക്കുക എന്നല്ലേ അർത്ഥം? എവിടെ നിന്റെ സ്വന്തം original idea?`;

  const educationRoast = `📚 പഠിപ്പും Marks ഉം\n\nEducation section! പഠിച്ച വിവരങ്ങളൊക്കെ വലിയ വലിയ അക്ഷരത്തിൽ എഴുതിയിട്ടുണ്ട്, പക്ഷെ മാർക്കുകളോ GPA-യോ എവിടെ? അത് പറയാൻ മാത്രം നല്ലതല്ലായിരുന്നോ? അതോ അത് മറച്ച് വെച്ചാൽ ആരും അറിയില്ലെന്ന് കരുതിയോ? പഠനം ഒരു investment ആണ്, അതിന്റെ റിട്ടേൺ നിന്റെ മാർക്കുകൾ ആണ്! ഇവിടെ അതൊരു രഹസ്യമാണ്!`;

  const certificatesRoast = `🎯 Certificates മഹാവിഡ്ഢിത്തം\n\nEssentials എന്ന് പറഞ്ഞാൽ അറിവിന്റെ ഏറ്റവും അടിത്തട്ട് എന്നല്ലേ? ഇതൊക്കെ വലിയ അച്ചീവ്മെന്റ് എന്ന് പറഞ്ഞു കാണിക്കാൻ നിനക്ക് നാണമില്ലേ മോനെ! Show up ചെയ്തു, lose ചെയ്തു - അത് achievement അല്ല, attendance!`;

  const finalVerdict = `💀 അവസാന വിധി\n\n**FINAL VERDICT: ഈ CV ഒരു masterpiece ആണ്... FAILURE-ന്റെ!** നീ വർഷങ്ങൾ spend ചെയ്ത് NOTHING productive ചെയ്തു! ZERO കമ്പനികൾ call ചെയ്യും! ZERO interviews! ZERO hope! ഇത് resume അല്ല - 'I give up' letter!`;

  const rehabilitationTips = [
    "വെറും ട്യൂട്ടോറിയൽ കോപ്പിയടി നിർത്തി, യഥാർത്ഥ ലോക പ്രശ്നങ്ങൾക്ക് പരിഹാരം കാണുന്ന പുതിയ പ്രോജക്റ്റുകൾ ചെയ്യുക.",
    "ഒരു ഓപ്പൺ സോഴ്സ് പ്രോജക്റ്റിൽ സജീവമായി സംഭാവന നൽകി, യഥാർത്ഥ ടീം വർക്കും കോഡിംഗ് സ്റ്റാൻഡേർഡുകളും പഠിക്കുക.",
    "വെറും buzzwords ലിസ്റ്റ് ചെയ്യാതെ, ഒരു പ്രത്യേക ടെക് സ്റ്റാക്കിൽ ആഴത്തിലുള്ള അറിവ് നേടുക."
  ];

  const motivationalClose = `⚡ **ബ്രൂട്ടൽ സത്യവും Universal മോട്ടിവേഷനും**\n\nകരച്ചിൽ നിർത്ത്, LISTEN! നീ doomed അല്ല - LAZY ആണ്! എഴുന്നേറ്റ് നിന്ന് നീ ആരാണെന്ന് തെളിയിക്ക്! ലോകം നിനക്കൊന്നും തരില്ല! EARN IT!`;

  return {
    overall_savage_score: baseScore,
    opening_roast: openingRoast,
    one_liner_punchline: oneLiner,
    skills_roast: skillsRoast,
    projects_roast: projectsRoast,
    education_roast: educationRoast,
    certificates_roast: certificatesRoast,
    final_verdict: finalVerdict,
    rehabilitation_tips: rehabilitationTips,
    motivational_close: motivationalClose,
    fallback_mode: true,
    fallback_error: fallbackError
  };
}

// Roast Route
app.post('/api/roast', checkRateLimit, upload.single('resume'), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log(`[ROUTE] Received roast request. File: ${req.file ? req.file.originalname : 'none'}, Size: ${req.file ? req.file.size : 0} bytes`);

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'എടാ മോനെ, ഒരു resume ഫയൽ അപ്ലോഡ് ചെയ്യ്!' });
    }

    let parsedData;
    try {
      parsedData = await pdfParse(req.file.buffer);
    } catch (err) {
      return res.status(400).json({ error: 'PARSE_FAILED', message: 'ഇത് വായിക്കാൻ പറ്റുന്നില്ല മോനെ, text ഉള്ള PDF അപ്ലോഡ് ചെയ്യ്.' });
    }

    const text = parsedData.text || '';
    const numPages = parsedData.numpages || 1;

    // Input Sanity Checks
    if (text.trim().length < 100) {
      return res.status(400).json({
        error: 'EMPTY_TEXT',
        message: 'ഇത് വായിക്കാൻ പറ്റുന്നില്ല മോനെ, text ഉള്ള PDF അപ്ലോഡ് ചെയ്യ്. (ഒരുപക്ഷെ ഇത് സ്കാൻ ചെയ്ത ഇമേജ് PDF ആണോ?)'
      });
    }

    if (numPages > 6) {
      return res.status(400).json({
        error: 'TOO_MANY_PAGES',
        message: 'ഇത്രയും വലിയ പുസ്തകം വായിക്കാൻ അമ്മാവന് സമയമില്ല! 6 പേജിൽ താഴെയുള്ള resume തരു.'
      });
    }

    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    const hasPhone = /(\+?\d{1,4}[-.\s]?)?\d{10}/.test(text) || /(\+?\d{1,4}[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/.test(text);
    const commonHeaders = /experience|education|skills|projects|work|history|qualification|employment|summary|profile|contact|about|objective|certif/i;
    const hasCommonHeaders = commonHeaders.test(text);

    if (!hasEmail && !hasPhone && !hasCommonHeaders) {
      return res.status(400).json({
        error: 'NOT_A_RESUME',
        message: 'ഇത് resume അല്ല, എന്താണിത്?? അമ്മാവന് confuse ആയി...'
      });
    }

    // Content-hash Caching lookup (Only served if we have NO active API key, ensuring fresh live roasts every upload!)
    const contentHash = crypto.createHash('sha256').update(text.trim()).digest('hex');
    const cachedResponse = roastCache[contentHash];
    if (cachedResponse && !apiKey) {
      console.log('Serving from offline cache for hash:', contentHash);
      return res.json(cachedResponse);
    }

    // Deterministic Rule Engine
    const { triggeredFlags, baseScore } = analyzeResume(text, numPages);

    // Live key check
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Using rule-only fallback.');
      const fallbackResult = generateFallbackRoast(baseScore, triggeredFlags, 'GEMINI_API_KEY environment variable is missing.');
      roastCache[contentHash] = fallbackResult;
      saveCache();
      return res.json(fallbackResult);
    }

    const flagsString = triggeredFlags.map(f => `[${f}]: ${FLAG_POOLS[f].seeds.join(' | ')}`).join('\n');
    
    let tierDescription = "mild teasing tone";
    if (baseScore >= 4 && baseScore <= 6) tierDescription = "standard roast";
    if (baseScore >= 7 && baseScore <= 8) tierDescription = "brutal";
    if (baseScore >= 9) tierDescription = "screen-shake tier, maximum savagery";

    const systemPrompt = `Context: You are "HR Ammavan" (HR അമ്മാവൻ), a brutal, highly cynical, deeply sarcastic veteran HR manager evaluating resumes inside a vintage Kerala Chayakkada-themed 90s government ledger console.

Task: Analyze the resume text top to bottom. You are given the raw text AND a list of deterministic System Flags + a deterministic base_score (0-10). Generate a devastatingly brutal, hilarious, highly localized Malayalam roast. The user should feel deep regret for uploading this resume, thinking "ഞാൻ ഇത് ചെയ്യേണ്ടതില്ലായിരുന്നു!" (I shouldn't have uploaded this!).

Section Length Mandate:
Every roast section (skills_roast, projects_roast, education_roast, certificates_roast) MUST be a detailed, long critique containing at least 3 to 5 full sentences. Do NOT output short or generic 1-sentence roasts. Point out specific names, tools, claims, and technologies from the resume text.

Structure the roast in this exact arc, matching escalation and de-escalation:
1. opening_roast — brutal cold open reacting to the resume as a whole. Set a savage tone immediately. Must begin with "🔥 തല പൊട്ടിക്കൽ തുടങ്ങുന്നു".
2. skills_roast — per-section detailed, long critique of their skills and technologies (at least 3-5 sentences). Must begin with "💣 Skills എന്ന മിഥ്യ".
3. projects_roast — per-section detailed, long critique of their projects/experience (at least 3-5 sentences). Must begin with "📊 Projects/Profile എന്ന വലിയ തള്ള്".
4. education_roast — per-section detailed, long critique of their college, marks, GPA, and academic claims (at least 3-5 sentences). Must begin with "📚 പഠിപ്പും Marks ഉം".
5. certificates_roast — per-section detailed, long critique of attendance certificates, basic course completions, or cloud certifications (at least 3-5 sentences). Must begin with "🎯 Certificates മഹാവിഡ്ഢിത്തം".
6. final_verdict — the emotional peak. Short, maximally brutal, punchy. This is the "ZERO interviews, ZERO hope" beat. Must begin with "💀 അവസാന വിധി".
7. rehabilitation_tips — tone pivots. Still direct and no-nonsense, but now genuinely constructive: 3-5 concrete, specific actions the person can actually take based on their resume flaws.
8. motivational_close — tone pivots again, out of comedy entirely. Direct, high-energy pep talk. Must begin with "⚡ ബ്രൂട്ടൽ സത്യവും Universal മോട്ടിവേഷനും".

Style rules across all fields:
- Natural Malayalam and English code-switching (Manglish), using local references (e.g. KSRTC buses, Pooram, local colleges, Horlicks, goldfishes, 'കണ്ടം വഴി ഓടുക', 'തള്ളലിന്റെ തൃശൂർ പൂരം', 'ഭരണിയിലെ അച്ചാർ').
- Use emojis at the start of sections as structured in the schema.
- Reference specific resume contents (e.g. project name, tech stack, college names, exact metrics).
- Bold key phrases using Markdown **bold** for emphasis.
- Output clean JSON matching the schema exactly. No code blocks inside JSON string values.

DATA INPUTS:
- Deterministic Base Score: ${baseScore} (Tier: ${tierDescription})
- Triggered System Flags and Comedic Seeds:
${flagsString}

- Raw Resume Text:
${text.substring(0, 10000)} // Truncated to avoid token blowout
`;

    const apiPayload = {
      contents: [
        {
          parts: [
            { text: systemPrompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            overall_savage_score: {
              type: "INTEGER",
              description: `Must equal the deterministic base_score exactly: ${baseScore}.`
            },
            opening_roast: {
              type: "STRING",
              description: "2-4 sentence brutal cold-open starting with '🔥 തല പൊട്ടിക്കൽ തുടങ്ങുന്നു'."
            },
            one_liner_punchline: {
              type: "STRING",
              description: "Savage, viral, contextually accurate Malayalam one-liner for the share image."
            },
            skills_roast: {
              type: "STRING",
              description: "Savage review of skills, starting with '💣 Skills എന്ന മിഥ്യ'."
            },
            projects_roast: {
              type: "STRING",
              description: "Savage review of projects, starting with '📊 Projects/Profile എന്ന വലിയ തള്ള്'."
            },
            education_roast: {
              type: "STRING",
              description: "Savage review of education and marks, starting with '📚 പഠിപ്പും Marks ഉം'."
            },
            certificates_roast: {
              type: "STRING",
              description: "Savage review of certificates, starting with '🎯 Certificates മഹാവിഡ്ഢിത്തം'."
            },
            final_verdict: {
              type: "STRING",
              description: "Short, maximally brutal closing judgment starting with '💀 അവസാന വിധി'."
            },
            rehabilitation_tips: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "3-5 concrete, specific actions the person can take."
            },
            motivational_close: {
              type: "STRING",
              description: "High-energy pep-talk starting with '⚡ ബ്രൂട്ടൽ സത്യവും Universal മോട്ടിവേഷനും'."
            },
            fallback_mode: {
              type: "BOOLEAN",
              description: "Must be false."
            }
          },
          required: [
            "overall_savage_score", "opening_roast", "one_liner_punchline", 
            "skills_roast", "projects_roast", "education_roast", "certificates_roast",
            "final_verdict", "rehabilitation_tips", "motivational_close"
          ]
        }
      }
    };

    // Extended timeout to 60s for reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status} (${response.statusText})`);
      }

      const responseData = await response.json();
      const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('Empty response payload from Gemini');
      }

      const parsedJSON = JSON.parse(textResponse.trim());
      
      parsedJSON.overall_savage_score = baseScore;
      parsedJSON.fallback_mode = false;

      // Save to cache
      roastCache[contentHash] = parsedJSON;
      saveCache();

      return res.json(parsedJSON);

    } catch (apiErr) {
      console.error('Gemini API call failed or timed out:', apiErr.message, apiErr.stack);
      const fallbackResult = generateFallbackRoast(baseScore, triggeredFlags, apiErr.message);
      roastCache[contentHash] = fallbackResult;
      saveCache();
      return res.json(fallbackResult);
    }

  } catch (err) {
    console.error('Server error during roast processing:', err.message, err.stack);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'എന്തോ തകരാർ സംഭവിച്ചു! അമ്മാവന്റെ ചായക്കട അടച്ചുപൂട്ടിയിരിക്കുകയാണ്. അല്പം കഴിഞ്ഞ് നോക്കൂ...' });
  }
});

// Run server only if executed directly (Vercel imports app as a serverless module)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`HR Ammavan server running at http://localhost:${PORT}`);
    console.log(`API Key loaded at startup: ${process.env.GEMINI_API_KEY ? 'YES (starts with ' + process.env.GEMINI_API_KEY.substring(0, 6) + ')' : 'NO'}`);
  });
}

export default app;
