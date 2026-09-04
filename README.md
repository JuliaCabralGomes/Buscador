Buscador

Um buscador de personagens de Rick and Morty, com paginação, detalhes dos personagens e visual sci-fi em glassmorphism.

Funcionalidades

* Busca de personagens por nome
* Paginação baseada nos dados retornados pela API
* Visualização de detalhes de cada personagem
* Debounce de 400ms para evitar requisições a cada tecla
* Tratamento separado para nenhum resultado e erros de conexão
* Botão para tentar novamente após erros
* Layout responsivo

Tecnologias

* HTML, CSS e JavaScript puros (sem frameworks ou bibliotecas)
* [Rick and Morty API](https://rickandmortyapi.com/) - API pública de personagens, episódios e localizações

Conceitos praticados

Esse projeto foi construído como parte de uma trilha de aprendizado, com foco em organização de código e consumo de API:

* ES Modules com `import` e `export`
* Separação de responsabilidades entre módulos
* `fetch()` e `async/await` para requisições assíncronas
* Debounce para otimização de buscas
* Classes e erros customizados com `extends Error`
* Paginação baseada nos dados da API
* Gerenciamento de diferentes estados da interface

Como rodar

1. Clone este repositório
2. Abra o projeto no VS Code
3. Execute utilizando um servidor local, como o Live Server
4. Acesse o `index.html` pelo servidor
