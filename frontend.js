// Enhanced Documentation Interactive System
document.addEventListener('DOMContentLoaded', () => {
    
    // Configuration
    const CONFIG = {
        hypothesis: {
            enabled: true, // Enable Hypothesis web annotations
            config: {
                branding: {
                    appBackgroundColor: '#e7f4fd',
                    ctaBackgroundColor: '#00b04f',
                    ctaTextColor: '#ffffff'
                }
            }
        },
        translation: {
            apiKey: '', // Translation service API key
            service: 'google' // google, deepl, etc.
        },
        narration: {
            defaultVoice: null,
            defaultSpeed: 1.0,
            autoScroll: true,
            highlightText: true
        }
    };

    // State Management
    const state = {
        currentTheme: 'light',
        currentLanguage: 'en',
        comments: [],
        isNarrating: false,
        currentSection: null,
        translationCache: new Map(),
        voicesLoaded: false
    };

    // --- Core System Initialization ---
    
    function initializeSystem() {
        initializeTheme();
        initializeNavigation();
        initializeSearch();
        initializeCommentSystem();
        initializeTranslation();
        initializeNarration();
        initializeHypothesisIntegration();
        initializeAccessibility();
        initializeResponsiveFeatures();
        initializeTextSelection();
        
        // Load initial data
        loadComments();
        loadVoices();
        
        // Documentation System Initialized
        showToast('EcoSentinel Documentation System Ready', 'success');
    }

    // --- Theme Management ---
    
    function initializeTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        function applyTheme(theme) {
            state.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('documentation-theme', theme);
            
            // Update GitHub status indicator color scheme
            updateGitHubStatusDisplay();
        }
        
        themeToggle?.addEventListener('click', () => {
            const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            showToast(`Switched to ${newTheme} theme`, 'info');
        });

        // Initialize theme
        const savedTheme = localStorage.getItem('documentation-theme');
        const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
        applyTheme(initialTheme);
        
        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('documentation-theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // --- Enhanced Navigation ---
    
    function initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.doc-section');
        
        // Enhanced intersection observer with better tracking
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    state.currentSection = entry.target.id;
                    updateActiveNavLink(entry.target.id);
                    
                    // Update reading progress
                    updateReadingProgress();
                }
            });
        }, { 
            rootMargin: '-20% 0px -70% 0px',
            threshold: [0.1, 0.5, 1.0]
        });
        
        sections.forEach(section => observer.observe(section));
        
        // Smooth scroll with offset for fixed header
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerOffset = 80; // Account for fixed controls bar
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without triggering scroll
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
    }
    
    function updateActiveNavLink(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('href').substring(1) === sectionId;
            link.classList.toggle('active', isActive);
        });
    }
    
    function updateReadingProgress() {
        const sections = document.querySelectorAll('.doc-section');
        const currentSectionIndex = Array.from(sections).findIndex(
            section => section.id === state.currentSection
        );
        
        if (currentSectionIndex >= 0) {
            const progress = ((currentSectionIndex + 1) / sections.length) * 100;
            
            // Update any progress indicators
            const progressElements = document.querySelectorAll('.reading-progress');
            progressElements.forEach(el => {
                el.style.width = `${progress}%`;
                el.setAttribute('aria-valuenow', progress);
            });
        }
    }

    // --- Enhanced Search ---
    
    function initializeSearch() {
        const searchBar = document.getElementById('search-bar');
        const searchableElements = document.querySelectorAll('.doc-section');
        let searchTimeout;
        
        searchBar?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300); // Debounce search
        });
        
        function performSearch(query) {
            const normalizedQuery = query.toLowerCase().trim();
            
            if (!normalizedQuery) {
                // Show all content
                document.querySelectorAll('.doc-section, .doc-section > *').forEach(el => {
                    el.style.display = '';
                });
                return;
            }
            
            let hasResults = false;
            
            searchableElements.forEach(section => {
                let sectionHasMatch = false;
                const searchableContent = section.querySelectorAll('p, li, h3, h4, h5, code, pre');
                
                searchableContent.forEach(element => {
                    const text = element.textContent.toLowerCase();
                    const hasMatch = text.includes(normalizedQuery);
                    
                    if (hasMatch) {
                        element.style.display = '';
                        highlightSearchTerms(element, normalizedQuery);
                        sectionHasMatch = true;
                        hasResults = true;
                    } else {
                        element.style.display = 'none';
                        removeHighlights(element);
                    }
                });
                
                // Show/hide section based on matches
                const sectionHeader = section.querySelector('.section-title');
                if (sectionHeader) {
                    sectionHeader.style.display = sectionHasMatch ? '' : 'none';
                }
                section.style.display = sectionHasMatch ? '' : 'none';
            });
            
            if (!hasResults && normalizedQuery) {
                showToast('No results found for your search', 'warning');
            }
        }
        
        function highlightSearchTerms(element, query) {
            if (element.querySelector('.search-highlight')) return; // Already highlighted
            
            const text = element.textContent;
            const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
            const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            
            if (highlightedText !== text) {
                element.innerHTML = highlightedText;
            }
        }
        
        function removeHighlights(element) {
            const highlights = element.querySelectorAll('.search-highlight');
            highlights.forEach(highlight => {
                highlight.outerHTML = highlight.textContent;
            });
        }
        
        function escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }

    // --- Enhanced Comment System ---
    
    function initializeCommentSystem() {
        const modal = document.getElementById('comment-modal');
        const closeModalBtn = document.querySelector('.modal-close-btn');
        const commentForm = document.getElementById('comment-form');
        const targetIdInput = document.getElementById('comment-target-id');
        const targetTextInput = document.getElementById('comment-target-text');
        const commentTextarea = document.getElementById('comment-text');
        const charCountDisplay = document.getElementById('char-count');
        
        // Initialize comment icons on all relevant elements
        initializeCommentIcons();
        
        // Character counter for comment textarea
        commentTextarea?.addEventListener('input', (e) => {
            const currentLength = e.target.value.length;
            const maxLength = 1000;
            
            if (charCountDisplay) {
                charCountDisplay.textContent = currentLength;
                charCountDisplay.style.color = currentLength > maxLength * 0.9 ? 'var(--error)' : 'var(--text-muted)';
            }
        });
        
        // Comment form submission
        commentForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(commentForm);
            const newComment = {
                id: generateUniqueId(),
                targetId: targetIdInput.value,
                author: document.getElementById('comment-author').value.trim() || 'Anonymous',
                email: document.getElementById('comment-email').value.trim(),
                type: document.getElementById('comment-type').value,
                text: document.getElementById('comment-text').value.trim(),
                isPublic: document.getElementById('comment-public').checked,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                location: window.location.href
            };

            if (newComment.text.length === 0) {
                showToast('Please enter a comment', 'error');
                return;
            }

            if (newComment.text.length > 1000) {
                showToast('Comment is too long (max 1000 characters)', 'error');
                return;
            }

            try {
                showLoadingOverlay('Submitting comment...');
                await saveComment(newComment);
                closeCommentModal();
                showToast('Comment submitted successfully!', 'success');
                
                // Update local display immediately
                state.comments.push(newComment);
                renderComments();
                
            } catch (error) {
                console.error('Error submitting comment:', error);
                showToast('Failed to submit comment. Please try again.', 'error');
            } finally {
                hideLoadingOverlay();
            }
        });
        
        // Modal close handlers
        closeModalBtn?.addEventListener('click', closeCommentModal);
        document.getElementById('cancel-comment')?.addEventListener('click', closeCommentModal);
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCommentModal();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.style.display === 'flex') {
                closeCommentModal();
            }
        });
    }

    function initializeCommentIcons() {
        const commentableElements = document.querySelectorAll(
            '.section-content p, .section-content li, .section-content h3, .section-content h4, ' +
            '.feature-card, .api-endpoint, .highlight-item, .principle-card, .tech-category'
        );
        
        commentableElements.forEach((el, index) => {
            const id = el.dataset.docId || `doc-element-${Date.now()}-${index}`;
            el.dataset.docId = id;
            
            // Remove existing comment icon if present
            const existingIcon = el.querySelector('.comment-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            
            // Create new comment icon
            const icon = document.createElement('button');
            icon.className = 'comment-icon';
            icon.innerHTML = '💬';
            icon.title = 'Add a comment to this section';
            icon.setAttribute('aria-label', 'Add comment');
            icon.tabIndex = 0;
            
            // Position the icon
            el.style.position = 'relative';
            el.prepend(icon);

            // Event handlers
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                openCommentModal(id, el.textContent.trim());
            });
            
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCommentModal(id, el.textContent.trim());
                }
            });
        });
    }

    function openCommentModal(element, targetText, targetId) {
        const modal = document.getElementById('comment-modal');
        const targetIdInput = document.getElementById('comment-target-id');
        const targetTextElement = document.getElementById('comment-target-text');
        const commentForm = document.getElementById('comment-form');
        
        if (!modal || !targetIdInput || !targetTextElement) return;
        
        // Set the target ID (use element's existing ID or the provided targetId)
        const finalTargetId = targetId || (element && element.id) || generateUniqueId();
        targetIdInput.value = finalTargetId;
        
        // Set the target text display
        const displayText = targetText || (element && element.textContent.trim()) || 'Selected text';
        targetTextElement.textContent = displayText.length > 100 ? 
            displayText.substring(0, 100) + '...' : displayText;
        
        // Reset form
        commentForm?.reset();
        document.getElementById('comment-public').checked = true;
        
        // Show modal with animation
        modal.style.display = 'flex';
        modal.classList.add('fade-in');
        
        // Focus management
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Trap focus within modal
        trapFocus(modal);
    }

    function closeCommentModal() {
        const modal = document.getElementById('comment-modal');
        if (!modal) return;
        
        modal.style.display = 'none';
        modal.classList.remove('fade-in');
        
        // Return focus to the comment icon that opened the modal
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('comment-icon')) {
            activeElement.focus();
        }
    }

    async function loadComments() {
        try {
            // Try to load from GitHub Issues API first
            const githubComments = await loadCommentsFromGitHub();
            
            if (githubComments && githubComments.length > 0) {
                state.comments = githubComments;
                renderComments();
                updateGitHubStatus('online');
                return;
            }
            
            // Fallback to local JSON file
            const response = await fetch(`comments.json?v=${Date.now()}`);
            if (response.ok) {
                state.comments = await response.json();
                renderComments();
            }
            
        } catch (error) {
            console.warn('Could not load comments:', error);
            state.comments = [];
            updateGitHubStatus('offline');
        }
    }

    async function loadCommentsFromGitHub() {
        if (!CONFIG.github.token || !CONFIG.github.issueNumber) {
            return null;
        }
        
        try {
            const response = await fetch(
                `${CONFIG.github.apiBase}/repos/${CONFIG.github.owner}/${CONFIG.github.repo}/issues/${CONFIG.github.issueNumber}/comments`,
                {
                    headers: {
                        'Authorization': `token ${CONFIG.github.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const comments = await response.json();
            return comments.map(comment => parseGitHubComment(comment));
            
        } catch (error) {
            console.error('Error loading comments from GitHub:', error);
            return null;
        }
    }

    function parseGitHubComment(githubComment) {
        // Parse comment body to extract our structured data
        const body = githubComment.body;
        const lines = body.split('\n');
        
        // Try to extract structured data, fallback to simple format
        try {
            const jsonMatch = body.match(/```json\n(.*?)\n```/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
        } catch (e) {
            // Fallback parsing
        }
        
        return {
            id: githubComment.id.toString(),
            targetId: 'unknown',
            author: githubComment.user.login,
            text: body,
            timestamp: githubComment.created_at,
            isPublic: true,
            type: 'feedback',
            source: 'github'
        };
    }

    async function saveComment(comment) {
        // Save comment locally (works alongside Hypothesis for local notes)
        try {
            // Get existing comments from localStorage
            const existingComments = JSON.parse(localStorage.getItem('local-comments') || '[]');
            existingComments.push(comment);
            localStorage.setItem('local-comments', JSON.stringify(existingComments));
            
            // Update the state
            state.comments = existingComments;
            
            showToast('Local note saved! Use Hypothesis for public annotations.', 'success');
        } catch (error) {
            console.error('Error saving local comment:', error);
            showToast('Error saving note', 'error');
            throw error;
        }
    }
    
    async function loadComments() {
        try {
            // Load comments from localStorage
            const localComments = JSON.parse(localStorage.getItem('local-comments') || '[]');
            state.comments = localComments;
            renderComments();
        } catch (error) {
            console.warn('Could not load local comments:', error);
            state.comments = [];
        }
    }

    function renderComments() {
        // Clear existing comment displays
        document.querySelectorAll('.comment-display-area').forEach(area => area.remove());
        
        // Group comments by target element
        const commentsByTarget = state.comments.reduce((acc, comment) => {
            const targetId = comment.targetId;
            if (!acc[targetId]) acc[targetId] = [];
            acc[targetId].push(comment);
            return acc;
        }, {});

        // Render comments for each target
        Object.entries(commentsByTarget).forEach(([targetId, comments]) => {
            const targetElement = document.querySelector(`[data-doc-id="${targetId}"]`);
            if (!targetElement) return;

            const displayArea = createCommentDisplayArea(comments);
            targetElement.insertAdjacentElement('afterend', displayArea);
        });
    }

    function createCommentDisplayArea(comments) {
        const displayArea = document.createElement('div');
        displayArea.className = 'comment-display-area';
        displayArea.setAttribute('role', 'region');
        displayArea.setAttribute('aria-label', 'Comments for this section');

        const header = document.createElement('h4');
        header.textContent = `💬 Comments (${comments.length})`;
        header.style.margin = '0 0 1rem 0';
        header.style.fontSize = 'var(--text-base)';
        header.style.color = 'var(--primary)';
        displayArea.appendChild(header);

        comments
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .forEach(comment => {
                const commentBox = createCommentBox(comment);
                displayArea.appendChild(commentBox);
            });

        return displayArea;
    }

    function createCommentBox(comment) {
        const commentBox = document.createElement('div');
        commentBox.className = 'comment-box';
        
        const header = document.createElement('div');
        header.className = 'comment-header';
        
        const author = document.createElement('span');
        author.className = 'comment-author';
        author.textContent = comment.author;
        
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = new Date(comment.timestamp).toLocaleString();
        
        const type = document.createElement('span');
        type.className = 'comment-type';
        type.textContent = comment.type || 'feedback';
        type.style.fontSize = 'var(--text-xs)';
        type.style.padding = '2px 6px';
        type.style.background = 'var(--bg)';
        type.style.borderRadius = 'var(--border-radius-sm)';
        type.style.marginLeft = 'var(--space-sm)';
        
        header.appendChild(author);
        header.appendChild(date);
        header.appendChild(type);
        
        const body = document.createElement('div');
        body.className = 'comment-body';
        body.textContent = comment.text;
        
        commentBox.appendChild(header);
        commentBox.appendChild(body);
        
        return commentBox;
    }
    // --- Translation System ---
    
    function initializeTranslation() {
        const translationToggle = document.getElementById('translation-toggle');
        const translationModal = document.getElementById('translation-modal');
        const closeTranslationBtn = translationModal?.querySelector('.modal-close-btn');
        const applyTranslationBtn = document.getElementById('apply-translation');
        const cancelTranslationBtn = document.getElementById('cancel-translation');
        
        translationToggle?.addEventListener('click', () => {
            if (translationModal) {
                translationModal.style.display = 'block';
                translationModal.classList.add('fade-in');
                
                // Focus on first language option
                const firstLangOption = translationModal.querySelector('.lang-option');
                if (firstLangOption) {
                    firstLangOption.focus();
                }
                
                // Translation modal opened
            }
        });
        
        closeTranslationBtn?.addEventListener('click', closeTranslationModal);
        cancelTranslationBtn?.addEventListener('click', closeTranslationModal);
        
        applyTranslationBtn?.addEventListener('click', async () => {
            const selectedLang = document.querySelector('.lang-option.selected')?.dataset.lang;
            const scope = document.querySelector('input[name="translation-scope"]:checked')?.value;
            
            if (!selectedLang) {
                showToast('Please select a target language', 'warning');
                return;
            }
            
            try {
                showLoadingOverlay('Translating content...');
                await translateContent(selectedLang, scope);
                closeTranslationModal();
                showToast(`Content translated to ${getLanguageName(selectedLang)}`, 'success');
            } catch (error) {
                console.error('Translation error:', error);
                showToast('Translation failed. Please try again.', 'error');
            } finally {
                hideLoadingOverlay();
            }
        });
        
        // Language option selection
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.lang-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        translationModal?.addEventListener('click', (e) => {
            if (e.target === translationModal) {
                closeTranslationModal();
            }
        });
    }
    
    function closeTranslationModal() {
        const modal = document.getElementById('translation-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    async function translateContent(targetLang, scope) {
        const elementsToTranslate = scope === 'current-section' 
            ? getCurrentSectionElements()
            : getAllTranslatableElements();
            
        for (const element of elementsToTranslate) {
            const originalText = element.textContent;
            const cacheKey = `${originalText}-${targetLang}`;
            
            // Check cache first
            if (state.translationCache.has(cacheKey)) {
                element.textContent = state.translationCache.get(cacheKey);
                continue;
            }
            
            try {
                const translatedText = await translateText(originalText, targetLang);
                element.textContent = translatedText;
                state.translationCache.set(cacheKey, translatedText);
                
                // Add visual indicator
                element.classList.add('translated');
                element.setAttribute('data-original', originalText);
                element.setAttribute('data-lang', targetLang);
                
            } catch (error) {
                console.error('Failed to translate:', originalText, error);
            }
        }
        
        state.currentLanguage = targetLang;
        document.documentElement.setAttribute('lang', targetLang);
    }
    
    async function translateText(text, targetLang) {
        // This would integrate with a real translation service
        // For demo purposes, return placeholder
        return `[${targetLang.toUpperCase()}] ${text}`;
    }
    
    function getCurrentSectionElements() {
        if (!state.currentSection) return [];
        const section = document.getElementById(state.currentSection);
        return section ? section.querySelectorAll('p, li, h3, h4, h5') : [];
    }
    
    function getAllTranslatableElements() {
        return document.querySelectorAll('.content p, .content li, .content h3, .content h4, .content h5');
    }
    
    function getLanguageName(code) {
        const languages = {
            'es': 'Spanish',
            'fr': 'French', 
            'de': 'German',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'ja': 'Japanese',
            'ko': 'Korean',
            'pt': 'Portuguese'
        };
        return languages[code] || code;
    }

    // --- Narration System ---
    
    function initializeNarration() {
        const narrationToggle = document.getElementById('narration-toggle');
        const narrationPanel = document.getElementById('narration-controls');
        const closeNarrationBtn = document.getElementById('close-narration');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const speedSlider = document.getElementById('narration-speed');
        const speedDisplay = document.getElementById('speed-display');
        const voiceSelect = document.getElementById('narration-voice');
        
        narrationToggle?.addEventListener('click', () => {
            if (narrationPanel.style.display === 'none' || !narrationPanel.style.display) {
                narrationPanel.style.display = 'block';
                loadVoices();
            } else {
                narrationPanel.style.display = 'none';
                stopNarration();
            }
        });
        
        closeNarrationBtn?.addEventListener('click', () => {
            narrationPanel.style.display = 'none';
            stopNarration();
        });
        
        playPauseBtn?.addEventListener('click', toggleNarration);
        stopBtn?.addEventListener('click', stopNarration);
        
        speedSlider?.addEventListener('input', (e) => {
            CONFIG.narration.defaultSpeed = parseFloat(e.target.value);
            speedDisplay.textContent = `${e.target.value}x`;
            updateSpeechRate();
        });
        
        voiceSelect?.addEventListener('change', (e) => {
            CONFIG.narration.defaultVoice = e.target.value;
        });
        
        // Auto-scroll and highlight checkboxes
        document.getElementById('auto-scroll')?.addEventListener('change', (e) => {
            CONFIG.narration.autoScroll = e.target.checked;
        });
        
        document.getElementById('highlight-text')?.addEventListener('change', (e) => {
            CONFIG.narration.highlightText = e.target.checked;
        });
    }
    
    function loadVoices() {
        if (state.voicesLoaded) return;
        
        const voices = speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('narration-voice');
        
        if (voiceSelect && voices.length > 0) {
            voiceSelect.innerHTML = '<option value="">Default</option>';
            voices.forEach((voice, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            state.voicesLoaded = true;
        }
    }
    
    function toggleNarration() {
        if (state.isNarrating) {
            pauseNarration();
        } else {
            startNarration();
        }
    }
    
    function startNarration() {
        const textToRead = getCurrentSectionText();
        if (!textToRead) {
            showToast('No text available for narration', 'warning');
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        // Configure voice settings
        if (CONFIG.narration.defaultVoice) {
            const voices = speechSynthesis.getVoices();
            utterance.voice = voices[CONFIG.narration.defaultVoice];
        }
        
        utterance.rate = CONFIG.narration.defaultSpeed;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Event handlers
        utterance.onstart = () => {
            state.isNarrating = true;
            updateNarrationControls();
        };
        
        utterance.onend = () => {
            state.isNarrating = false;
            updateNarrationControls();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            showToast('Narration error occurred', 'error');
            state.isNarrating = false;
            updateNarrationControls();
        };
        
        speechSynthesis.speak(utterance);
        state.currentUtterance = utterance;
    }
    
    function pauseNarration() {
        speechSynthesis.pause();
        state.isNarrating = false;
        updateNarrationControls();
    }
    
    function stopNarration() {
        speechSynthesis.cancel();
        state.isNarrating = false;
        state.currentUtterance = null;
        updateNarrationControls();
    }
    
    function updateSpeechRate() {
        if (state.currentUtterance) {
            state.currentUtterance.rate = CONFIG.narration.defaultSpeed;
        }
    }
    
    function updateNarrationControls() {
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');
        
        if (playIcon && pauseIcon) {
            if (state.isNarrating) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }
    
    function getCurrentSectionText() {
        if (!state.currentSection) return null;
        
        const section = document.getElementById(state.currentSection);
        if (!section) return null;
        
        const textElements = section.querySelectorAll('p, li, h3, h4, h5');
        return Array.from(textElements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0)
            .join('. ');
    }

    // --- GitHub Integration ---
    
    // --- Hypothesis Integration ---
    
    function initializeHypothesisIntegration() {
        // Hypothesis will be loaded automatically via the script tag
        // We can add custom styling to make it work better with our theme
        
        // Add custom CSS for Hypothesis to match our theme
        const style = document.createElement('style');
        style.textContent = `
            /* Customize Hypothesis to match our theme */
            .hypothesis-adder {
                z-index: var(--z-tooltip) !important;
            }
            
            .hypothesis-sidebar {
                font-family: var(--font-sans) !important;
            }
            
            /* Dark theme support for Hypothesis */
            [data-theme="dark"] .hypothesis-highlight {
                background: rgba(255, 215, 0, 0.3) !important;
            }
            
            [data-theme="dark"] .hypothesis-sidebar {
                background: var(--content-bg) !important;
                color: var(--text) !important;
            }
        `;
        document.head.appendChild(style);
        
        // Add a note about Hypothesis in the toast
        setTimeout(() => {
            showToast('💡 Tip: Highlight any text to add annotations with Hypothesis!', 'info');
        }, 3000);
    }

    // --- Accessibility Features ---
    
    function initializeAccessibility() {
        // Focus management
        setupFocusTrapping();
        setupKeyboardNavigation();
        setupScreenReaderSupport();
        
        // High contrast mode detection
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // Reduced motion detection
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }
    
    function setupFocusTrapping() {
        // This function would implement focus trapping for modals
        // Implementation would ensure focus stays within modal when open
    }
    
    function setupKeyboardNavigation() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + T for theme toggle
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                document.getElementById('theme-toggle')?.click();
            }
            
            // Alt + S for search focus
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                document.getElementById('search-bar')?.focus();
            }
            
            // Alt + C for comment mode toggle
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                document.getElementById('comment-mode-toggle')?.click();
            }
        });
    }
    
    function setupScreenReaderSupport() {
        // Add ARIA live regions for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'screen-reader-announcements';
        document.body.appendChild(liveRegion);
    }
    
    function announceToScreenReader(message) {
        const liveRegion = document.getElementById('screen-reader-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    function trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    // --- Responsive Features ---
    
    function initializeResponsiveFeatures() {
        setupMobileMenu();
        setupTouchGestures();
        setupResponsiveModals();
    }
    
    function setupMobileMenu() {
        // Add mobile menu toggle to controls bar for smaller screens
        const controlsBar = document.querySelector('.interactive-controls-bar .control-group');
        
        if (controlsBar && window.innerWidth <= 1024) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'control-btn mobile-menu-toggle';
            mobileToggle.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
                <span class="control-label">Menu</span>
            `;
            
            mobileToggle.addEventListener('click', toggleMobileSidebar);
            controlsBar.insertBefore(mobileToggle, controlsBar.firstChild);
        }
    }
    
    function toggleMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.querySelector('.sidebar-backdrop') || createSidebarBackdrop();
        
        sidebar?.classList.toggle('active');
        backdrop?.classList.toggle('active');
    }
    
    function createSidebarBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.addEventListener('click', toggleMobileSidebar);
        document.body.appendChild(backdrop);
        return backdrop;
    }
    
    function setupTouchGestures() {
        // Basic touch gesture support for mobile navigation
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Swipe right to open sidebar (on mobile)
            if (deltaX > 100 && Math.abs(deltaY) < 50 && window.innerWidth <= 1024) {
                const sidebar = document.querySelector('.sidebar');
                if (!sidebar?.classList.contains('active')) {
                    toggleMobileSidebar();
                }
            }
            
            // Swipe left to close sidebar
            if (deltaX < -100 && Math.abs(deltaY) < 50 && window.innerWidth <= 1024) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar?.classList.contains('active')) {
                    toggleMobileSidebar();
                }
            }
        });
    }
    
    function setupResponsiveModals() {
        // Ensure modals work well on mobile devices
        const modals = document.querySelectorAll('.modal-overlay');
        
        modals.forEach(modal => {
            // Prevent background scroll when modal is open
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style') {
                        const isVisible = modal.style.display === 'flex';
                        document.body.style.overflow = isVisible ? 'hidden' : '';
                    }
                });
            });
            
            observer.observe(modal, { attributes: true });
        });
    }

    // --- Utility Functions ---
    
    function generateUniqueId() {
        return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
        
        // Announce to screen readers
        announceToScreenReader(message);
    }
    
    function showLoadingOverlay(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay?.querySelector('.loading-text');
        
        if (overlay) {
            if (text) text.textContent = message;
            overlay.style.display = 'flex';
        }
    }
    
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // --- Export and Print Functions ---
    
    function initializeExportFeatures() {
        const exportBtn = document.getElementById('print-export');
        
        exportBtn?.addEventListener('click', () => {
            showExportOptions();
        });
    }
    
    function showExportOptions() {
        const options = [
            { label: 'Print Document', action: () => window.print() },
            { label: 'Export as PDF', action: exportAsPDF },
            { label: 'Save as HTML', action: saveAsHTML },
            { label: 'Copy Markdown', action: copyAsMarkdown }
        ];
        
        // This would show a dropdown or modal with export options
        showToast('Export options: Print (Ctrl+P), PDF, HTML, Markdown', 'info');
        window.print(); // For now, just trigger print
    }
    
    function exportAsPDF() {
        // This would integrate with a PDF generation library
        showToast('PDF export would be implemented here', 'info');
    }
    
    function saveAsHTML() {
        const html = document.documentElement.outerHTML;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ecosentinel-documentation.html';
        a.click();
        
        URL.revokeObjectURL(url);
        showToast('HTML file saved successfully', 'success');
    }
    
    function copyAsMarkdown() {
        // This would convert the content to Markdown format
        showToast('Markdown copy would be implemented here', 'info');
    }
    
    // --- Comment Mode Toggle ---
    
    function initializeCommentModeToggle() {
        const commentModeToggle = document.getElementById('comment-mode-toggle');
        let commentsVisible = true;
        
        commentModeToggle?.addEventListener('click', () => {
            commentsVisible = !commentsVisible;
            toggleCommentVisibility(commentsVisible);
            
            commentModeToggle.classList.toggle('active', commentsVisible);
            
            const action = commentsVisible ? 'enabled' : 'disabled';
            showToast(`Comment mode ${action}`, 'info');
            announceToScreenReader(`Comment mode ${action}`);
        });
    }
    
    function toggleCommentVisibility(visible) {
        const commentIcons = document.querySelectorAll('.comment-icon');
        const commentAreas = document.querySelectorAll('.comment-display-area');
        
        commentIcons.forEach(icon => {
            icon.style.display = visible ? '' : 'none';
        });
        
        commentAreas.forEach(area => {
            area.style.display = visible ? '' : 'none';
        });
    }
    
    // --- Initialize Everything ---
    
    // Call initialization when DOM is ready
    initializeSystem();
    initializeExportFeatures();
    initializeCommentModeToggle();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isNarrating) {
            pauseNarration();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            // Close mobile sidebar on desktop
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.querySelector('.sidebar-backdrop');
            
            sidebar?.classList.remove('active');
            backdrop?.classList.remove('active');
        }
    });
    
    // Load voices when speech synthesis is ready
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            state.voicesLoaded = false;
            loadVoices();
        };
    }
    
    // --- Text Selection Interactive Features ---
    
    function initializeTextSelection() {
        let selectionMenu = null;
        let currentSelection = null;
        
        // Create selection menu
        function createSelectionMenu() {
            const menu = document.createElement('div');
            menu.className = 'text-selection-menu';
            menu.style.display = 'none';
            
            const actions = [
                { icon: '💬', label: 'Comment', action: 'comment' },
                { icon: '🌐', label: 'Translate', action: 'translate' },
                { icon: '🔊', label: 'Listen', action: 'narrate' },
                { icon: '📋', label: 'Copy', action: 'copy' },
                { icon: '📤', label: 'Share', action: 'share' },
                { icon: '🔗', label: 'Link', action: 'link' }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'selection-action-btn';
                button.setAttribute('data-action', action.action);
                button.setAttribute('title', action.label);
                button.innerHTML = `<span class="action-icon">${action.icon}</span>`;
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleSelectionAction(action.action, currentSelection);
                });
                
                menu.appendChild(button);
            });
            
            document.body.appendChild(menu);
            return menu;
        }
        
        // Handle text selection
        function handleTextSelection(e) {
            const selection = window.getSelection();
            
            // Text selection event triggered
            
            if (selection.rangeCount === 0 || selection.toString().trim().length === 0) {
                hideSelectionMenu();
                return;
            }
            
            const selectedText = selection.toString().trim();
            if (selectedText.length < 3) {
                // Text too short for selection menu
                hideSelectionMenu();
                return;
            }
            
            // Creating selection menu for selected text
            
            currentSelection = {
                text: selectedText,
                range: selection.getRangeAt(0).cloneRange(),
                element: selection.anchorNode.parentElement
            };
            
            showSelectionMenu(selection.getRangeAt(0));
        }
        
        // Show selection menu
        function showSelectionMenu(range) {
            // Show selection menu for text range
            
            if (!selectionMenu) {
                // Creating new selection menu
                selectionMenu = createSelectionMenu();
            }
            
            const rect = range.getBoundingClientRect();
            const menuWidth = 280;
            const menuHeight = 50;
            
            let left = rect.left + (rect.width / 2) - (menuWidth / 2);
            let top = rect.top - menuHeight - 10;
            
            // Keep menu within viewport
            if (left < 10) left = 10;
            if (left + menuWidth > window.innerWidth - 10) {
                left = window.innerWidth - menuWidth - 10;
            }
            
            if (top < 10) {
                top = rect.bottom + 10;
            }
            
            // Position menu near selection
            
            selectionMenu.style.left = `${left}px`;
            selectionMenu.style.top = `${top}px`;
            selectionMenu.style.display = 'flex';
            selectionMenu.classList.add('show');
            
            // Selection menu is now visible
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                if (selectionMenu && selectionMenu.classList.contains('show')) {
                    // Auto-hiding selection menu
                    hideSelectionMenu();
                }
            }, 8000);
        }
        
        // Hide selection menu
        function hideSelectionMenu() {
            if (selectionMenu) {
                selectionMenu.style.display = 'none';
                selectionMenu.classList.remove('show');
            }
            currentSelection = null;
        }
        
        // Handle selection actions
        async function handleSelectionAction(action, selection) {
            if (!selection) return;
            
            try {
                switch (action) {
                    case 'comment':
                        try {
                            const targetId = generateUniqueId();
                            if (selection.element && !selection.element.hasAttribute('data-comment-id')) {
                                selection.element.setAttribute('data-comment-id', targetId);
                            }
                            openCommentModal(selection.element, selection.text, targetId);
                        } catch (error) {
                            console.error('Error opening comment modal:', error);
                            showToast('Error opening comment modal', 'error');
                        }
                        break;
                    case 'translate':
                        try {
                            const translationModal = document.getElementById('translation-modal');
                            if (translationModal) {
                                translationModal.setAttribute('data-selection-text', selection.text);
                                translationModal.style.display = 'flex';
                                translationModal.classList.add('fade-in');
                                
                                // Update modal content with selected text
                                const selectedTextDisplay = translationModal.querySelector('.selected-text-display');
                                if (selectedTextDisplay) {
                                    selectedTextDisplay.textContent = selection.text.length > 100 ? 
                                        selection.text.substring(0, 100) + '...' : selection.text;
                                }
                                
                                // Focus on first language option
                                const firstLangOption = translationModal.querySelector('.lang-option');
                                if (firstLangOption) {
                                    setTimeout(() => firstLangOption.focus(), 100);
                                }
                                
                                // Trap focus within modal
                                trapFocus(translationModal);
                            } else {
                                showToast('Translation modal not found', 'error');
                            }
                        } catch (error) {
                            console.error('Error opening translation modal:', error);
                            showToast('Error opening translation modal', 'error');
                        }
                        break;
                    case 'narrate':
                        const utterance = new SpeechSynthesisUtterance(selection.text);
                        utterance.rate = CONFIG.narration.defaultSpeed;
                        speechSynthesis.speak(utterance);
                        showToast('Playing selected text', 'info');
                        break;
                    case 'copy':
                        await navigator.clipboard.writeText(selection.text);
                        showToast('Text copied to clipboard', 'success');
                        break;
                    case 'share':
                        if (navigator.share) {
                            await navigator.share({
                                title: 'EcoSentinel Documentation',
                                text: selection.text,
                                url: window.location.href
                            });
                        }
                        break;
                    case 'link':
                        const elementId = selection.element.id || generateUniqueId();
                        if (!selection.element.id) {
                            selection.element.id = elementId;
                        }
                        const link = `${window.location.origin}${window.location.pathname}#${elementId}`;
                        await navigator.clipboard.writeText(link);
                        showToast('Link copied to clipboard', 'success');
                        break;
                }
            } catch (error) {
                console.error(`Error handling ${action}:`, error);
                showToast(`Error: Could not ${action} selection`, 'error');
            } finally {
                hideSelectionMenu();
            }
        }
        
        // Event listeners for text selection
        document.addEventListener('mouseup', (e) => {
            setTimeout(() => handleTextSelection(e), 100); // Small delay to ensure selection is complete
        });
        
        document.addEventListener('keyup', (e) => {
            // Only trigger on selection-related keys
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Shift') {
                setTimeout(() => handleTextSelection(e), 100);
            }
        });
        
        // Hide menu when clicking outside or scrolling
        document.addEventListener('click', (e) => {
            if (selectionMenu && !selectionMenu.contains(e.target)) {
                hideSelectionMenu();
            }
        });
        
        document.addEventListener('scroll', () => {
            hideSelectionMenu();
        });
        
        // Initialize immediately to ensure it's working
        // Text selection functionality initialized
        
        // Add a temporary status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #00B04F;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            font-family: monospace;
        `;
        statusIndicator.textContent = 'Text Selection: Ready';
        document.body.appendChild(statusIndicator);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (statusIndicator.parentElement) {
                statusIndicator.remove();
            }
        }, 5000);
    }
    
    // --- Utility Functions ---
    
    // EcoSentinel Documentation System Fully Loaded

});

// Language Selector
function initializeLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    languageSelect?.addEventListener('change', (event) => {
        const selectedLanguage = event.target.value;
        state.currentLanguage = selectedLanguage;
        showToast(`Language changed to ${selectedLanguage}`, 'info');
        // Add logic to update content based on selected language
    });
}

// Translation Button
function initializeTranslationButton() {
    const translationButton = document.getElementById('translation-toggle');
    translationButton?.addEventListener('click', () => {
        showToast('Translation feature triggered', 'info');
        // Add logic for translation modal or API call
    });
}

// Narration Button
function initializeNarrationButton() {
    const narrationButton = document.getElementById('narration-toggle');
    narrationButton?.addEventListener('click', () => {
        showToast('Narration feature triggered', 'info');
        // Add logic for narration functionality
    });
}

// Remove Comment Button
function initializeCommentButton() {
    const commentButton = document.getElementById('comment-toggle');
    commentButton?.addEventListener('click', () => {
        if (CONFIG.hypothesis.enabled) {
            window.open('https://hypothes.is', '_blank');
        } else {
            showToast('Hypothesis integration is disabled', 'error');
        }
    });
}

// Initialize all buttons
initializeLanguageSelector();
initializeTranslationButton();
initializeNarrationButton();
initializeCommentButton();
