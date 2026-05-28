PHOENIX V1 — Mini Style Guide
==============================

Objetivo
--------
Documento rápido descrevendo as variáveis de tema, componentes visuais e regras de uso para a refatoração visual do front-end. Use este guia para manter consistência e evitar mudanças que quebrem a lógica (IDs, `data-*` e classes consumidas pelo JS).

Arquivos relevantes
------------------
- `css/css_style.css` — arquivo principal do tema.
- `index.html` — markup base (preserve IDs e atributos JS).

Paleta & Variáveis (CSS :root)
------------------------------
- `--primary-color`: #ff6b1a (accent laranja)
- `--primary-glow`: rgba(255, 107, 26, 0.35)
- `--bg-main`: #050505 (background principal)
- `--bg-sidebar`: #0d0d0d (sidebar)
- `--bg-surface`: rgba(20,20,20,0.75) (cards / surfaces)
- `--bg-surface-strong`: rgba(18,18,18,0.92)
- `--border-color`: rgba(255,255,255,0.08)
- `--text-primary`: #ffffff
- `--text-secondary`: #9ca3af

Tipografia
----------
- Fonte principal: `Inter` (importada via Google Fonts).
- Mono para inputs/textarea: JetBrains Mono / fallback monospace (em `.form-control`).
- Escalas: use `clamp()` onde necessário para títulos (ex.: `.dashboard-title`).

Componentes principais (classes de apresentação)
------------------------------------------------
- `.phoenix-sidebar` — container visual da sidebar; não remova `data-tab`/`data-tool` dos botões internos.
- `.phoenix-offcanvas` — offcanvas mobile; touch targets maiores e footer para ações rápidas.
- `.dashboard-hero` — hero card no topo do dashboard.
- `.card` — base para painéis; mantemos markup `.card .card-body` usado pelo JS.
- `.metric-card` / `.panel-card` — variações de cards com efeitos e `backdrop-filter`.
- `.phoenix-list-group` — wrapper visual para listas (histórico/favoritos).
- `.upload-area` — área de drag & drop (id `uploadArea` é crítica).
- `.btn-danger`, `.btn-outline-danger` — estilos de ação; mantenha estes nomes para compatibilidade com o CSS atual.

IDs e seletores que NÃO DEVEM SER ALTERADOS
------------------------------------------
Preserve exatamente os nomes abaixo (usados pelo JavaScript):
- `data-tab` e `data-tool` (atributos nos botões de navegação)
- `uploadArea`, `imageInput`
- `base64Output`, `base64Input`, `textBase64Output`, `textInput`
- `copyBtn`, `downloadBtn`, `addFavoriteBtn`, `limparBtn`
- `historicoList`, `favoritosList`, `historico-recente`
- `previewContainer`, `base64PreviewContainer`
- `conversoes-hoje`, `imagens-processadas`, `favoritos-count`, `taxa-sucesso`

Acessibilidade (boas práticas aplicadas)
---------------------------------------
- `nav` tem `role="navigation" aria-label="Menu principal"`.
- `main` tem `role="main" aria-label="Conteúdo principal"`.
- Listas dinâmicas (`#historicoList`, `#favoritosList`, `#historico-recente`) usam `role="list"` e `aria-live="polite"` para anunciar atualizações.
- Inclusão de `skip-link` para pular ao conteúdo.
- Mantenha `:focus-visible` e `prefers-reduced-motion` suportados (já implementados no CSS).

Iconografia
-----------
- Bootstrap Icons CDN permanece disponível.
- Lucide foi adicionado via CDN; use `data-lucide="icon-name"` para marca e chame `lucide.replace()` (já incluído no `index.html`).

Micro-interações e animações
----------------------------
- Classes utilitárias disponíveis: `.fade-in-up`, `.metric-card.show` (usar via JS apenas para efeitos visuais), `data-copied="true"` para alterar visual de botões copiados.
- Respeitar `prefers-reduced-motion` — animações já condicionadas.

Exemplos de uso
---------------
1) Marcar um card métrico para aparecer com animação (visuais somente):

```js
// apenas visual: não altera lógica
document.querySelectorAll('.metric-card').forEach((c, i) => {
  setTimeout(() => c.classList.add('show'), i * 90);
});
```

2) Usar Lucide num botão (já suportado):

```html
<i data-lucide="copy" class="me-2"></i>
```

Notas para desenvolvedores
-------------------------
- Evite renomear IDs, `data-*` ou classes consumidas pelo JS — se quiser um novo estilo, adicione classes auxiliares (`.phoenix-*`) e atualize o CSS.
- Para introduzir novos componentes visuais, documente a classe e a paleta no `STYLEGUIDE.md`.
- Se for necessário sinalizar um botão como "copiado", o atributo `data-copied="true"` muda o visual (CSS já preparado).

Roadmap visual sugerido
-----------------------
- Consolidar tokens de design numa variável SCSS/JSON se o projeto crescer.
- Exportar uma página de docs estática (p.ex. `docs/style.html`) com exemplos interativos.

Contato
-------
Este arquivo foi gerado automaticamente pela refatoração visual. Para alterações maiores de layout ou JS, solicite revisão para garantir que seletores críticos permaneçam intactos.
