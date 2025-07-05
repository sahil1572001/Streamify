// DOM Elements
const elements = {
    // Navigation
    navbar: document.querySelector('.navbar'),
    
    // Search functionality
    searchBtn: document.getElementById('search-btn'),
    searchContainer: document.querySelector('.search-container'),
    closeSearch: document.querySelector('.close-search'),
    movieSearchInput: document.getElementById('main-search'),
    searchTermEl: document.querySelector('.search-term'),
    suggestionItem: document.querySelector('.suggestion-item'),
    
    
    // Hero slider
    heroSlides: document.querySelectorAll('.hero-slide'),
    
    // Carousel
    carousel: document.querySelector('.carousel'),
    carouselItems: document.querySelectorAll('.carousel-item')
};

// State
let currentSlide = 0;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            easing: 'ease-in-out',
            offset: 100
        });
    }

    // Initialize hero slider
    if (elements.heroSlides.length > 0) {
        elements.heroSlides[0].classList.add('active');
        setInterval(nextSlide, 5000);
    }

    // Initialize navbar scroll effect
    window.addEventListener('scroll', handleScroll);
    
    // Initialize search functionality
    initSearch();
    
    // Initialize carousel if it exists
    if (elements.carousel) {
        initCarousel();
    }
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
});

// Hero Slider Functions
function nextSlide() {
    if (elements.heroSlides.length === 0) return;
    
    elements.heroSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % elements.heroSlides.length;
    elements.heroSlides[currentSlide].classList.add('active');
}

// Navbar Scroll Effect
function handleScroll() {
    if (!elements.navbar) return;
    
    if (window.scrollY > 50) {
        elements.navbar.classList.add('scrolled');
    } else {
        elements.navbar.classList.remove('scrolled');
    }
}

// Search Functionality
function initSearch() {
    if (!elements.searchBtn || !elements.searchContainer || !elements.closeSearch || !elements.movieSearchInput) return;
    
    // Toggle search bar
    const toggleSearch = (show = true) => {
        if (show) {
            elements.searchContainer.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (elements.movieSearchInput) elements.movieSearchInput.focus();
        } else {
            elements.searchContainer.classList.remove('active');
            document.body.style.overflow = '';
            if (elements.movieSearchInput) elements.movieSearchInput.value = '';
            if (document.querySelector('.search-suggestions')) {
                document.querySelector('.search-suggestions').innerHTML = '';
            }
            const searchResults = document.getElementById('search-results');
            if (searchResults) searchResults.style.display = 'none';
        }
    };

    // Open search when search button is clicked
    elements.searchBtn.addEventListener('click', () => toggleSearch(true));

    // Close search when clicking outside
    elements.searchContainer.addEventListener('click', (e) => {
        if (e.target === elements.searchContainer) {
            toggleSearch(false);
        }
    });

    // Close search with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.searchContainer.classList.contains('active')) {
            toggleSearch(false);
        }
    });
    
    // Close search button
    if (elements.closeSearch) {
        elements.closeSearch.addEventListener('click', () => toggleSearch(false));
    }
    
    // Handle search input
    let searchTimeout;
    elements.movieSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            const suggestions = document.querySelector('.search-suggestions');
            if (suggestions) suggestions.innerHTML = '';
            const searchResults = document.getElementById('search-results');
            if (searchResults) searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            fetch(`/search?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    displaySearchResults(data);
                })
                .catch(error => {
                    console.error('Search error:', error);
                });
        }, 300);
    });
}

// Display search results with similar movies
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results-container');
    const searchSection = document.getElementById('search-results');
    
    if (!results || results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        searchSection.style.display = 'block';
        return;
    }
    
    let html = '';
    
    results.forEach(movie => {
        // Main movie result
        html += `
        <div class="search-movie-card">
            <div class="search-movie-main">
                <div class="search-movie-poster">
                    <img src="${movie.poster || 'https://via.placeholder.com/150x225?text=No+Poster'}" alt="${movie.title}">
                </div>
                <div class="search-movie-info">
                    <h3>${movie.title} ${movie.year ? `(${movie.year})` : ''}</h3>
                    ${movie.genre ? `<p class="search-movie-genre">${movie.genre}</p>` : ''}
                    ${movie.description ? `<p class="search-movie-desc">${movie.description.length > 200 ? movie.description.substring(0, 200) + '...' : movie.description}</p>` : ''}
                    <button class="btn ${movie.has_video ? 'btn-primary' : 'btn-disabled'}" ${!movie.has_video ? 'disabled' : ''}>
                        ${movie.has_video ? '<i class="fas fa-play"></i> Watch Now' : 'Coming Soon'}
                    </button>
                </div>
            </div>`;
        
        // Similar movies section
        if (movie.similar && movie.similar.length > 0) {
            html += `
            <div class="similar-movies">
                <h4>Similar Movies</h4>
                <div class="similar-movies-grid">`;
            
            movie.similar.forEach(similar => {
                html += `
                <div class="similar-movie">
                    <div class="similar-movie-poster">
                        <img src="${similar.poster || 'https://via.placeholder.com/100x150?text=No+Poster'}" alt="${similar.title}">
                        <button class="btn btn-small ${similar.has_video ? 'btn-primary' : 'btn-disabled'}" ${!similar.has_video ? 'disabled' : ''}>
                            ${similar.has_video ? '<i class="fas fa-play"></i>' : 'Coming Soon'}
                        </button>
                    </div>
                    <h5>${similar.title} ${similar.year ? `(${similar.year})` : ''}</h5>
                </div>`;
            });
            
            html += `
                </div>
            </div>`;
        }
        
        html += `</div>`; // Close search-movie-card
    });
    
    searchResults.innerHTML = html;
    searchSection.style.display = 'block';
    
    // Add click handlers for watch buttons
    document.querySelectorAll('.search-movie-main .btn-primary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const movieCard = e.target.closest('.search-movie-card');
            const movieId = movieCard ? movieCard.dataset.movieId : null;
            if (movieId) {
                window.location.href = `/movie/${movieId}`;
            }
        });
    });
}

// Carousel Functionality
function initCarousel() {
    if (!elements.carousel || elements.carouselItems.length === 0) return;
    
    const itemWidth = elements.carouselItems[0].offsetWidth;
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentIndex = 0;
    let isScrolling = false;
    
    function updateButtons() {
        if (!prevBtn || !nextBtn) return;
        
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentIndex >= elements.carouselItems.length - 4 ? 'none' : 'flex';
    }
    
    function scrollToItem(index) {
        if (index < 0 || index >= elements.carouselItems.length || isScrolling) return;
        
        isScrolling = true;
        currentIndex = index;
        
        elements.carousel.scrollTo({
            left: index * (itemWidth + 16), // 16px for gap
            behavior: 'smooth'
        });
        
        // Reset the flag after scroll completes
        setTimeout(() => {
            isScrolling = false;
        }, 300); // Match this with your CSS transition duration
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => scrollToItem(Math.max(0, currentIndex - 1)));
        nextBtn.addEventListener('click', () => scrollToItem(Math.min(elements.carouselItems.length - 1, currentIndex + 1)));
    }
    
    // Throttle scroll event
    let scrollTimeout;
    elements.carousel.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollPosition = elements.carousel.scrollLeft;
            currentIndex = Math.round(scrollPosition / (itemWidth + 16));
            updateButtons();
        }, 100);
    });
    
    // Initial button state
    updateButtons();
}

// Tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
        
        const positionTooltip = () => {
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
            tooltip.style.left = `${rect.left + (element.offsetWidth - tooltip.offsetWidth) / 2}px`;
        };
        
        element.addEventListener('mouseenter', () => {
            tooltip.classList.add('active');
            positionTooltip();
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('active');
        });
        
        window.addEventListener('resize', positionTooltip);
    });
}

// Smooth Scrolling
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
