import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/MovieResults.css';

const MovieResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { searchCriteria } = location.state || { searchCriteria: {} };
    
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const moviesPerPage = 5; // Show 5 movies per page to better manage 10-15 total results
    const maxResults = 15; // Maximum number of results to display in total
    
    useEffect(() => {
        if (!searchCriteria) {
            navigate('/');
            return;
        }
        
        loadAndFilterMovies();
    }, [searchCriteria]);
    
    const loadAndFilterMovies = async () => {
        setLoading(true);
        
        try {
            // Try to fetch the movies data
            const response = await fetch("https://movie-recommendation-system-infimovies.onrender.com/api/movies");            
            if (!response.ok) throw new Error(`Failed to fetch movies data: ${response.status}`);
            
            const jsonData = await response.json();
            
            // Apply filters
            console.log('Filtering movies with criteria:', searchCriteria);
            const filtered = filterMoviesFromData(jsonData, searchCriteria, maxResults);
            console.log(`Filtered to ${filtered.length} movies`);
            
            setFilteredMovies(filtered);
            setLoading(false);
        } catch (error) {
            console.error('Error loading or filtering movies:', error);
            
            // For development only - use sample data if fetch fails
            // Remove this in production
            const sampleData = [
                {id: 1, title: "Sample Movie 1", average_rating: 8.5, release_date: "2023-01-01", runtime: 120, original_language: "en", genres: "Action, Drama", overview: "Sample movie description"},
                // Add more sample movies
            ];
            
            const filtered = filterMoviesFromData(sampleData, searchCriteria, maxResults);
            setFilteredMovies(filtered);
            setLoading(false);
            
            // Or keep the error state for production
            // setError('Failed to load movies. Please try again.');
            // setLoading(false);
        }
    };
    
    const filterMoviesFromData = (moviesData, criteria, maxResults) => {
        // Extract criteria
        const { 
            language, 
            minRating, 
            adult, 
            country, 
            releaseYear, 
            runtime, 
            genre, 
            sortBy 
        } = criteria;
        
        // Filter movies
        let results = moviesData.filter(movie => {
            // Safely handle properties that might be undefined
            const movieLanguage = movie.original_language || '';
            const movieRating = parseFloat(movie.average_rating) || 0;
            const movieAdult = movie.adult === true;
            const movieCountries = typeof movie.production_countries === 'string' 
                ? movie.production_countries
                : Array.isArray(movie.production_countries) 
                    ? movie.production_countries.join(', ') 
                    : '';
            const movieYear = movie.release_date 
                ? new Date(movie.release_date).getFullYear() 
                : 0;
            const movieRuntime = parseInt(movie.runtime) || 0;
            const movieGenres = typeof movie.genres === 'string' 
                ? movie.genres
                : Array.isArray(movie.genres) 
                    ? movie.genres.join(', ') 
                    : '';
            
            // Language filter
            if (language && movieLanguage !== language) {
                return false;
            }
            
            // Rating filter
            if (minRating > 0 && movieRating < minRating) {
                return false;
            }
            
            // Adult content filter
            if (movieAdult !== adult) {
                return false;
            }
            
            // Country filter
            if (country && !movieCountries.includes(country)) {
                return false;
            }
            
            // Release year filter - with flexibility (±3 years)
            if (releaseYear && movieYear) {
                const targetYear = parseInt(releaseYear);
                if (Math.abs(movieYear - targetYear) > 3) {
                    return false;
                }
            }
            
            // Runtime filter - with flexibility (±15 minutes)
            if (runtime && movieRuntime) {
                const targetRuntime = parseInt(runtime);
                if (Math.abs(movieRuntime - targetRuntime) > 15) {
                    return false;
                }
            }
            
            // Genre filter
            if (genre && !movieGenres.includes(genre)) {
                return false;
            }
            
            return true;
        });
        
        // Sort results
        results.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.average_rating || 0) - (a.average_rating || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'release_date':
                    return new Date(b.release_date || 0) - new Date(a.release_date || 0);
                case 'runtime':
                    return (b.runtime || 0) - (a.runtime || 0);
                default:
                    return (b.average_rating || 0) - (a.average_rating || 0);
            }
        });
        
        // Return at most maxResults (15 instead of 1000)
        return results.slice(0, maxResults);
    };
    
    // Get current movies for pagination
    const indexOfLastMovie = currentPage * moviesPerPage;
    const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
    const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
    const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
    
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top when changing pages
    };
    
    const goBack = () => {
        navigate('/');
    };
    
    // Format search criteria for display
    const formatCriteriaForDisplay = () => {
        const displayCriteria = [];
        
        if (searchCriteria.language) displayCriteria.push(`Language: ${searchCriteria.language}`);
        if (searchCriteria.minRating > 0) displayCriteria.push(`Min Rating: ${searchCriteria.minRating}`);
        displayCriteria.push(`Adult Content: ${searchCriteria.adult ? 'Yes' : 'No'}`);
        if (searchCriteria.country) displayCriteria.push(`Country: ${searchCriteria.country}`);
        if (searchCriteria.releaseYear) displayCriteria.push(`Year: ${searchCriteria.releaseYear} (±3)`);
        if (searchCriteria.runtime) displayCriteria.push(`Runtime: ${searchCriteria.runtime} min (±15)`);
        if (searchCriteria.genre) displayCriteria.push(`Genre: ${searchCriteria.genre}`);
        
        return displayCriteria;
    };

    if (error) {
        return (
            <div className="error-container">
                <div className="error-card">
                    <h2 className="error-title">Error Loading Movies</h2>
                    <p className="error-message">{error}</p>
                    <div className="button-group">
                        <button 
                            className="primary-button"
                            onClick={() => loadAndFilterMovies()}
                        >
                            Try Again
                        </button>
                        <button 
                            className="secondary-button"
                            onClick={goBack}
                        >
                            Back to Filters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <div className="header-content">
                    <h1 className="title">Movie Results</h1>
                    <div className="header-buttons">
                        <button 
                            className="secondary-button"
                            onClick={goBack}
                        >
                            Back to Filters
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="main-container">
                <div className="content-wrapper">
                    {/* Sidebar with search criteria */}
                    <div className="sidebar">
                        <div className="sidebar-header">
                            <h2 className="sidebar-title">Search Criteria</h2>
                        </div>
                        <div className="sidebar-content">
                            {formatCriteriaForDisplay().map((criterion, index) => (
                                <span key={index} className="badge">
                                    {criterion}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="main">
                        {/* Results header */}
                        <div className="results-header">
                            <h2 className="results-title">
                                Found {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
                                {filteredMovies.length >= maxResults ? ' (showing top matches)' : ''}
                            </h2>
                        </div>
                        
                        {/* Loading indicator */}
                        {loading && (
                            <div className="loading-container">
                                <div className="loading-content">
                                    <p className="loading-text">Finding the perfect movies for you...</p>
                                    <div className="spinner"></div>
                                </div>
                            </div>
                        )}
                        
                        {/* Movie results grid */}
                        {!loading && currentMovies.length > 0 && (
                            <div className="movie-grid">
                                {currentMovies.map(movie => (
                                    <div key={movie.id} className="movie-card">
                                        {/* Movie poster placeholder */}
                                        <div className="poster-container">
                                            {movie.poster_path ? (
                                                <img 
                                                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                                                    alt={movie.title}
                                                    className="poster"
                                                />
                                            ) : (
                                                <div className="poster" style={{backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <span style={{color: '#555'}}>Poster not found</span>
                                                </div>
                                            )}
                                            <div className="rating-badge">
                                                ⭐ {movie.average_rating ? movie.average_rating.toFixed(1) : 'N/A'}
                                            </div>
                                        </div>
                                        
                                        {/* Movie details */}
                                        <div className="movie-content">
                                            <h3 className="movie-title">{movie.title}</h3>
                                            
                                            <div className="movie-meta">
                                                <span className="meta-item">{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                                                <span className="meta-item">{movie.runtime ? `${movie.runtime} min` : 'N/A'}</span>
                                                <span className="meta-item">{movie.original_language || 'N/A'}</span>
                                            </div>
                                            
                                            {/* Genres */}
                                            <div className="genre-container">
                                                {(typeof movie.genres === 'string' ? movie.genres.split(', ') : 
                                                Array.isArray(movie.genres) ? movie.genres : []).slice(0, 3).map((g, i) => (
                                                    <span key={i} className="genre-badge">
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* Overview/description truncated */}
                                            <p className="overview">
                                                {movie.overview || 'No description available.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {!loading && filteredMovies.length > moviesPerPage && (
                            <div className="pagination">
                                <div className="pagination-controls">
                                    <button 
                                        className="pagination-button"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    
                                    {/* Page numbers */}
                                    <div className="page-numbers">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            // Show 5 pages around current page
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`page-number-button ${
                                                        currentPage === pageNum ? 'active-page-button' : ''
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button 
                                        className="pagination-button"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* No results message */}
                        {!loading && filteredMovies.length === 0 && (
                            <div className="no-results">
                                <h2 className="no-results-title">No Movies Found</h2>
                                <p className="no-results-text">Try adjusting your search criteria to find more movies.</p>
                                <button 
                                    className="primary-button"
                                    onClick={goBack}
                                >
                                    Modify Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieResults;