// Módulo para manejar la lógica de la interfaz de usuario (UI)
const ui = (() => {
    // Función de renderizado por defecto (vista de tarjetas)
    const cardRenderer = (movie) => {
        const movieElement = document.createElement('div');
        movieElement.className = 'movie-card';
        // Ahora usamos el método polimórfico getDetails()
        movieElement.innerHTML = `
            <h3>${movie.title}</h3>
            <p>${movie.getDetails()}</p>
        `;
        return movieElement;
    };

    // La función principal ahora acepta un renderizador como argumento.
    // Está "abierta" a nuevas formas de renderizar (extensión),
    // pero su lógica central no necesita ser "modificada".
    const renderMovies = (movies, renderer = cardRenderer) => {
        const movieList = document.getElementById('movie-list');
        if (!movieList) return;

        movieList.innerHTML = ''; // Limpiar el contenido anterior

        movies.forEach(movie => {
            const movieElement = renderer(movie);
            movieList.appendChild(movieElement);
        });
    };

    return {
        renderMovies,
        // Podríamos exportar otros renderizadores si los creamos
        // listViewRenderer, etc.
    };
})();

// --- Principio de Sustitución de Liskov (L) ---
// Clase base "Media"
class Media {
    constructor(title, year) {
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
    const mediaItems = [
        new Movie('El Padrino', 'Francis Ford Coppola', 1972),
        new Movie('Pulp Fiction', 'Quentin Tarantino', 1994),
        new TVShow('Breaking Bad', 5, 2008),
        new Movie('El origen', 'Christopher Nolan', 2010),
        new TVShow('Game of Thrones', 8, 2011)
    ];

    const get = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(mediaItems);
            }, 500);
        });
    };

    return {
        get
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
            const media = await this.fetcher.get();
            this.renderer.renderMovies(media);
        } catch (error) {
            console.error('Error al cargar los medios:', error);
        }
    }
}

// Punto de entrada de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Aquí es donde "conectamos" las dependencias.
    // La clase App no sabe que está usando 'mediaFetcher', solo que es 'algo' que puede obtener datos.
    const app = new App(mediaFetcher, ui);
    app.run();
});