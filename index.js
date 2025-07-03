document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration --- //
    const GITHUB_REPO = 'Lightming99/documentations'; // Format: 'username/repo-name'

    // --- Sidebar Active Link Highlighter ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.sidebar ul li a');

    const observerOptions = {
        root: null, // observes intersections in the viewport
        rootMargin: '0px',
        threshold: 0.3 // trigger when 30% of the section is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                let activeLinkFound = false;
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                        activeLinkFound = true;
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Code Block Copy Button ---
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pre = button.nextElementSibling;
            const code = pre.querySelector('code');
            const textToCopy = code ? code.innerText : pre.innerText;

            navigator.clipboard.writeText(textToCopy).then(() => {
                button.innerText = 'Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.innerText = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                button.innerText = 'Error';
            });
        });
    });

    // --- Theme Switcher ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    // Function to update button text and theme
    function updateTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            themeToggleBtn.textContent = '🌙 Dark Mode';
        } else {
            document.body.classList.remove('light-mode');
            themeToggleBtn.textContent = '☀️ Light Mode';
        }
    }

    // Apply saved theme on load
    if (currentTheme === 'light') {
        updateTheme('light');
    } else {
        updateTheme('dark');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const isLightMode = document.body.classList.contains('light-mode');
        const newTheme = isLightMode ? 'dark' : 'light';
        
        updateTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- Dynamic Footer Date ---
    const lastUpdatedSpan = document.getElementById('last-updated');
    if (lastUpdatedSpan) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lastUpdatedSpan.textContent = today.toLocaleDateString('en-US', options);
    }

    // --- Narration for Sections ---
    const narrateButtons = document.querySelectorAll('.narrate-btn');
    const synth = window.speechSynthesis;

    narrateButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (synth.speaking) {
                synth.cancel(); // Stop speaking
                return;
            }
            const section = button.closest('section');
            if (section) {
                const textToSpeak = Array.from(section.querySelectorAll('h2, h3, p, li, th, td'))
                    .map(el => el.textContent)
                    .join(' ');
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.onend = () => {
                    button.textContent = '🔊';
                };
                synth.speak(utterance);
                button.textContent = '❚❚';
            }
        });
    });

    // --- Comment Modal Logic ---
    const commentModal = document.getElementById('comment-modal-overlay'); // Corrected selector
    const closeModalBtn = document.querySelector('.close-btn');
    const cancelCommentBtn = document.getElementById('cancel-comment-btn'); // Added cancel button
    const commentForm = document.getElementById('comment-form');
    const commentIcons = document.querySelectorAll('.comment-icon');
    const commentModalTitle = document.getElementById('comment-modal-title-display'); // Corrected selector
    const commentContextIdInput = document.getElementById('comment-context-id');
    const commentContextTitleInput = document.getElementById('comment-context-title');
    const commentTextInput = document.getElementById('comment-text');
    const commentNameInput = document.getElementById('comment-name'); // Added name input
    const submitCommentBtn = document.getElementById('submit-comment-btn');

    const openModal = (sectionId, sectionTitle, selectedText = '') => {
        commentModalTitle.textContent = sectionTitle;
        commentContextIdInput.value = sectionId;
        commentContextTitleInput.value = sectionTitle;
        
        if (selectedText) {
            commentTextInput.value = `> ${selectedText}\\n\\n`;
        } else {
            commentTextInput.value = '';
        }

        commentModal.classList.remove('hidden'); // Use class to show
        commentTextInput.focus();
    };

    const closeModal = () => {
        commentModal.classList.add('hidden'); // Use class to hide
    };

    commentIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const sectionId = e.target.dataset.sectionId;
            const sectionTitle = e.target.dataset.sectionTitle;
            openModal(sectionId, sectionTitle);
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === commentModal) {
            closeModal();
        }
    });

    cancelCommentBtn.addEventListener('click', closeModal); // Added event listener for new cancel button

    // --- Comment Form Submission (Frontend-Only for GitHub Pages) ---
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Use the correct variable names as declared above
        const sectionId = commentContextIdInput.value;
        const sectionTitle = commentModalTitle.textContent;
        const userName = commentNameInput.value.trim();
        const commentText = commentTextInput.value.trim();

        if (!commentText) {
            alert('Please enter a comment.');
            return;
        }

        const issueTitle = `Feedback on: ${sectionTitle}`;
        let issueBody = `**Section ID:** \`${sectionId}\`\n**Context:** [Link to Section](${window.location.href.split('#')[0]}#${sectionId})\n`;
        if (userName) {
            issueBody += `**Submitted by:** ${userName}\n`;
        }
        issueBody += `\n---_\n\n${commentText}`;

        // Construct the URL for the new issue page with pre-filled fields
        const githubUrl = `https://github.com/${GITHUB_REPO}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;

        // Open the GitHub new issue page in a new tab
        window.open(githubUrl, '_blank');

        // Provide feedback to the user and close the modal
        alert('Your feedback is ready to be submitted. Please review and submit the issue on the new GitHub tab that has opened.');
        closeModal();
        commentForm.reset();
    });

    // --- Selection Popover Functionality ---
    const popover = document.getElementById('selection-popover');
    const commentBtn = document.getElementById('comment-btn');
    const highlightBtn = document.getElementById('highlight-btn');
    let currentSelection = null;

    document.addEventListener('mouseup', (e) => {
        // Don't show popover if we're interacting with an interactive element
        if (e.target.closest('button, a, input, textarea')) {
            popover.style.display = 'none';
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0) {
            currentSelection = selection.getRangeAt(0).cloneRange();
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            popover.style.left = `${window.scrollX + rect.left + rect.width / 2 - popover.offsetWidth / 2}px`;
            popover.style.top = `${window.scrollY + rect.top - popover.offsetHeight - 10}px`;
            popover.style.display = 'block';
        } else {
            popover.style.display = 'none';
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (!popover.contains(e.target)) {
            popover.style.display = 'none';
        }
    });

    // Popover Comment button
    commentBtn.addEventListener('click', () => {
        if (currentSelection) {
            const selectedText = currentSelection.toString().trim();
            const sectionId = currentSelection.startContainer.parentElement.closest('section, .card')?.id || 'general-selection';
            const sectionTitle = `Selected Text in \"${sectionId}\"`;
            openModal(sectionId, sectionTitle, selectedText);
            popover.style.display = 'none';
        }
    });

    // Popover Highlight button
    highlightBtn.addEventListener('click', () => {
        if (currentSelection) {
            const mark = document.createElement('mark');
            try {
                currentSelection.surroundContents(mark);
                saveHighlights();
            } catch (e) {
                console.warn("Could not highlight selection directly, using fallback.");
                mark.appendChild(currentSelection.extractContents());
                currentSelection.insertNode(mark);
                saveHighlights();
            }
            window.getSelection().removeAllRanges();
            popover.style.display = 'none';
        }
    });

    // --- Toolbar Controls ---
    const printBtn = document.getElementById('print-btn');
    printBtn.addEventListener('click', () => window.print());

    const clearHighlightsBtn = document.getElementById('clear-highlights-btn');
    clearHighlightsBtn.addEventListener('click', () => {
        const contentArea = document.querySelector('.content');
        contentArea.querySelectorAll('mark').forEach(mark => {
            const parent = mark.parentNode;
            while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
            parent.normalize(); // Merges adjacent text nodes
        });
        localStorage.removeItem('docHighlights');
    });

    // --- Highlight Persistence ---
    function saveHighlights() {
        const content = document.querySelector('.content').innerHTML;
        localStorage.setItem('docHighlights', content);
    }

    function loadHighlights() {
        const savedContent = localStorage.getItem('docHighlights');
        if (savedContent) {
            // Be careful with re-injecting HTML. This is safe here because we control the source.
            document.querySelector('.content').innerHTML = savedContent;
            // Re-attach event listeners to any dynamic content that was overwritten
            re_attachEventListeners();
        }
    }

    function re_attachEventListeners() {
        // This function is crucial if loadHighlights() overwrites elements with listeners.
        // We need to re-bind events to the newly created DOM nodes.
        document.querySelectorAll('.copy-btn').forEach(addCopyListener);
        document.querySelectorAll('.narrate-btn').forEach(addNarrateListener);
        document.querySelectorAll('.comment-icon').forEach(addCommentListener);
    }

    // --- Live GitHub Comments ---
    const commentsContainer = document.getElementById('comments-container');

    async function fetchAndDisplayComments() {
        if (!commentsContainer) return;
        commentsContainer.innerHTML = '<p>Loading comments...</p>';

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&labels=feedback`);
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            const issues = await response.json();

            if (issues.length === 0) {
                commentsContainer.innerHTML = '<p>No feedback submitted yet. Be the first to comment!</p>';
                return;
            }

            commentsContainer.innerHTML = ''; // Clear loading message
            issues.forEach(issue => {
                const commentEl = document.createElement('div');
                commentEl.classList.add('comment-item');
                commentEl.innerHTML = `
                    <div class=\"comment-header\">
                        <img src=\"${issue.user.avatar_url}\" alt=\"${issue.user.login}\" width=\"30\" height=\"30\">
                        <a href=\"${issue.user.html_url}\" target=\"_blank\" rel=\"noopener noreferrer\">${issue.user.login}</a>
                        <span>commented on ${new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class=\"comment-body\">
                        <h4><a href=\"${issue.html_url}\" target=\"_blank\" rel=\"noopener noreferrer\">${issue.title}</a></h4>
                        <p>${issue.body.replace(/\\n/g, '<br>')}</p>
                    </div>
                `;
                commentsContainer.appendChild(commentEl);
            });
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            commentsContainer.innerHTML = '<p>Could not load comments. Please check the repository configuration and network connection.</p>';
        }
    }

    // Initial Load
    loadHighlights(); // This will re-attach listeners via re_attachEventListeners()
    fetchAndDisplayComments();
});

// --- Google Translate ---
function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
}