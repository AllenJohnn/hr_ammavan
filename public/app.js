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

  // 1. Mouse Parallax Palm Fronds & Torchlight Tracking (v4.9.5)
  function updatePointer(x, y) {
    document.documentElement.style.setProperty('--mouse-x', `${x}px`);
    document.documentElement.style.setProperty('--mouse-y', `${y}px`);

    const moveX = (x - window.innerWidth / 2) / 45;
    const moveY = (y - window.innerHeight / 2) / 45;
    
    palmFronds.forEach((frond, idx) => {
      const factor = (idx + 1) * 0.45;
      frond.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
    });
  }

  window.addEventListener('mousemove', (e) => {
    updatePointer(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
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
    
    loadingRateVal.textContent = "0%";
    loadingRateVal.style.color = 'var(--brass-gold)';
    
    // Reset snack cabinet to empty v4.9.4
    const snack1 = document.getElementById('shelf-snack-parippuvada');
    const snack2 = document.getElementById('shelf-snack-pazhampori');
    const snack3 = document.getElementById('shelf-snack-neyyappam');
    if (snack1) { snack1.classList.add('hidden-snack'); snack1.classList.remove('visible-snack'); }
    if (snack2) { snack2.classList.add('hidden-snack'); snack2.classList.remove('visible-snack'); }
    if (snack3) { snack3.classList.add('hidden-snack'); snack3.classList.remove('visible-snack'); }

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
        loadingRateVal.textContent = `${progress}%`;
        const pctElement = document.getElementById('loading-rate-val-percent');
        if (pctElement) pctElement.textContent = `${progress}%`;
        
        // Progressive snacks in Kannadi Alamara (v4.9.4)
        if (progress >= 20 && snack1) {
          if (snack1.classList.contains('hidden-snack')) {
            snack1.classList.remove('hidden-snack');
            snack1.classList.add('visible-snack');
            playClickSound(); // light drop sound
          }
        }
        if (progress >= 50 && snack2) {
          if (snack2.classList.contains('hidden-snack')) {
            snack2.classList.remove('hidden-snack');
            snack2.classList.add('visible-snack');
            playClickSound();
          }
        }
        if (progress >= 75 && snack3) {
          if (snack3.classList.contains('hidden-snack')) {
            snack3.classList.remove('hidden-snack');
            snack3.classList.add('visible-snack');
            playClickSound();
          }
        }

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
      // Catch status 429 Rate Limit Interceptor (v4.9.4 KSRTC Breakdown Wall)
      if (response.status === 429) {
        const modal = document.getElementById('rate-limit-modal');
        if (modal) {
          modal.classList.remove('hidden');
        }
        playBuzzerSound();
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
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
      loadingRateVal.textContent = '100%';
      loadingRateVal.style.color = '#55a630';
      const pctElement = document.getElementById('loading-rate-val-percent');
      if (pctElement) pctElement.textContent = '100%';

      // Drop final snack (Neyyappam) if not already visible
      if (snack3 && snack3.classList.contains('hidden-snack')) {
        snack3.classList.remove('hidden-snack');
        snack3.classList.add('visible-snack');
      }

      setTimeout(() => {
        showRoastResult(data);
      }, 600);
    })
    .catch((err) => {
      clearInterval(loadingInterval);
      loaderPanel.classList.add('hidden');
      
      teaPourStream.classList.remove('active');
      activeTeaLiquid.style.height = '0%';
      
      if (err.message !== "RATE_LIMIT_EXCEEDED") {
        uploadPanel.classList.remove('hidden');
        systemStatus.textContent = "ചായ കുടി കഴിഞ്ഞു വെറ്റില മുറുക്കുന്നു...";
        systemStatus.className = "status-value pulse-green";
        showErrorAlert(err.message || "എന്തോ കുഴപ്പം സംഭവിച്ചു! അമ്മാവന് വണ്ടിക്കൂലി കിട്ടിയിട്ടില്ല എന്ന് തോന്നുന്നു.");
      }
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
      if (fallbackErrorMsg) {
        fallbackErrorMsg.textContent = data.fallback_error || 'GEMINI_API_KEY environment variable is missing.';
      }
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

    // Punch KSRTC ticket spots (v4.9.5)
    document.querySelectorAll('.punch-spot').forEach(spot => {
      spot.classList.remove('punched');
      const flag = spot.getAttribute('data-flag');
      if (data.triggered_flags && data.triggered_flags.includes(flag)) {
        spot.classList.add('punched');
      }
    });

    // 4. Coconut Drop & Extreme Savage Score Rain Trigger (v4.9.5)
    coconutDrop.classList.remove('drop');
    
    if (score >= 9) {
      setTimeout(() => {
        document.body.classList.add('screen-shake');
        coconutDrop.classList.add('drop');
        playSlamSound();
        
        // Dynamic HTML5/CSS monsoon rain & lightning flash
        startMonsoonRain();
        
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

  // HTML5 Canvas Monsoon Rain Generator (v4.9.5 Extreme Savage Score Effect)
  function startMonsoonRain() {
    const canvas = document.getElementById('monsoon-rain-canvas');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
    
    const maxDrops = 160;
    const drops = [];
    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: Math.random() * 22 + 10,
        ys: Math.random() * 12 + 10,
        xs: Math.random() * 2 - 1
      });
    }
    
    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.14)';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      
      for (let i = 0; i < maxDrops; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.xs, d.y + d.len);
        ctx.stroke();
        
        d.x += d.xs;
        d.y += d.ys;
        if (d.y > height) {
          d.x = Math.random() * width;
          d.y = -22;
        }
      }
      
      // Random lightning flash trigger (approx 0.7% chance per frame)
      if (Math.random() < 0.007) {
        triggerLightningFlash();
      }
      
      requestAnimationFrame(draw);
    }
    
    function triggerLightningFlash() {
      const flash = document.createElement('div');
      flash.className = 'lightning-flash';
      document.body.appendChild(flash);
      
      // Play low rumble audio
      playThunderRumble();

      setTimeout(() => {
        flash.remove();
      }, 150);
    }
    
    draw();
  }

  function playThunderRumble() {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(10, audioCtx.currentTime + 0.8);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 95;
      
      gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
      // ignore
    }
  }

  // System Time Ambiance Trigger (Power Cut mode v4.9.5)
  const nowTime = new Date();
  const currentHour = nowTime.getHours();
  if (currentHour >= 18 || currentHour < 6) { // Past 6:00 PM or before 6:00 AM
    document.body.classList.add('power-cut-mode');
  }

  // Disable Right-Click and DevTools Hotkeys (v4.9.5 Code Protection)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    // Disable F12
    if (e.key === 'F12') {
      e.preventDefault();
    }
    // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
    if (e.ctrlKey && (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c') || (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))) {
      e.preventDefault();
    }
  });
});
