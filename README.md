# SWR Power Flow Simulator

Calculadora offline de perda em coaxial, SWR e balanço de potência, com interface clássica, catálogo rastreável e animação didática.

Abra **simulador.html** ou **index.html** no navegador. São cópias idênticas e autônomas, sem dependências, servidor ou conexão obrigatória. index.html também permite servir o simulador na raiz do GitHub Pages; a publicação precisa ser configurada no repositório.

## Como usar

1. Informe a potência incidente disponível da fonte ideal e a frequência em MHz.
2. Selecione o fabricante/modelo e o comprimento, em metros ou pés.
3. Abra **Tabela / fórmula e origem dos dados** para conferir a ficha e os pontos publicados. Nos presets, a atenuação é somente leitura; use **Personalizado** para uma medição na frequência atual.
4. Escolha tuner ideal ou ligação direta com fonte casada que absorve o retorno.
5. Informe o SWR na carga ou na entrada do cabo. O SWR residual antes do tuner é independente do SWR da linha.
6. Use **Calcular** ou **Animar**. Campos inválidos ocultam o resultado anterior e interrompem a animação.

Aceita vírgula ou ponto decimal. Alternar unidades conserva o comprimento físico e a atenuação manual. O cálculo dos presets não usa o arredondamento do campo exibido.

## Catálogo

Dados conferidos em 22/10/2026. Os presets representam produtos específicos, não qualquer cabo com o mesmo nome RG.

| Modelo | Z₀ | Método | A 30 MHz (dB/100 m) |
|---|---:|---|---:|
| RG-58 / Belden 8240 | 50 Ω | tabela nominal | 6,321 |
| RG-8X / Belden 9258 | 50 Ω | tabela nominal | 5,265 |
| RG-213 / Belden 8267 | 50 Ω | tabela nominal | 3,246 |
| RG-6 / Belden 1694A | 75 Ω | tabela nominal | 3,830 |
| Times Microwave LMR-240 | 50 Ω | coeficientes publicados | 4,383 |
| Times Microwave LMR-400 | 50 Ω | coeficientes publicados | 2,223 |
| Times Microwave LMR-400-UF | 50 Ω | coeficientes publicados | 2,668 |
| Times Microwave LMR-600 | 50 Ω | coeficientes publicados | 1,383 |

Cada registro em src/cables.js contém URL, unidade original, data, faixa e método. Fontes e divergências históricas estão em [docs/validation.md](docs/validation.md).

- **Belden:** interpolação log-log entre pontos nominais. Fora da tabela, solicita dado manual; não congela o valor na extremidade.
- **LMR:** k1 × √f + k2 × f, com f em MHz e resultado em **dB/100 ft**. Divide-se por 0,3048 para dB/100 m. Abaixo do primeiro ponto tabulado (30 MHz), o uso é identificado como extrapolação da fórmula. O limite inferior adotado é 1 MHz; não se afirma precisão certificada nessa extrapolação.
- **Personalizado:** atenuação fornecida para a frequência atual; não há curva implícita.
- **75 Ω:** o SWR deve ser referido ao Z₀ do cabo. Uma leitura em medidor de 50 Ω não é convertida automaticamente. A comparação pressupõe o mesmo SWR relativo a cada Z₀, não uma troca física que preserve o casamento da instalação.

Valores nominais/típicos não são orçamento de potência, garantia térmica nem perda medida de cabo envelhecido. Conectores, temperatura e outros componentes não estão incluídos.

## Referências de potência

a = 10^(−L/10) é a transmissão de **potência** de uma ida; L é a perda casada em dB. g = (SWRcarga−1)/(SWRcarga+1) é o módulo do coeficiente de reflexão de **tensão**; a fração refletida de potência é g².

```text
Γentrada = a × g
η = a(1−g²) / (1−a²g²)
Perda real da linha = −10 log10(η)
Perda adicional da linha por SWR = −10 log10(η) − L
Entrada líquida = P+ − P− = potência na carga + calor no cabo
```

**Direto, fonte ideal casada ao Z₀:** a potência configurada é a onda incidente P+. A carga aceita P+ × a × (1−g²), o retorno à fonte é P+ × a² × g² e o cabo dissipa P+ × (1−a) × (1+a×g²). Não se desconta o descasamento novamente antes de calcular a carga. Cabo ideal, 100 W incidentes e SWR 3:1 dão **75 W na carga, 25 W na fonte e 0 W no cabo**, não 56,25 W na carga.

**Tuner ideal:** pressupõe casamento possível e tuner sem perdas. A entrada líquida na linha é a potência disponível menos o retorno por SWR residual antes do tuner. A carga recebe entrada líquida × η. P+ e P− podem exceder a potência líquida sem violar a conservação de energia.

As até oito viagens da tabela/animação são uma decomposição de energia em série geométrica. O resultado usa a soma analítica infinita, e a tabela informa o restante. Não é uma simulação temporal de ondas coerentes. Fase, impedância complexa, foldback, redes reais de casamento, limites térmicos e eficiência de radiação não são modelados.

## Referências

- [Powertec — Coaxial Cable Loss Calculator](https://portal.powertec.com.au/operations/tools-calculators/coaxial-cable-loss-calculator)
- [QSL / CO8TW — Coax Calculator](https://www.qsl.net/co8tw/Coax_Calculator.htm)
- Inspiração conceitual original: M. Walter Maxwell, W2DU, *Reflections III*.

As calculadoras podem usar cadastros e bases de potência diferentes. Os [casos de validação](docs/validation.md) e test/reference.test.cjs explicitam as premissas.

## Desenvolvimento

Node.js 22 ou posterior; sem pacotes npm externos.

```sh
npm test
npm run build
npm run check
```

- src/cables.js: catálogo e fontes.
- src/model.js: cálculo puro, validação e unidades, utilizável com require no Node.
- src/app.js: interface, comparação e animação.
- src/template.html e src/styles.css: interface clássica responsiva.
- scripts/build.cjs: geração determinística dos dois HTMLs.
- test/: física, fabricantes, referências e integração do bundle.

Edite as fontes e regenere os HTMLs. CI executa os testes e detecta saídas desatualizadas. Os testes de integração usam DOM simulado; alterações visuais também precisam de inspeção no navegador. Em ambientes que bloqueiam subprocessos, use node --test --test-isolation=none numa versão de Node que suporte a opção.

## Licença

MIT, conforme LICENSE. Marcas identificam os produtos de seus fabricantes; links não implicam endosso.

