// Módulo responsável apenas por buscar dados na Rick and Morty API.
// Nenhuma outra parte do app deveria saber como a URL da API é montada —
// só esse arquivo. Isso facilita trocar de API no futuro, se necessário.

const BASE_URL = "https://rickandmortyapi.com/api";

// Erro customizado para diferenciar "nenhum resultado encontrado" (comportamento esperado)
// de uma falha real de rede (comportamento inesperado)
export class NoResultsError extends Error {}

// Busca personagens combinando nome, página, status e gênero.
// Parâmetros vazios ("") são omitidos da URL, então cada filtro é opcional.
// A API retorna HTTP 404 quando não há nenhum personagem com esses critérios —
// esse caso é tratado como NoResultsError, não como erro de rede.
export async function fetchCharacters({ name = "", page = 1, status = "", gender = "", species = "" }) {

    const params = new URLSearchParams({ page });

    if (name) params.set("name", name);
    if (status) params.set("status", status);
    if (gender) params.set("gender", gender);
    if (species) params.set("species", species);

    const response = await fetch(`${BASE_URL}/character/?${params.toString()}`);

    if (response.status === 404) {

        throw new NoResultsError("Nenhum personagem encontrado");

    }

    if (!response.ok) {

        throw new Error(`Erro na API: ${response.status}`);

    }

    return response.json();

}

// Busca um único personagem pelo id (usado pelo destaque aleatório e pelo botão de aleatório)
export async function fetchCharacterById(id) {

    const response = await fetch(`${BASE_URL}/character/${id}`);

    if (!response.ok) {

        throw new Error(`Erro na API: ${response.status}`);

    }

    return response.json();

}

// Sorteia um id entre 1 e o total de personagens, e busca esse personagem —
// usado no destaque "personagem aleatório" no topo da página
export async function fetchRandomCharacter(totalCount) {

    const randomId = Math.floor(Math.random() * totalCount) + 1;

    return fetchCharacterById(randomId);

}

// Busca os detalhes (nome e código) de uma lista de episódios,
// a partir das URLs completas que vêm dentro de cada personagem.
// A API aceita múltiplos ids numa única chamada: /episode/1,2,3
export async function fetchEpisodes(episodeUrls) {

    const ids = episodeUrls.map(url => url.split("/").pop());

    const response = await fetch(`${BASE_URL}/episode/${ids.join(",")}`);

    if (!response.ok) {

        throw new Error(`Erro na API: ${response.status}`);

    }

    const data = await response.json();

    // Quando só existe 1 id, a API retorna um objeto em vez de um array
    return Array.isArray(data) ? data : [data];

}

// Busca vários personagens de uma vez, a partir de uma lista de ids (usado pelos favoritos)
export async function fetchCharactersByIds(ids) {

    if (ids.length === 0) {

        return [];

    }

    const response = await fetch(`${BASE_URL}/character/${ids.join(",")}`);

    if (!response.ok) {

        throw new Error(`Erro na API: ${response.status}`);

    }

    const data = await response.json();

    return Array.isArray(data) ? data : [data];

}