import { fetchCharacters, fetchEpisodes, fetchRandomCharacter, fetchCharactersByIds, NoResultsError } from "./api.js";
import {
    showOnly,
    renderCharacterGrid,
    renderCharacterDetail,
    renderEpisodeList,
    renderEpisodeListError,
    renderSkeletonGrid,
    renderSpotlight
} from "./render.js";
import { getFavoriteIds, isFavorite, toggleFavorite } from "./favorites.js";

// Elementos dos estados da tela
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const emptyState = document.getElementById("empty-state");
const emptyStateMessage = document.getElementById("empty-state-message");
const resultsState = document.getElementById("results-state");

const allStates = [loadingState, errorState, emptyState, resultsState];

// Elementos usados dentro do estado de resultados
const characterGrid = document.getElementById("character-grid");
const skeletonGrid = document.getElementById("skeleton-grid");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const pageIndicator = document.getElementById("page-indicator");
const paginationBar = document.querySelector(".pagination");
const resultsStats = document.getElementById("results-stats");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const genderFilter = document.getElementById("gender-filter");
const speciesFilter = document.getElementById("species-filter");
const sortSelect = document.getElementById("sort-select");
const retryButton = document.getElementById("retry-button");

const favoritesToggleButton = document.getElementById("favorites-toggle-button");
const randomButton = document.getElementById("random-button");
const spotlightBanner = document.getElementById("spotlight-banner");

const detailOverlay = document.getElementById("detail-overlay");
const detailContent = document.getElementById("detail-content");
const closeDetailButton = document.getElementById("close-detail");

// Estado da busca atual em memória
let currentQuery = "";
let currentPage = 1;
let totalPages = 1;
let lastKnownTotalCount = 826; // valor de fallback, atualizado assim que a primeira busca real chegar
let isFavoritesView = false;

// Handlers repassados para o render.js, reaproveitados no card, no detalhe e no destaque
const cardHandlers = {
    onClick: openCharacterDetail,
    onToggleFavorite: handleToggleFavorite,
    isFavorited: isFavorite
};

// Ordena um array de personagens por nome, de acordo com a opção escolhida
function applySort(characters) {

    const sortOrder = sortSelect.value;

    if (!sortOrder) {

        return characters;

    }

    const sorted = [...characters].sort((a, b) => a.name.localeCompare(b.name));

    return sortOrder === "desc" ? sorted.reverse() : sorted;

}

// Alterna o favorito de um personagem. Se a pessoa estiver na tela de favoritos,
// recarrega a lista na hora (pra o card removido desaparecer imediatamente).
function handleToggleFavorite(character) {

    const isNowFavorited = toggleFavorite(character.id);

    if (isFavoritesView && !isNowFavorited) {

        loadCharacters();

    }

    return isNowFavorited;

}

// Busca personagens na API (modo normal) ou os favoritos salvos (modo favoritos)
async function loadCharacters() {

    renderSkeletonGrid(skeletonGrid);
    showOnly(loadingState, allStates);

    try {

        let results;
        let count;

        if (isFavoritesView) {

            results = await fetchCharactersByIds(getFavoriteIds());
            count = results.length;

            paginationBar.classList.add("hidden");

            if (results.length === 0) {

                emptyStateMessage.textContent = "Você ainda não favoritou nenhum personagem.";

                showOnly(emptyState, allStates);

                resultsStats.textContent = "";

                return;

            }

        } else {

            const data = await fetchCharacters({
                name: currentQuery,
                page: currentPage,
                status: statusFilter.value,
                gender: genderFilter.value,
                species: speciesFilter.value
            });

            results = data.results;
            count = data.info.count;
            totalPages = data.info.pages;
            lastKnownTotalCount = count;

            paginationBar.classList.remove("hidden");

            pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
            prevButton.disabled = currentPage <= 1;
            nextButton.disabled = currentPage >= totalPages;

        }

        renderCharacterGrid(characterGrid, applySort(results), cardHandlers);

        const characterWord = count === 1 ? "personagem encontrado" : "personagens encontrados";

        resultsStats.textContent = isFavoritesView
            ? `${count} ${count === 1 ? "favorito" : "favoritos"}`
            : `${count} ${characterWord}`;

        showOnly(resultsState, allStates);

    } catch (error) {

        resultsStats.textContent = "";

        if (error instanceof NoResultsError) {

            emptyStateMessage.textContent = "Nenhum personagem encontrado com esses critérios.";

            showOnly(emptyState, allStates);

        } else {

            console.error("Erro ao buscar personagens:", error);

            showOnly(errorState, allStates);

        }

    }

}

// Abre o painel de detalhe com as informações do personagem clicado.
// O detalhe básico aparece na hora; a lista de episódios é buscada
// separadamente e preenchida assim que chegar (não trava a abertura do painel).
async function openCharacterDetail(character) {

    renderCharacterDetail(detailContent, character, cardHandlers);

    detailOverlay.classList.remove("hidden");

    const episodeListElement = document.getElementById("detail-episode-list");

    try {

        const episodes = await fetchEpisodes(character.episode);

        renderEpisodeList(episodeListElement, episodes);

    } catch (error) {

        console.error("Erro ao buscar episódios:", error);

        renderEpisodeListError(episodeListElement);

    }

}

// Fecha o painel de detalhe
function closeCharacterDetail() {

    detailOverlay.classList.add("hidden");

}

// Sorteia e exibe um novo personagem no banner de destaque
async function loadSpotlight() {

    const originalLabel = randomButton.textContent;

    randomButton.disabled = true;
    randomButton.textContent = "🎲 Sorteando...";

    try {

        const character = await fetchRandomCharacter(lastKnownTotalCount);

        renderSpotlight(spotlightBanner, character, { onClick: openCharacterDetail });

    } catch (error) {

        console.error("Erro ao sortear personagem em destaque:", error);

        spotlightBanner.innerHTML = `<p class="spotlight-loading">Não foi possível sortear um destaque agora.</p>`;

    } finally {

        randomButton.disabled = false;
        randomButton.textContent = originalLabel;

    }

}

// Espera a pessoa parar de digitar por um tempo antes de buscar,
// evitando disparar uma requisição a cada tecla pressionada
function debounce(fn, delayMs) {

    let timeoutId;

    return (...args) => {

        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => fn(...args), delayMs);

    };

}

// Reinicia para a página 1 e busca de novo — usado sempre que um filtro muda
function applyFiltersFromStart() {

    currentPage = 1;

    loadCharacters();

}

const handleSearchInput = debounce(() => {

    currentQuery = searchInput.value.trim();

    applyFiltersFromStart();

}, 400);

// Alterna entre a busca normal e a lista de favoritos
function toggleFavoritesView() {

    isFavoritesView = !isFavoritesView;

    favoritesToggleButton.textContent = isFavoritesView ? "← Voltar à busca" : "☆ Ver favoritos";
    favoritesToggleButton.classList.toggle("active", isFavoritesView);

    // Desabilita busca e filtros enquanto estiver na tela de favoritos,
    // já que ela não passa pelos mesmos parâmetros da API
    [searchInput, statusFilter, genderFilter, speciesFilter].forEach(el => {

        el.disabled = isFavoritesView;

    });

    loadCharacters();

}

// Eventos
searchInput.addEventListener("input", handleSearchInput);
statusFilter.addEventListener("change", applyFiltersFromStart);
genderFilter.addEventListener("change", applyFiltersFromStart);
speciesFilter.addEventListener("change", applyFiltersFromStart);
sortSelect.addEventListener("change", loadCharacters);

favoritesToggleButton.addEventListener("click", toggleFavoritesView);
randomButton.addEventListener("click", loadSpotlight);

retryButton.addEventListener("click", loadCharacters);

prevButton.addEventListener("click", () => {

    if (currentPage > 1) {

        currentPage -= 1;

        loadCharacters();

    }

});

nextButton.addEventListener("click", () => {

    if (currentPage < totalPages) {

        currentPage += 1;

        loadCharacters();

    }

});

closeDetailButton.addEventListener("click", closeCharacterDetail);

// Fecha o detalhe ao clicar fora do painel (na área escura ao redor)
detailOverlay.addEventListener("click", (event) => {

    if (event.target === detailOverlay) {

        closeCharacterDetail();

    }

});

// Fecha o detalhe com a tecla Esc, e navega entre páginas com as setas ← →
// (ignorado se o foco estiver num campo de texto ou seletor, pra não atrapalhar a digitação)
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape" && !detailOverlay.classList.contains("hidden")) {

        closeCharacterDetail();

        return;

    }

    const isTypingInField = ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName);

    if (isTypingInField || !detailOverlay.classList.contains("hidden") || isFavoritesView) {

        return;

    }

    if (event.key === "ArrowLeft" && !prevButton.disabled) {

        prevButton.click();

    }

    if (event.key === "ArrowRight" && !nextButton.disabled) {

        nextButton.click();

    }

});

// Ao carregar a página: busca a primeira leva de personagens e sorteia o destaque
loadCharacters();
loadSpotlight();