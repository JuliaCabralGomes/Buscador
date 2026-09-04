// Módulo responsável por transformar dados em elementos HTML.
// Nenhuma função aqui faz fetch — só recebe dados prontos e desenha.

// Traduções pontuais de valores fixos que a API retorna em inglês
// (não precisa de uma API de tradução aqui, porque o conjunto de valores é pequeno e conhecido)
const STATUS_LABELS = {
    Alive: "Vivo",
    Dead: "Morto",
    unknown: "Desconhecido"
};

const STATUS_CLASSES = {
    Alive: "status-alive",
    Dead: "status-dead",
    unknown: "status-unknown"
};

const GENDER_LABELS = {
    Male: "Masculino",
    Female: "Feminino",
    Genderless: "Sem gênero",
    unknown: "Desconhecido"
};

// Emoji ilustrativo por espécie, só um toque visual extra nos cards
const SPECIES_EMOJIS = {
    Human: "🧑",
    Alien: "👽",
    Humanoid: "🧬",
    Robot: "🤖",
    Animal: "🐾",
    "Mythological Creature": "🧚",
    Disease: "🦠",
    Cronenberg: "🧟",
    Poopybutthole: "💩"
};

function getSpeciesEmoji(species) {

    return SPECIES_EMOJIS[species] || "❓";

}

// Cor de destaque por espécie, pra dar mais variedade visual aos cards
// (o resto da interface é só verde/roxo, então isso quebra a monotonia)
const SPECIES_COLORS = {
    Human: "#4D7CFE",
    Alien: "#22C55E",
    Humanoid: "#A855F7",
    Robot: "#F59E0B",
    Animal: "#84CC16",
    "Mythological Creature": "#EC4899",
    Disease: "#14B8A6",
    Cronenberg: "#F97316"
};

function getSpeciesColor(species) {

    return SPECIES_COLORS[species] || "#9CA3AF";

}

// Cria o badge colorido de espécie (emoji + nome), reaproveitado em card, detalhe e destaque
function createSpeciesBadge(species) {

    const badge = document.createElement("span");

    const color = getSpeciesColor(species);

    badge.className = "species-badge";
    badge.textContent = `${getSpeciesEmoji(species)} ${species}`;

    badge.style.color = color;
    badge.style.borderColor = color;
    badge.style.backgroundColor = `${color}1A`; // mesma cor com ~10% de opacidade

    return badge;

}

// Troca o valor "unknown" (usado pela API em vários campos) por "Desconhecido"
function translateUnknown(value) {

    return value === "unknown" || value === "" ? "Desconhecido" : value;

}

// Mostra apenas um dos elementos de estado passados, escondendo os outros
export function showOnly(visibleElement, allStateElements) {

    allStateElements.forEach(el => {

        el.classList.toggle("hidden", el !== visibleElement);

    });

}

// Gera cards "fantasma" (skeleton) no formato da grade real, usados durante o carregamento.
export function renderSkeletonGrid(gridElement, count = 8) {

    gridElement.innerHTML = "";

    for (let i = 0; i < count; i++) {

        const card = document.createElement("div");

        card.className = "skeleton-card";

        const image = document.createElement("div");

        image.className = "skeleton-image";

        const line1 = document.createElement("div");

        line1.className = "skeleton-line skeleton-line-wide";

        const line2 = document.createElement("div");

        line2.className = "skeleton-line skeleton-line-narrow";

        card.append(image, line1, line2);

        gridElement.appendChild(card);

    }

}

// Cria o botão de favoritar (coração), reaproveitado no card e no detalhe.
// onToggle recebe o personagem e devolve o novo estado (favoritado ou não),
// e o próprio botão se atualiza visualmente sem precisar redesenhar mais nada.
function createFavoriteButton(character, favorited, onToggle) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = `favorite-button ${favorited ? "favorited" : ""}`;
    button.textContent = favorited ? "♥" : "♡";
    button.setAttribute("aria-label", favorited ? "Remover dos favoritos" : "Adicionar aos favoritos");

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        const isNowFavorited = onToggle(character);

        button.classList.toggle("favorited", isNowFavorited);
        button.textContent = isNowFavorited ? "♥" : "♡";
        button.setAttribute("aria-label", isNowFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos");

    });

    return button;

}

// Cria o card de um personagem para a grade de resultados
export function createCharacterCard(character, { onClick, onToggleFavorite, isFavorited }) {

    const card = document.createElement("div");

    card.className = "character-card";

    const imageWrapper = document.createElement("div");

    imageWrapper.className = "card-image-wrapper";

    const img = document.createElement("img");

    img.src = character.image;
    img.alt = character.name;
    img.loading = "lazy";

    imageWrapper.append(img, createFavoriteButton(character, isFavorited(character.id), onToggleFavorite));

    const info = document.createElement("div");

    info.className = "character-card-info";

    const name = document.createElement("p");

    name.className = "character-name";
    name.textContent = character.name;

    const statusRow = document.createElement("div");

    statusRow.className = "status-row";

    const statusDot = document.createElement("span");

    statusDot.className = `status-dot ${STATUS_CLASSES[character.status] || "status-unknown"}`;

    const statusText = document.createElement("span");

    statusText.textContent = STATUS_LABELS[character.status] || character.status;

    statusRow.append(statusDot, statusText);
    info.append(name, statusRow, createSpeciesBadge(character.species));
    card.append(imageWrapper, info);

    card.addEventListener("click", () => onClick(character));

    return card;

}

// Preenche a grade de personagens, substituindo o conteúdo anterior
export function renderCharacterGrid(gridElement, characters, handlers) {

    gridElement.innerHTML = "";

    characters.forEach(character => {

        gridElement.appendChild(createCharacterCard(character, handlers));

    });

}

// Cria um campo de detalhe (rótulo + valor), usado no painel do personagem
function createDetailField(label, value) {

    const field = document.createElement("div");

    field.className = "detail-field";

    const labelEl = document.createElement("span");

    labelEl.className = "detail-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");

    valueEl.className = "detail-value";
    valueEl.textContent = value;

    field.append(labelEl, valueEl);

    return field;

}

// Preenche o painel de detalhe com as informações completas do personagem
export function renderCharacterDetail(contentElement, character, { onToggleFavorite, isFavorited }) {

    contentElement.innerHTML = "";

    // Marca o painel com o status do personagem, pra CSS colorir a faixa do topo
    // (verde = vivo, vermelho = morto, cinza = desconhecido)
    const detailPanel = document.getElementById("detail-panel");

    detailPanel.dataset.status = character.status;

    const imageWrapper = document.createElement("div");

    imageWrapper.className = "detail-image-wrapper";

    const img = document.createElement("img");

    img.src = character.image;
    img.alt = character.name;

    imageWrapper.append(img, createFavoriteButton(character, isFavorited(character.id), onToggleFavorite));

    const name = document.createElement("p");

    name.className = "detail-name";
    name.textContent = character.name;

    const statusRow = document.createElement("div");

    statusRow.className = "detail-status";

    const statusDot = document.createElement("span");

    statusDot.className = `status-dot ${STATUS_CLASSES[character.status] || "status-unknown"}`;

    const statusText = document.createElement("span");

    statusText.textContent = STATUS_LABELS[character.status] || character.status;

    statusRow.append(statusDot, statusText, createSpeciesBadge(character.species));

    const grid = document.createElement("div");

    grid.className = "detail-grid";

    grid.append(
        createDetailField("Gênero", GENDER_LABELS[character.gender] || character.gender),
        createDetailField("Origem", translateUnknown(character.origin.name)),
        createDetailField("Localização atual", translateUnknown(character.location.name))
    );

    // O campo "tipo" (subespécie) só existe pra alguns personagens — só mostra quando vem preenchido
    if (character.type) {

        grid.appendChild(createDetailField("Tipo", character.type));

    }

    // "Primeira aparição" só é conhecida depois que os episódios forem buscados —
    // por isso começa com um placeholder, preenchido depois via updateFirstAppearance()
    const firstAppearanceField = createDetailField("Primeira aparição", "Carregando...");

    firstAppearanceField.querySelector(".detail-value").id = "detail-first-appearance";

    grid.appendChild(firstAppearanceField);

    const episodesSection = document.createElement("div");

    episodesSection.className = "episodes-section";

    const episodesLabel = document.createElement("p");

    episodesLabel.className = "detail-label";
    episodesLabel.textContent = `Episódios (${character.episode.length})`;

    const episodesList = document.createElement("ul");

    episodesList.id = "detail-episode-list";
    episodesList.className = "episode-list";
    episodesList.innerHTML = `<li class="episode-loading">Carregando episódios...</li>`;

    episodesSection.append(episodesLabel, episodesList);

    const shareButton = document.createElement("button");

    shareButton.type = "button";
    shareButton.className = "btn btn-small share-button";
    shareButton.textContent = "🔗 Compartilhar";

    shareButton.addEventListener("click", () => copyCharacterSummary(character, shareButton));

    contentElement.append(imageWrapper, name, statusRow, grid, episodesSection, shareButton);

}

// Monta um resumo em texto do personagem e copia pra área de transferência.
// Dá um feedback temporário no próprio botão ("Copiado!"), sem precisar de mais elementos na tela.
async function copyCharacterSummary(character, button) {

    const summary = [
        character.name,
        `${STATUS_LABELS[character.status] || character.status} · ${character.species}`,
        `Origem: ${translateUnknown(character.origin.name)}`,
        character.url
    ].join("\n");

    const originalText = button.textContent;

    try {

        await navigator.clipboard.writeText(summary);

        button.textContent = "✅ Copiado!";

    } catch (error) {

        console.error("Não foi possível copiar:", error);

        button.textContent = "❌ Erro ao copiar";

    }

    setTimeout(() => {

        button.textContent = originalText;

    }, 1800);

}

// Preenche a lista de episódios depois que eles são buscados na API,
// e também o campo "Primeira aparição", que depende dos mesmos dados
export function renderEpisodeList(listElement, episodes) {

    listElement.innerHTML = "";

    episodes.forEach(episode => {

        const item = document.createElement("li");

        item.className = "episode-item";
        item.textContent = `${episode.episode} — ${episode.name}`;

        listElement.appendChild(item);

    });

    const firstAppearanceEl = document.getElementById("detail-first-appearance");

    if (firstAppearanceEl && episodes.length > 0) {

        firstAppearanceEl.textContent = `${episodes[0].episode} — ${episodes[0].name}`;

    }

}

// Mostra uma mensagem de erro na lista de episódios e no campo de primeira aparição,
// caso a busca falhe
export function renderEpisodeListError(listElement) {

    listElement.innerHTML = `<li class="episode-loading">Não foi possível carregar os episódios.</li>`;

    const firstAppearanceEl = document.getElementById("detail-first-appearance");

    if (firstAppearanceEl) {

        firstAppearanceEl.textContent = "Indisponível";

    }

}

// Preenche o banner de destaque com um personagem sorteado
export function renderSpotlight(spotlightElement, character, handlers) {

    spotlightElement.innerHTML = "";

    const imageWrapper = document.createElement("div");

    imageWrapper.className = "spotlight-image-wrapper";

    const img = document.createElement("img");

    img.src = character.image;
    img.alt = character.name;

    imageWrapper.appendChild(img);

    const info = document.createElement("div");

    info.className = "spotlight-info";

    const eyebrow = document.createElement("p");

    eyebrow.className = "spotlight-eyebrow";
    eyebrow.textContent = "✨ Personagem em destaque";

    const name = document.createElement("p");

    name.className = "spotlight-name";
    name.textContent = character.name;

    const statusRow = document.createElement("div");

    statusRow.className = "status-row";

    const statusDot = document.createElement("span");

    statusDot.className = `status-dot ${STATUS_CLASSES[character.status] || "status-unknown"}`;

    const statusText = document.createElement("span");

    statusText.textContent = STATUS_LABELS[character.status] || character.status;

    statusRow.append(statusDot, statusText, createSpeciesBadge(character.species));

    info.append(eyebrow, name, statusRow);

    spotlightElement.append(imageWrapper, info);

    spotlightElement.onclick = () => handlers.onClick(character);

}