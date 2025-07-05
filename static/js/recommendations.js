document.addEventListener('DOMContentLoaded', function() {
    const recommendBtn = document.getElementById('recommend-btn');
    const recommendationInput = document.getElementById('recommendation-search');
    
    // Handle click on the recommendation button
    recommendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const movieTitle = recommendationInput.value.trim();
        if (movieTitle) {
            fetchRecommendations(movieTitle);
        } else {
            showNotification('Please enter a movie title', 'error');
        }
    });
    
    // Handle Enter key in the input field
    recommendationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const movieTitle = recommendationInput.value.trim();
            if (movieTitle) {
                fetchRecommendations(movieTitle);
            } else {
                showNotification('Please enter a movie title', 'error');
            }
        }
    });
    
    function fetchRecommendations(movieTitle) {
        // Show loading state
        recommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        recommendBtn.disabled = true;
        
        fetch(`/get_recommendations?title=${encodeURIComponent(movieTitle)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                showRecommendations(data);
            })
            .catch(error => {
                console.error('Error fetching recommendations:', error);
                showNotification(error.message || 'Failed to get recommendations', 'error');
            })
            .finally(() => {
                // Reset button state
                recommendBtn.innerHTML = '<i class="fas fa-magic"></i>';
                recommendBtn.disabled = false;
            });
    }
    
    function showRecommendations(data) {
        // Create recommendations container if it doesn't exist
        let container = document.querySelector('.recommendations-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'recommendations-container';
            container.innerHTML = `
                <div class="section">
                    <div class="container">
                        <h2 class="section-title">Recommendations for "${data.query}"</h2>
                        <div class="recommendations-grid"></div>
                    </div>
                </div>
            `;
            document.querySelector('main').prepend(container);
        } else {
            container.querySelector('.section-title').textContent = `Recommendations for "${data.query}"`;
        }
        
        const grid = container.querySelector('.recommendations-grid');
        grid.innerHTML = '';
        
        if (data.recommendations && data.recommendations.length > 0) {
            data.recommendations.forEach(movie => {
                const movieCard = createMovieCard(movie);
                grid.appendChild(movieCard);
            });
            
            // Scroll to recommendations
            container.scrollIntoView({ behavior: 'smooth' });
        } else {
            grid.innerHTML = '<p class="no-results">No recommendations found. Try a different movie title.</p>';
        }
    }
    
    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <a href="/movie/${movie.id}" class="movie-link">
                <div class="movie-poster">
                    <img src="${movie.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${movie.title}">
                    <div class="movie-overlay">
                        <div class="play-btn"><i class="fas fa-play"></i></div>
                        <div class="movie-info">
                            <h3>${movie.title}</h3>
                            <div class="movie-meta">
                                <span class="year">${movie.year || 'N/A'}</span>
                                <span class="rating"><i class="fas fa-star"></i> ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
                            </div>
                            ${movie.genre ? `<div class="movie-genre">${movie.genre}</div>` : ''}
                        </div>
                    </div>
                </div>
            </a>
        `;
        return card;
    }
    
    function showNotification(message, type = 'info') {
        // You can implement a notification system here
        alert(`${type.toUpperCase()}: ${message}`);
    }
});
