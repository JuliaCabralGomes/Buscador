// Módulo responsável apenas por ler/escrever a lista de favoritos no localStorage.
// Guarda só os ids (números), não os dados completos do personagem —
// os dados completos são buscados de novo na API quando necessário.

const STORAGE_KEY = "character-finder-favorites";

// Retorna o array de ids favoritados (vazio se não houver nenhum, ou se der erro)
export function getFavoriteIds() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        return raw ? JSON.parse(raw) : [];

    } catch {

        return [];

    }

}

// Verifica se um id específico está entre os favoritos
export function isFavorite(id) {

    return getFavoriteIds().includes(id);

}

// Adiciona ou remove um id da lista de favoritos (alterna o estado)
// Retorna true se o id ficou favoritado, false se foi removido
export function toggleFavorite(id) {

    const ids = getFavoriteIds();
    const index = ids.indexOf(id);
    const willBeFavorite = index === -1;

    if (willBeFavorite) {

        ids.push(id);

    } else {

        ids.splice(index, 1);

    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

    return willBeFavorite;

}