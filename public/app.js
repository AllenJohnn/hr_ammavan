// HR Ammavan v4.2 - Client Side Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  
  const uploadPanel = document.getElementById('upload-panel');
  const loaderPanel = document.getElementById('loader-panel');
  const resultPanel = document.getElementById('result-panel');
  
  const systemStatus = document.getElementById('system-status-val');
  
  const progressFill = document.getElementById('progress-fill');
  const tickerText = document.getElementById('ticker-text');
  
  // Physical counter loader elements
  const loadingRateVal = document.getElementById('loading-rate-val');
  const activeTeaLiquid = document.getElementById('active-tea-liquid');
  const teaPourStream = document.getElementById('tea-pour-stream');
  
  // Palm Fronds & Coconut Drop Elements
  const palmFronds = document.querySelectorAll('.palm-frond');
  const coconutDrop = document.getElementById('coconut-drop');
  
  // Results panel mapping
  const punchlineText = document.getElementById('punchline-text');
  const openingRoastText = document.getElementById('opening-roast-text');
  const finalVerdictText = document.getElementById('final-verdict-text');
  const rehabTipsList = document.getElementById('rehab-tips-list');
  const motivationalCloseText = document.getElementById('motivational-close-text');
  
  // Developer Warning Badge
  const fallbackWarningBox = document.getElementById('fallback-warning-box');
  const fallbackErrorMsg = document.getElementById('fallback-error-msg');
  
  // Folder layout tabs elements
  const folderTabsList = document.getElementById('folder-tabs-list');
  const activeTabHeading = document.getElementById('active-tab-heading');
  const activeTabCritique = document.getElementById('active-tab-critique');
  
  const btnReupload = document.getElementById('btn-reupload');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  
  // State
  let loadingInterval = null;
  let activeRoastData = null;
  let isMuted = false;

  // 1. Mouse Parallax Palm Fronds
  window.addEventListener('mousemove', (e) => {
    const moveX = (e.clientX - window.innerWidth / 2) / 45;
    const moveY = (e.clientY - window.innerHeight / 2) / 45;
    
    palmFronds.forEach((frond, idx) => {
      const factor = (idx + 1) * 0.45;
      frond.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
  });

  // Sound Toggle Switch Listener (v4.6)
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      isMuted = !isMuted;
      btnSoundToggle.textContent = isMuted ? "🔇 OFF" : "🔊 ON";
      btnSoundToggle.className = isMuted ? "status-value text-secondary" : "status-value text-gold";
    });
  }

  // Sound Synthesis Helpers (Web Audio API)
  function playSlamSound() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc = audioCtx.createOscillator();
      const gainOsc = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.35);
      
      gainOsc.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gainOsc.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.38);
      
      osc.connect(gainOsc);
      gainOsc.connect(audioCtx.destination);
      
      const bufferSize = audioCtx.sampleRate * 0.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      
      const gainNoise = audioCtx.createGain();
      gainNoise.gain.setValueAtTime(0.8, audioCtx.currentTime);
      gainNoise.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      
      noiseNode.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
      noiseNode.start();
      noiseNode.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio API blocked or not supported:", e);
    }
  }

  // Sound buzz helper
  function playBuzzerSound() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(120, audioCtx.currentTime);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(123, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.45);
      osc2.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("Buzzer play error:", e);
    }
  }

  // Sound click helper
  function playClickSound() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.04);
      
      gainNode.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // Spindle Paper Tear / Metal Thud Sound (v4.9.3)
  function playTearSound() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Low-frequency metallic thud
      const osc = audioCtx.createOscillator();
      const gainOsc = audioCtx.createGain();
      osc.frequency.setValueAtTime(110, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.15);
      gainOsc.gain.setValueAtTime(0.7, audioCtx.currentTime);
      gainOsc.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gainOsc);
      gainOsc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);

      // High-pass noise tear burst
      const bufferSize = audioCtx.sampleRate * 0.12;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gainNoise = audioCtx.createGain();
      gainNoise.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNoise.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(audioCtx.destination);

      noise.start();
      noise.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // ignore
    }
  }

  // Cardboard page flip sound (v4.9.3)
  function playPageFlipSound() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 0.15;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 3;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noise.start();
      noise.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // ignore
    }
  }

  // Drag and Drop Event Handlers
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Handle PDF file check
  function handleFile(file) {
    if (file.type !== 'application/pdf') {
      showErrorAlert("ഇത് PDF അല്ല മോനെ! റെസ്യൂമെ PDF ഫോർമാറ്റിൽ തന്നെ വേണം.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorAlert("റെസ്യൂമെ ഫയലിന് സൈസ് വളരെ കൂടുതൽ ആണ്! 5MB-ൽ താഴെയുള്ള ഫയൽ തരൂ.");
      return;
    }
    
    // Play physical tear/impale sound and trigger visual spindle classes before start (v4.9.3)
    dropzone.classList.add('impaled');
    const tearVisual = document.getElementById('spindle-tear');
    if (tearVisual) tearVisual.classList.remove('hidden');
    playTearSound();

    setTimeout(() => {
      startInspection(file);
    }, 450);
  }

  function showErrorAlert(message) {
    playBuzzerSound();
    alert(message);
  }

  // Inspection Loading Routine
  function startInspection(file) {
    uploadPanel.classList.add('hidden');
    loaderPanel.classList.remove('hidden');
    resultPanel.classList.add('hidden');
    
    systemStatus.textContent = "തള്ളിമറിച്ച പേപ്പർ ഇരന്നു വാങ്ങുന്നു...";
    systemStatus.className = "status-value text-gold";
    
    loadingRateVal.textContent = "processing...";
    loadingRateVal.style.color = 'var(--chalk-yellow)';
    
    // Activate tea counter pour streams
    activeTeaLiquid.style.height = '0%';
    teaPourStream.classList.add('active');

    let progress = 0;
    progressFill.style.width = '0%';
    tickerText.textContent = TICKER_STAGES[0].text;
    
    loadingInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 4) + 1;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = `${progress}%`;
        activeTeaLiquid.style.height = `${progress}%`;
        
        // Update live status message in Malayalam based on progress
        if (progress < 30) {
          systemStatus.textContent = "റസ്യൂമെ അമ്മാവൻ തിരിച്ചും മറിച്ചും നോക്കുന്നു...";
        } else if (progress < 60) {
          systemStatus.textContent = "എഴുതി വെച്ച തള്ളലുകൾ അരിച്ചെടുക്കുന്നു...";
        } else {
          systemStatus.textContent = "തള്ളലുകൾ വേർതിരിച്ചു ചായ പതപ്പിക്കുന്നു...";
        }
        
        // Update tickers
        const activeStage = TICKER_STAGES.reduce((prev, curr) => {
          return (progress >= curr.threshold) ? curr : prev;
        });
        
        if (tickerText.textContent !== activeStage.text) {
          tickerText.textContent = activeStage.text;
          playClickSound();
        }
      }
    }, 280);

    // Send payload to backend
    const formData = new FormData();
    formData.append('resume', file);

    fetch('/api/roast', {
      method: 'POST',
      body: formData
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to inspect resume.");
      }
      return data;
    })
    .then((data) => {
      clearInterval(loadingInterval);
      
      progressFill.style.width = '100%';
      activeTeaLiquid.style.height = '100%';
      teaPourStream.classList.remove('active');
      loadingRateVal.textContent = 'DONE';
      loadingRateVal.style.color = '#55a630';

      setTimeout(() => {
        showRoastResult(data);
      }, 600);
    })
    .catch((err) => {
      clearInterval(loadingInterval);
      loaderPanel.classList.add('hidden');
      uploadPanel.classList.remove('hidden');
      
      teaPourStream.classList.remove('active');
      activeTeaLiquid.style.height = '0%';
      
      systemStatus.textContent = "ചായ കുടി കഴിഞ്ഞു വെറ്റില മുറുക്കുന്നു...";
      systemStatus.className = "status-value pulse-green";
      
      showErrorAlert(err.message || "എന്തോ കുഴപ്പം സംഭവിച്ചു! അമ്മാവന് വണ്ടിക്കൂലി കിട്ടിയിട്ടില്ല എന്ന് തോന്നുന്നു.");
    });
  }

  // Typewriter Word-by-Word Print Handler (Concurrent Safe v4.2)
  function typeWriteText(element, htmlText, onComplete) {
    // Clear any active timer set directly on this target element
    if (element.typeTimeoutId) {
      clearTimeout(element.typeTimeoutId);
    }
    element.innerHTML = '';
    
    const sanitized = sanitizeHTML(htmlText);
    const tokens = sanitized.split(/(\s+|<br>|<[^>]+>)/g).filter(Boolean);
    let index = 0;
    
    function typeNextToken() {
      if (index < tokens.length) {
        const token = tokens[index];
        if (token === '<br>') {
          element.innerHTML += '<br>';
        } else if (token.startsWith('<') && token.endsWith('>')) {
          element.innerHTML += token; 
        } else {
          element.innerHTML += token;
        }
        index++;
        if (index % 2 === 0) {
          playClickSound();
        }
        element.typeTimeoutId = setTimeout(typeNextToken, 20 + Math.random() * 15);
      } else {
        element.typeTimeoutId = null;
        if (onComplete) {
          onComplete();
        }
      }
    }
    typeNextToken();
  }

  // Sanitize helper to prevent XSS vulnerabilities
  function sanitizeHTML(html) {
    if (!html) return '';
    return html
      .replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  }

  // Display Roast Result
  function showRoastResult(data) {
    activeRoastData = data;
    
    loaderPanel.classList.add('hidden');
    resultPanel.classList.remove('hidden');
    
    systemStatus.textContent = "റസ്യൂമെ കീറി പപ്പടമാക്കിയിട്ടുണ്ട്!";
    systemStatus.className = "status-value text-gold";

    const score = data.overall_savage_score;
    
    // 1. Punchline Verdict board text
    punchlineText.textContent = `"${data.one_liner_punchline}"`;

    // Developer Warning Badge
    if (data.fallback_mode) {
      fallbackWarningBox.classList.remove('hidden');
      fallbackErrorMsg.textContent = data.fallback_error || 'GEMINI_API_KEY environment variable is missing.';
    } else {
      fallbackWarningBox.classList.add('hidden');
    }

    // Render the savage score on the chalkboard score badge
    const scoreBadge = document.getElementById('savage-score-badge');
    const scoreVal = document.getElementById('chalk-savage-score');
    if (scoreVal) scoreVal.textContent = score;
    if (scoreBadge) {
      scoreBadge.classList.remove('revealed');
      setTimeout(() => {
        scoreBadge.classList.add('revealed');
        playSlamSound(); // Slaps down with metallic audio
      }, 250);
    }

    // Reset certified stamp state before typing starts
    const stamp = document.getElementById('certified-fluff-stamp');
    if (stamp) {
      stamp.classList.add('hidden');
      stamp.classList.remove('slammed');
    }

    // 2. Render Opening Roast, Final Verdict, Rehab tips, and Motivational Pep Talk (Typewritten sequentially)
    typeWriteText(openingRoastText, formatMarkdown(data.opening_roast), () => {
      typeWriteText(finalVerdictText, formatMarkdown(data.final_verdict), () => {
        typeWriteText(motivationalCloseText, formatMarkdown(data.motivational_close), () => {
          // Slam the 'Certified Fluff' stamp after final close is printed!
          if (stamp) {
            stamp.classList.remove('hidden');
            stamp.classList.add('slammed');
            playSlamSound();
          }
        });
      });
    });

    // Populate Rehab tips
    rehabTipsList.innerHTML = '';
    data.rehabilitation_tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      rehabTipsList.appendChild(li);
    });

    // 3. Map Malayalam JSON properties onto folder tabs (v4.1 - Manila vertical cardboard tags v4.9.3)
    const sections = [
      { id: 'skills', label: 'Skills', heading: '💣 Skills എന്ന മിഥ്യ', critique: data.skills_roast },
      { id: 'projects', label: 'Projects', heading: '📊 Projects/Profile എന്ന വലിയ തള്ള്', critique: data.projects_roast },
      { id: 'education', label: 'Education', heading: '📚 പഠിപ്പും Marks ഉം', critique: data.education_roast },
      { id: 'certificates', label: 'Certificates', heading: '🎯 Certificates മഹാവിഡ്ഢിത്തം', critique: data.certificates_roast }
    ];

    folderTabsList.innerHTML = '';
    sections.forEach((sec, idx) => {
      const tabButton = document.createElement('button');
      tabButton.className = `folder-tab-vertical ${idx === 0 ? 'active' : ''}`;
      tabButton.textContent = sec.label;
      
      tabButton.addEventListener('click', () => {
        document.querySelectorAll('.folder-tab-vertical').forEach(btn => btn.classList.remove('active'));
        tabButton.classList.add('active');
        
        playPageFlipSound(); // Page flip SFX
        activeTabHeading.textContent = sec.heading;
        typeWriteText(activeTabCritique, formatMarkdown(sec.critique));
      });
      folderTabsList.appendChild(tabButton);
    });

    // Typewrite first section tab content (Does not block opening roast typewriter anymore!)
    if (sections.length > 0) {
      activeTabHeading.textContent = sections[0].heading;
      typeWriteText(activeTabCritique, formatMarkdown(sections[0].critique));
    }

    // 4. Coconut Drop Event for Savage scores (score >= 9)
    coconutDrop.classList.remove('drop');
    
    if (score >= 9) {
      setTimeout(() => {
        document.body.classList.add('screen-shake');
        coconutDrop.classList.add('drop');
        playSlamSound();
        
        setTimeout(() => {
          document.body.classList.remove('screen-shake');
        }, 550);
      }, 500);
    }
  }

  // Basic markdown parser
  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // Reupload Button Handler (Clears individual element typewrite timeouts)
  btnReupload.addEventListener('click', () => {
    if (openingRoastText.typeTimeoutId) clearTimeout(openingRoastText.typeTimeoutId);
    if (finalVerdictText.typeTimeoutId) clearTimeout(finalVerdictText.typeTimeoutId);
    if (motivationalCloseText.typeTimeoutId) clearTimeout(motivationalCloseText.typeTimeoutId);
    if (activeTabCritique.typeTimeoutId) clearTimeout(activeTabCritique.typeTimeoutId);
    
    const stamp = document.getElementById('certified-fluff-stamp');
    if (stamp) {
      stamp.classList.add('hidden');
      stamp.classList.remove('slammed');
    }

    const scoreBadge = document.getElementById('savage-score-badge');
    if (scoreBadge) {
      scoreBadge.classList.remove('revealed');
    }

    // Reset Spindle desk spike zone
    dropzone.classList.remove('impaled');
    const tearVisual = document.getElementById('spindle-tear');
    if (tearVisual) tearVisual.classList.add('hidden');
    
    resultPanel.classList.add('hidden');
    uploadPanel.classList.remove('hidden');
    fileInput.value = '';
    
    systemStatus.textContent = "ചായ കുടി കഴിഞ്ഞു വെറ്റില മുറുക്കുന്നു...";
    systemStatus.className = "status-value pulse-green";
  });

  // Ticker Stages
  const TICKER_STAGES = [
    { threshold: 0, text: "ചായ അടിക്കുന്നു... കൂടെ നിന്റെ തള്ളലുകൾ അമ്മാവൻ അരിച്ചെടുക്കുന്നു..." },
    { threshold: 25, text: "നിന്റെ Next.js-ഉം Redis-ഉം കണ്ട് അമ്മാവന്റെ പ്രഷർ കൂടുന്നുണ്ട്..." },
    { threshold: 50, text: "ആമസോൺ സർട്ടിഫിക്കറ്റ് രണ്ടു തവണ കോപ്പി പേസ്റ്റ് ചെയ്ത കള്ളത്തരം പൊക്കി..." },
    { threshold: 75, text: "ചായ റെഡി! നിന്റെ റെസ്യൂമെ കീറി ഒട്ടിക്കാൻ അമ്മാവൻ സീറ്റിൽ എത്തി..." }
  ];
});
