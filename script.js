document.addEventListener('DOMContentLoaded', () => {
    const hardshipForm = document.getElementById('hardship-form');
    const hardshipInput = document.getElementById('hardship-input');
    const categorySelect = document.getElementById('category-select');
    const hardshipContainer = document.getElementById('hardship-container');
    const filterSelect = document.getElementById('filter-select');
    const sortSelect = document.getElementById('sort-select');
    const loadMoreBtn = document.getElementById('load-more');
    const charCount = document.querySelector('.char-count');

    // Modal elements
    const homeIcon = document.getElementById('home-icon');
    const aboutIcon = document.getElementById('about-icon');
    const contactIcon = document.getElementById('contact-icon');
    const homeModal = document.getElementById('home-modal');
    const aboutModal = document.getElementById('about-modal');
    const contactModal = document.getElementById('contact-modal');
    const modalContainer = document.getElementById('modal-container');
    const closeHomeModalBtn = document.getElementById('close-home-modal');
    const closeAboutModalBtn = document.getElementById('close-about-modal');
    const closeContactModalBtn = document.getElementById('close-contact-modal');

    const MAX_CHARS = 1000; // Maximum character limit for the textarea
    let hardships = JSON.parse(localStorage.getItem('hardships')) || []; // Load hardships from localStorage
    let visibleHardships = 6; // Initial visible hardships count

    // Function to save hardships to localStorage
    function saveHardships() {
        localStorage.setItem('hardships', JSON.stringify(hardships));
    }

    // Function to render hardships on the page
    function renderHardships() {
        hardshipContainer.innerHTML = ''; // Clear existing hardships

        // Filter and sort hardships
        const filteredHardships = filterHardships(hardships, filterSelect.value);
        const sortedHardships = sortHardshipsByComments(filteredHardships);
        const hardshipsToShow = sortedHardships.slice(0, visibleHardships);

        // Render each hardship
        hardshipsToShow.forEach(hardship => renderHardship(hardship));

        // Show or hide the "Load More" button based on the number of visible hardships
        loadMoreBtn.style.display = visibleHardships >= sortedHardships.length ? 'none' : 'block';
    }

    // Function to sort hardships by the number of comments (least comments first)
    function sortHardshipsByComments(hardships) {
        return hardships.sort((a, b) => a.comments.length - b.comments.length);
    }

    // Function to render a single hardship card
    function renderHardship(hardship) {
        const hardshipCard = document.createElement('div');
        hardshipCard.classList.add('hardship-card', `category-${hardship.category}`, 'hidden');
        hardshipCard.dataset.id = hardship.id;

        hardshipCard.innerHTML = `
            <div class="category-tag category-${hardship.category}">${hardship.category}</div>
            <p class="hardship-text">${hardship.text}</p>
            <p class="hardship-meta">
                Posted: ${formatDate(hardship.createdAt)}
                ${hardship.lastEdited ? `<br>Last edited: ${formatDate(hardship.lastEdited)}` : ''}
            </p>
            <div class="hardship-actions">
                <button class="like-btn${hardship.isLiked ? ' liked' : ''}" onclick="toggleLike(${hardship.id})">
                    <i class="fas fa-heart"></i> <span class="like-count">${hardship.likes}</span>
                </button>
                <button class="comment-btn" onclick="showComments(${hardship.id})">
                    <i class="fas fa-comment"></i> ${hardship.comments.length}
                </button>
                <button class="edit-btn" onclick="editHardship(${hardship.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" onclick="deleteHardship(${hardship.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <div class="comments-section hidden" id="comments-${hardship.id}"></div>
        `;

        hardshipContainer.appendChild(hardshipCard);
        setTimeout(() => hardshipCard.classList.remove('hidden'), 10); // Animation for revealing the card
    }

    // Filter hardships based on category
    function filterHardships(hardships, category) {
        if (category === 'all') return hardships;
        return hardships.filter(h => h.category === category);
    }

    // Submit hardship form
    function submitHardship(e) {
        e.preventDefault();
        const hardshipText = hardshipInput.value.trim();
        const category = categorySelect.value;

        if (hardshipText && hardshipText.length <= MAX_CHARS && category) {
            const newHardship = {
                id: Date.now(),
                text: hardshipText,
                category: category,
                comments: [],
                likes: 0,
                isLiked: false,
                createdAt: new Date().toISOString(),
                lastEdited: null
            };

            hardships.unshift(newHardship); // Add the new hardship to the top
            saveHardships();
            renderHardships(); // Re-render the hardships list
            hardshipInput.value = ''; // Clear the form input
            categorySelect.value = ''; // Reset the category selection
            updateCharCount(); // Reset character count
        } else {
            alert(`Please enter a valid hardship (1-${MAX_CHARS} characters) and select a category.`);
        }
    }

    // Update character count as the user types
    function updateCharCount() {
        const currentLength = hardshipInput.value.length;
        charCount.textContent = `${currentLength} / ${MAX_CHARS}`;
        charCount.style.color = currentLength > MAX_CHARS ? 'red' : '';
    }

    hardshipInput.addEventListener('input', updateCharCount);
    hardshipForm.addEventListener('submit', submitHardship);

    // Like button functionality
    window.toggleLike = (id) => {
        const hardship = hardships.find(h => h.id === id);
        if (hardship) {
            hardship.isLiked = !hardship.isLiked;
            hardship.likes += hardship.isLiked ? 1 : -1;
            saveHardships();
            renderHardships();
        }
    };

    // Edit hardship functionality
    window.editHardship = (id) => {
        const hardship = hardships.find(h => h.id === id);
        if (hardship) {
            const newText = prompt('Edit your hardship:', hardship.text);
            if (newText !== null && newText.trim() !== '' && newText.length <= MAX_CHARS) {
                hardship.text = newText.trim();
                hardship.lastEdited = new Date().toISOString();
                saveHardships();
                renderHardships();
            } else if (newText && newText.length > MAX_CHARS) {
                alert(`Hardship text cannot exceed ${MAX_CHARS} characters.`);
            }
        }
    };

    // Delete hardship functionality
    window.deleteHardship = (id) => {
        if (confirm('Are you sure you want to delete this hardship?')) {
            hardships = hardships.filter(h => h.id !== id);
            saveHardships();
            renderHardships();
        }
    };

    // Show comments functionality
    window.showComments = (id) => {
        const hardship = hardships.find(h => h.id === id);
        if (hardship) {
            const commentsSection = document.getElementById(`comments-${id}`);
            commentsSection.classList.toggle('hidden');

            // Place comment form at the top, followed by the existing comments
            commentsSection.innerHTML = `
                <form class="comment-form">
                    <textarea placeholder="Add a comment..." required></textarea>
                    <button type="submit">Submit Comment</button>
                </form>
                <h3>Comments</h3>
                ${hardship.comments.length === 0 
                    ? '<p>No comments yet. Be the first to comment!</p>' 
                    : hardship.comments.map(comment => `
                        <div class="comment">
                            <p>${comment.text}</p>
                            <small>${formatDate(comment.createdAt)}</small>
                        </div>
                    `).join('')}
            `;

            // Handle comment form submission
            const commentForm = commentsSection.querySelector('.comment-form');
            commentForm.onsubmit = (e) => {
                e.preventDefault();
                const commentText = commentForm.querySelector('textarea').value.trim();
                if (commentText) {
                    const newComment = {
                        id: Date.now(),
                        text: commentText,
                        createdAt: new Date().toISOString()
                    };
                    hardship.comments.push(newComment);
                    saveHardships();
                    renderHardships(); // Re-render after new comment
                }
            };
        }
    };

    // Function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Event listeners for filters and sorting
    filterSelect.addEventListener('change', renderHardships);
    sortSelect.addEventListener('change', renderHardships);

    // Load more button functionality
    loadMoreBtn.addEventListener('click', () => {
        visibleHardships += 6;
        renderHardships();
    });

    // Modal logic
    function showModal(modal) {
        modal.classList.remove('hidden');
        modalContainer.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.classList.add('hidden');
        modalContainer.style.display = 'none';
    }

    // Event listeners for modals
    homeIcon.addEventListener('click', () => showModal(homeModal));
    aboutIcon.addEventListener('click', () => showModal(aboutModal));
    contactIcon.addEventListener('click', () => showModal(contactModal));

    closeHomeModalBtn.addEventListener('click', () => hideModal(homeModal));
    closeAboutModalBtn.addEventListener('click', () => hideModal(aboutModal));
    closeContactModalBtn.addEventListener('click', () => hideModal(contactModal));

    // Initial render of hardships
    renderHardships();

    // Auto-refresh every 10 seconds
    setInterval(() => {
        renderHardships();
    }, 10000);
});
