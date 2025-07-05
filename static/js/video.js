// Video Player Functionality
document.addEventListener('DOMContentLoaded', function() {
    const videoModal = document.getElementById('video-modal');
    const moviePlayer = document.getElementById('movie-player');
    const playButton = document.getElementById('play-movie');
    const closeVideo = document.querySelector('.close-video');
    
    // Open video modal when play button is clicked
    if (playButton) {
        playButton.addEventListener('click', function() {
            videoModal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when video is open
            
            // Play the video
            const playPromise = moviePlayer.play();
            
            // Handle autoplay restrictions
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Autoplay was prevented:', error);
                    // Show a message to the user
                    const message = document.createElement('div');
                    message.className = 'video-message';
                    message.textContent = 'Click on the video to start playback';
                    message.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 5px; z-index: 100;';
                    document.querySelector('.video-container').appendChild(message);
                    
                    // Remove message when video starts playing
                    const onPlay = () => {
                        message.remove();
                        moviePlayer.removeEventListener('play', onPlay);
                    };
                    moviePlayer.addEventListener('play', onPlay);
                });
            }
        });
    }
    
    // Close video modal
    if (closeVideo) {
        closeVideo.addEventListener('click', function() {
            videoModal.classList.remove('show');
            document.body.style.overflow = ''; // Re-enable scrolling
            moviePlayer.pause();
            moviePlayer.currentTime = 0; // Reset video to start
        });
    }
    
    // Close modal when clicking outside the video
    window.addEventListener('click', function(event) {
        if (event.target === videoModal) {
            videoModal.classList.remove('show');
            document.body.style.overflow = ''; // Re-enable scrolling
            moviePlayer.pause();
            moviePlayer.currentTime = 0; // Reset video to start
        }
    });
    
    // Close video with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && videoModal.classList.contains('show')) {
            videoModal.classList.remove('show');
            document.body.style.overflow = ''; // Re-enable scrolling
            moviePlayer.pause();
            moviePlayer.currentTime = 0; // Reset video to start
        }
    });
    
    // Handle video end
    if (moviePlayer) {
        moviePlayer.addEventListener('ended', function() {
            // Optionally, show related content or replay button
            console.log('Video ended');
        });
    }
});
