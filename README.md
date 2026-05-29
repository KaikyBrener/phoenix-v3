# Phoenix

Conversor de imagens para Base64 com histórico local.

## Como usar

1. Abrir `index.html` no navegador
2. Selecionar uma imagem (PNG, JPG, JPEG, WEBP)
3. O Base64 aparece automaticamente
4. Clicar em "Copiar" ou "Baixar"

O histórico salva automaticamente em localStorage.

## O que faz

- Converter imagem → Base64
- Converter Base64 → Imagem
- Codificar/decodificar texto em Base64
- Guardar histórico (últimas 100 conversões)
- Gerenciar favoritos

## Estrutura

```
js/
├── storage.js     - Salva/carrega do localStorage
├── conversor.js   - Valida e converte arquivos
└── main.js        - Gerencia UI e eventos

index.html         - Página principal
css/css_style.css  - Estilos (tema escuro)
```

## Rodando localmente

Não precisa build. É só servir os arquivos:

```bash
# Python
python3 -m http.server 8000

# Node
npx http-server
```

Depois abrir `http://localhost:8000`

## Limitações

- localStorage tem limite (~5-10 MB)
- Arquivos acima de 10 MB são rejeitados
- localStorage pode não funcionar em navegação privada (alguns navegadores)

## Browsers

Chrome, Firefox, Safari, Edge (últimas versões)
