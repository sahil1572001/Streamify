# Streamify - Modern Streaming Platform

A modern, responsive streaming platform built with Python, Flask, and modern web technologies. This application provides a Netflix-like experience with beautiful animations and a clean user interface.

## Features

- 🎬 Beautiful, responsive UI with smooth animations
- 🎥 Movie browsing by categories and genres
- 🔍 Search functionality
- 💖 Add movies to favorites
- 🎯 Personalized recommendations (to be implemented)
- 📱 Mobile-friendly design
- ⚡ Fast and efficient loading

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- Virtual environment (recommended)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd streamify
   ```

2. Create and activate a virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python
   >>> from app import app, db
   >>> with app.app_context():
   ...     db.create_all()
   ```

## Running the Application

1. Start the development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Project Structure

```
streamify/
├── app.py                 # Main application file
├── recommendation.py      # Recommendation system (to be implemented)
├── requirements.txt       # Python dependencies
├── static/                # Static files (CSS, JS, images)
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       └── main.js      # Main JavaScript file
└── templates/             # HTML templates
    ├── base.html         # Base template
    ├── index.html        # Home page
    └── movie_detail.html # Movie details page
```

## Customization

### Adding Movies

You can add movies to the database using the Flask shell:

```bash
python
>>> from app import app, db, Movie
>>> with app.app_context():
...     movie = Movie(
...         title="Inception",
...         description="A thief who steals corporate secrets through the use of dream-sharing technology...",
...         release_year=2010,
...         genre="Sci-Fi",
...         rating=8.8,
...         poster_url="https://example.com/poster.jpg",
...         banner_url="https://example.com/banner.jpg",
...         video_url="https://example.com/video.mp4"
...     )
...     db.session.add(movie)
...     db.session.commit()
```

### Styling

- Main styles are in `static/css/style.css`
- The color scheme can be customized by modifying the CSS variables at the top of the file

## Implementing Recommendations

The `recommendation.py` file is where you can implement your recommendation system. The basic structure is already in place, and you can expand it based on your requirements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - The web framework used
- [AOS](https://michalsnik.github.io/aos/) - Animate On Scroll library
- [Font Awesome](https://fontawesome.com/) - Icons
- [Google Fonts](https://fonts.google.com/) - Typography
