// Módulo para manejar la lógica de la interfaz de usuario (UI)
const ui = (() => {
    // Función de renderizado por defecto (vista de tarjetas)
    const cardRenderer = (media) => {
        const mediaElement = document.createElement('div');
        mediaElement.className = 'movie-card';
        mediaElement.dataset.id = media.id;

        const isFav = mediaFetcher.isFavorite(media.id);
        const favoriteIconClass = isFav ? 'favorite-icon favorited' : 'favorite-icon';

        mediaElement.innerHTML = `
            <h3>${media.title}</h3>
            <p>${media.getDetails()}</p>
            <span class="${favoriteIconClass}" data-id="${media.id}">&#9733;</span>
        `;

        mediaElement.querySelector('.favorite-icon').addEventListener('click', (event) => {
            event.stopPropagation(); // Evitar que el clic en el icono abra el modal
            toggleFavorite(media, event.target);
        });

        mediaElement.addEventListener('click', () => {
            showDetailsModal(media);
        });

        return mediaElement;
    };

    // La función principal ahora acepta un renderizador como argumento.
    // Está "abierta" a nuevas formas de renderizar (extensión),
    // pero su lógica central no necesita ser "modificada".
    const renderMovies = (movies, targetElement, renderer = cardRenderer) => {
        if (!targetElement) return;

        targetElement.innerHTML = ''; // Limpiar el contenido anterior
        
        // Ocultar spinner y mostrar grid después de renderizar
        const spinner = targetElement.querySelector('.loading-spinner');
        if (spinner) {
            spinner.classList.remove('active');
            targetElement.classList.remove('loading'); // Remover clase que oculta el grid
        }

        movies.forEach(media => {
            const mediaElement = renderer(media);
            targetElement.appendChild(mediaElement);
        });
    };

    const detailsModal = document.getElementById('details-modal');
    const closeDetailsModalBtn = document.getElementById('close-details-modal');
    const detailTitle = document.getElementById('detail-title');
    const detailYear = document.getElementById('detail-year');
    const detailDirectorSeasons = document.getElementById('detail-director-seasons');


    const showDetailsModal = (media) => {
        detailTitle.textContent = media.title;
        detailYear.textContent = `Año: ${media.year}`;
        if (media instanceof Movie) {
            detailDirectorSeasons.textContent = `Director: ${media.director}`;
        } else if (media instanceof TVShow) {
            detailDirectorSeasons.textContent = `Temporadas: ${media.seasons}`;
        } else {
            detailDirectorSeasons.textContent = '';
        }
        detailsModal.style.display = 'flex';
    };

    const hideDetailsModal = () => {
        detailsModal.style.display = 'none';
    };

    closeDetailsModalBtn.addEventListener('click', hideDetailsModal);


    return {
        renderMovies,
        showDetailsModal, // Exportar para uso externo si es necesario
        hideDetailsModal, // Exportar para uso externo si es necesario
    };

    // Funciones y variables para el manejo de favoritos dentro del módulo ui
    const toggleFavorite = (media, iconElement) => {
        if (mediaFetcher.isFavorite(media.id)) {
            mediaFetcher.removeFavorite(media.id);
            iconElement.classList.remove('favorited');
            console.log(`${media.title} eliminado de favoritos.`);
        } else {
            mediaFetcher.addFavorite(media);
            iconElement.classList.add('favorited');
            console.log(`${media.title} añadido a favoritos.`);
        }
        // Vuelve a renderizar la sección actual para actualizar el estado del icono
        const currentActiveSectionId = document.querySelector('.media-section.active').id;
        if (currentActiveSectionId === 'home-section') {
            mediaFetcher.getMovies().then(movies => renderMovies(movies, document.getElementById('movie-list')));
        } else if (currentActiveSectionId === 'movies-section') {
            mediaFetcher.getMovies().then(movies => renderMovies(movies, document.getElementById('movies-grid')));
        } else if (currentActiveSectionId === 'tvshows-section') {
            mediaFetcher.getTvShows().then(tvshows => renderMovies(tvshows, document.getElementById('tvshows-grid')));
        }
    };

    const detailFavoriteBtn = detailsModal.querySelector('.btn:last-of-type');
    let currentMediaInModal = null;

    const updateFavoriteButton = (mediaId) => {
        if (mediaFetcher.isFavorite(mediaId)) {
            detailFavoriteBtn.textContent = 'Eliminar de Favoritos';
            detailFavoriteBtn.classList.add('remove-favorite');
        } else {
            detailFavoriteBtn.textContent = 'Añadir a Favoritos';
            detailFavoriteBtn.classList.remove('remove-favorite');
        }
    };

    const originalShowDetailsModal = showDetailsModal;
    showDetailsModal = (media) => {
        originalShowDetailsModal(media);
        currentMediaInModal = media;
        updateFavoriteButton(media.id);
    };

    detailFavoriteBtn.addEventListener('click', () => {
        if (currentMediaInModal) {
            toggleFavorite(currentMediaInModal, detailFavoriteBtn);
            updateFavoriteButton(currentMediaInModal.id);
            const cardIcon = document.querySelector(`.movie-card[data-id="${currentMediaInModal.id}"] .favorite-icon`);
            if (cardIcon) {
                cardIcon.classList.toggle('favorited', mediaFetcher.isFavorite(currentMediaInModal.id));
            }
        }
    });

    return {
        renderMovies,
        showDetailsModal,
        hideDetailsModal,
        toggleFavorite,
    };
})();

// Módulo para manejar la navegación
const navigation = (() => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.media-section');

    const showSection = (id) => {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === id) {
                section.classList.add('active');
            }
        });
    };

    const setupNavigation = () => {
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
                const targetId = link.id.replace('nav-', '') + '-section';
                showSection(targetId);
            });
        });
    };

    return {
        setupNavigation,
        showSection
    };
})();

// --- Principio de Sustitución de Liskov (L) ---
// Clase base "Media"
class Media {
    constructor(title, year) {
        this.id = `${title.replace(/\s/g, '-')}-${year}`; // Generar un ID único simple
        this.title = title;
        this.year = year;
    }

    // Método común que las subclases deben implementar
    getDetails() {
        return `${this.title} (${this.year})`;
    }
}

// Subclase "Movie"
class Movie extends Media {
    constructor(title, director, year) {
        super(title, year);
        this.director = director;
    }

    getDetails() {
        return `${this.title} (${this.year}) - Dirigida por ${this.director}`;
    }
}

// Subclase "TVShow"
class TVShow extends Media {
    constructor(title, seasons, year) {
        super(title, year);
        this.seasons = seasons;
    }

    getDetails() {
        return `${this.title} (${this.year}) - ${this.seasons} temporadas`;
    }
}


// --- Principio de Segregación de la Interfaz (I) ---
// En lugar de un gran 'apiService', creamos servicios más pequeños y enfocados.
// Este cliente solo necesita obtener medios, por lo que solo depende de esta interfaz.

const mediaFetcher = (() => {
    const movieItems = [
        new Movie('El Padrino', 'Francis Ford Coppola', 1972),
        new Movie('Pulp Fiction', 'Quentin Tarantino', 1994),
        new Movie('El origen', 'Christopher Nolan', 2010),
        new Movie('Interstellar', 'Christopher Nolan', 2014),
        new Movie('Parasite', 'Bong Joon-ho', 2019)
    ];

    const tvShowItems = [
        new TVShow('Breaking Bad', 5, 2008),
        new TVShow('Game of Thrones', 8, 2011),
        new TVShow('Stranger Things', 4, 2016),
        new TVShow('The Mandalorian', 3, 2019)
    ];

    const getMovies = (targetElementId = null) => {
        return new Promise((resolve) => {
            // Mostrar spinner si se proporciona un targetElementId
            if (targetElementId) {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.classList.add('loading'); // Añadir clase para ocultar el grid
                    targetElement.querySelector('.loading-spinner').classList.add('active');
                }
            }
            setTimeout(() => {
                resolve(movieItems);
            }, 500);
        }).finally(() => {
            // Ocultar spinner cuando la promesa se resuelve o rechaza
            if (targetElementId) {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.querySelector('.loading-spinner').classList.remove('active');
                    targetElement.classList.remove('loading'); // Remover clase que oculta el grid
                }
            }
        });
    };

    const getTvShows = (targetElementId = null) => {
        return new Promise((resolve) => {
            // Mostrar spinner si se proporciona un targetElementId
            if (targetElementId) {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.classList.add('loading');
                    targetElement.querySelector('.loading-spinner').classList.add('active');
                }
            }
            setTimeout(() => {
                resolve(tvShowItems);
            }, 500);
        }).finally(() => {
            // Ocultar spinner cuando la promesa se resuelve o rechaza
            if (targetElementId) {
                const targetElement = document.getElementById(targetElementId);
                if (targetElement) {
                    targetElement.querySelector('.loading-spinner').classList.remove('active');
                    targetElement.classList.remove('loading');
                }
            }
        });
    };

    const search = (query) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const lowerCaseQuery = query.toLowerCase();
                const allMedia = [...movieItems, ...tvShowItems];
                const results = allMedia.filter(media =>
                    media.title.toLowerCase().includes(lowerCaseQuery) ||
                    (media instanceof Movie && media.director.toLowerCase().includes(lowerCaseQuery))
                );
                resolve(results);
            }, 500);
        });
    };

    const getFavorites = () => {
        const favorites = localStorage.getItem('favorites');
        return favorites ? JSON.parse(favorites) : [];
    };

    const addFavorite = (media) => {
        const favorites = getFavorites();
        if (!favorites.some(fav => fav.id === media.id)) {
            favorites.push(media);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            return true;
        }
        return false;
    };

    const removeFavorite = (mediaId) => {
        let favorites = getFavorites();
        const initialLength = favorites.length;
        favorites = favorites.filter(fav => fav.id !== mediaId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        return favorites.length < initialLength;
    };

    const isFavorite = (mediaId) => {
        const favorites = getFavorites();
        return favorites.some(fav => fav.id === mediaId);
    };

    return {
        getMovies,
        getTvShows,
        search,
        getFavorites,
        addFavorite,
        removeFavorite,
        isFavorite
    };
})();

// --- Principio de Inversión de Dependencia (D) ---
// El módulo de alto nivel (App) no depende directamente del de bajo nivel (mediaFetcher),
// sino de una abstracción (la interfaz esperada del fetcher).

class App {
    // Inyectamos la dependencia en el constructor.
    constructor(fetcher, renderer) {
        this.fetcher = fetcher;
        this.renderer = renderer;
    }

    async run() {
        try {
            // Cargar los últimos lanzamientos por defecto en la sección de inicio
            const latestMedia = await this.fetcher.getMovies('movie-list'); // Pasamos el ID del elemento para el spinner
            this.renderer.renderMovies(latestMedia, document.getElementById('movie-list'));

            // Configurar la navegación
            navigation.setupNavigation();
            navigation.showSection('home-section'); // Mostrar la sección de inicio al cargar

            // Cargar datos para otras secciones (podrían ser llamadas asíncronas individuales si es necesario)
            const allMovies = await this.fetcher.getMovies('movies-grid');
            this.renderer.renderMovies(allMovies, document.getElementById('movies-grid'));

            const allTvShows = await this.fetcher.getTvShows('tvshows-grid');
            this.renderer.renderMovies(allTvShows, document.getElementById('tvshows-grid'));

            // Lógica para el botón de búsqueda
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');

            searchButton.addEventListener('click', async () => {
                const query = searchInput.value;
                if (query) {
                    const searchResults = await this.fetcher.search(query);
                    this.renderer.renderMovies(searchResults, document.getElementById('movie-list')); // Renderizar en la sección de inicio por simplicidad
                    navigation.showSection('home-section'); // Asegurarse de que la sección de inicio esté visible
                } else {
                    // Si no hay consulta, recargar los últimos lanzamientos
                    const latestMedia = await this.fetcher.getMovies();
                    this.renderer.renderMovies(latestMedia, document.getElementById('movie-list'));
                    navigation.showSection('home-section');
                }
            });

            // Re-renderizar las listas al inicio para asegurar que los iconos de favoritos se muestren correctamente
            mediaFetcher.getMovies().then(movies => this.renderer.renderMovies(movies, document.getElementById('movie-list')));
            // Re-renderizar las listas al inicio para asegurar que los iconos de favoritos se muestren correctamente
            // Estas llamadas ya activan y desactivan el spinner internamente
            mediaFetcher.getMovies('movie-list').then(movies => this.renderer.renderMovies(movies, document.getElementById('movie-list')));
            mediaFetcher.getMovies('movies-grid').then(movies => this.renderer.renderMovies(movies, document.getElementById('movies-grid')));
            mediaFetcher.getTvShows('tvshows-grid').then(tvshows => this.renderer.renderMovies(tvshows, document.getElementById('tvshows-grid')));


        } catch (error) {
            console.error('Error al cargar los medios:', error);
            alert('Hubo un error al cargar el contenido. Por favor, inténtalo de nuevo más tarde.');
        }
    }
}

// Punto de entrada de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeAuthModalBtn = document.getElementById('close-auth-modal');

    // Manejar el cierre del modal de detalles también
    const detailsModal = document.getElementById('details-modal');
    const closeDetailsModalBtn = document.getElementById('close-details-modal');

    closeDetailsModalBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    // Comprobar si es un usuario nuevo
    const isNewUser = localStorage.getItem('isNewUser') === null;

    if (isNewUser) {
        authModal.style.display = 'flex'; // Mostrar el modal
    }

    const hideModal = () => {
        authModal.style.display = 'none';
        localStorage.setItem('isNewUser', 'false'); // Marcar como usuario no nuevo
    };

    loginBtn.addEventListener('click', hideModal);
    registerBtn.addEventListener('click', hideModal);
    closeAuthModalBtn.addEventListener('click', hideModal);

    // Aquí es donde "conectamos" las dependencias.
    // La clase App no sabe que está usando 'mediaFetcher', solo que es 'algo' que puede obtener datos.
    const app = new App(mediaFetcher, ui);
    app.run();
});