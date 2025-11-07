let offset = 0; // desde qué número empezar a traer Pokémon
const limit = 2; // cuántos Pokémon mostrar por carga

const contenedor = document.getElementById('contenedor');
const btnlearmore = document.getElementById('btnlearmore');

async function obtenerPokemon() {
    try {
        // Llamamos a la API
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);

        // Si la respuesta no es correcta
        if (!respuesta.ok) throw new Error('Error al obtener Pokémon');

        // Convertimos la respuesta a JSON
        const datos = await respuesta.json();

        // Recorremos los resultados
        for (const pokemon of datos.results) {
            await mostrarPokemon(pokemon.url);
        }

    } catch (error) {
        console.error('Error al obtener datos:', error);
        contenedor.innerHTML = `<p class="error"> No se pudieron cargar los Pokémon</p>`;
    }
}

async function mostrarPokemon(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();

        // Crear un elemento HTML para cada Pokémon
        const card = document.createElement('div');
        card.classList.add('card');

        card.innerHTML = `
            <h3>${data.name.toUpperCase()}</h3>
            <img src="${data.sprites.front_default}" alt="${data.name}">
            <p><strong>Altura:</strong> ${data.height}</p>
            <p><strong>Peso:</strong> ${data.weight}</p>
        `;

        contenedor.appendChild(card);
    } catch (error) {
        console.error('Error al mostrar Pokémon:', error);
    }
}


btnlearmore.addEventListener('click', () => {
    offset += limit; // avanzar al siguiente grupo
    obtenerPokemon();
});


obtenerPokemon();

