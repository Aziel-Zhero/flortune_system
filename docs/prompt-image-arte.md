# Prompt para Criação de Arte para o Flortune

Este documento serve como um guia para criar prompts eficazes para a geração de imagens de banner e identidade visual para o aplicativo Flortune, utilizando ferramentas de IA como Midjourney, DALL-E, etc.

## 🎨 Estilo Visual Principal

O objetivo é criar uma identidade visual que seja ao mesmo tempo moderna, tecnológica, limpa e que remeta à natureza e ao crescimento.

**Palavras-chave do Estilo:** `flat design, 2.5d, minimalist, isometric, clean, tech, abstract, organic, financial growth, nature-inspired`

---

## 🖼️ Prompt para Banner Principal (Hero Image)

Este prompt é ideal para a imagem de destaque do site. Ele deve ser chamativo, mas sem ser poluído.

### Exemplo de Prompt Detalhado:

```
Banner para um site de aplicativo financeiro, estilo 2.5d flat design, minimalista. 
Uma planta digital estilizada (lembrando uma folha de Monstera ou um broto) crescendo a partir de um conjunto de dados e gráficos de linha abstratos e luminosos. 
O fundo é um gradiente suave de verde-água para um verde mais escuro e tecnológico (teal to dark green).
Elementos de interface de usuário (UI), como pequenos ícones de gráficos de pizza e setas de crescimento, flutuam sutilmente ao redor da planta.
A iluminação é suave e focada na planta, criando um brilho etéreo.
Paleta de cores: verdes tecnológicos, branco, e um toque de amarelo dourado para os elementos de destaque.
Renderização limpa e vetorial.
--ar 16:9 --style raw --stylize 250
```

**Quebra do Prompt:**

*   **`Banner para um site de aplicativo financeiro`**: Define o propósito e o contexto.
*   **`estilo 2.5d flat design, minimalista`**: Estabelece a estética principal. 2.5D dá uma sensação de profundidade sem ser totalmente 3D.
*   **`Uma planta digital estilizada... crescendo a partir de gráficos`**: Esta é a imagem central, a metáfora visual do Flortune (crescimento financeiro = crescimento da planta).
*   **`fundo é um gradiente suave...`**: Define o ambiente e a atmosfera.
*   **`Elementos de interface... flutuam sutilmente`**: Adiciona o contexto "tech" sem sobrecarregar a imagem.
*   **`Iluminação é suave e focada`**: Controla a luz para criar um ponto de interesse.
*   **`Paleta de cores: ...`**: Garante consistência com a identidade visual da marca.
*   **`Renderização limpa e vetorial`**: Pede um acabamento profissional e nítido.
*   **`--ar 16:9`**: (Parâmetro do Midjourney) Define a proporção da imagem para um banner (aspect ratio).
*   **`--style raw`**: (Parâmetro do Midjourney) Reduz a "opinião" da IA, fazendo com que ela siga o prompt mais literalmente.
*   **`--stylize 250`**: (Parâmetro do Midjourney) Define um nível médio de estilização artística.

---

## 🌿 Variações e Ideias para Outras Imagens

Você pode adaptar o prompt principal para criar uma série de imagens consistentes.

### Imagem para a Seção "Funcionalidades"

```
Ícone isométrico representando um calendário financeiro. Um calendário de mesa limpo com ícones de cifrão ($) e gráficos de pizza marcados em algumas datas. Ao lado, um pequeno vaso com um broto digital. Estilo flat design, paleta de cores do Flortune (verde, branco, dourado), fundo branco.
--ar 1:1
```

### Imagem para a Seção "Segurança"

```
Ilustração abstrata 2.5d de um escudo digital com o ícone de uma folha no centro. O escudo emite um brilho suave e é cercado por linhas de dados criptografadas. Estilo flat design, minimalista, paleta de cores do Flortune.
--ar 4:3
```

### Imagem para a Seção "Planos DEV"

```
Cena isométrica de um notebook com linhas de código na tela. Ao lado do notebook, um gráfico de barras crescendo e uma pequena planta digital em um vaso. Elementos como engrenagens e nós de API flutuam ao redor. Estilo flat design, cores do Flortune.
--ar 3:2
```

## ✨ Dicas Finais

*   **Seja Específico:** Em vez de "imagem de finanças", diga "gráfico de linha ascendente com um cifrão dourado no pico".
*   **Use Metáforas:** A ideia da "planta crescendo a partir de dados" é uma metáfora forte. Pense em outras (ex: um rio de moedas, uma árvore de gráficos).
*   **Controle a Cor:** Sempre especifique a `paleta de cores` para manter a consistência da marca.
*   **Ajuste os Parâmetros:** Experimente diferentes valores de `--stylize` (em ferramentas como o Midjourney) para obter resultados mais ou menos artísticos.
*   **Itere:** Sua primeira tentativa pode não ser perfeita. Use-a como base, veja o que a IA entendeu e refine seu prompt para a próxima geração.
```