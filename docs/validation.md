# Auditoria de perdas e balanço de potência

Verificação em 22/10/2026. Base auditada: d588bb75aade80ee2aea5cda439649f265f90d4f.

## Correções

1. O preset LMR-400 tinha 1,3 dB/100 m a 30 MHz. A fórmula atual da Times dá **2,223130 dB/100 m** (tabela arredondada: 2,2). UF agora é um registro separado.
2. A perda ficava constante abaixo de 30 MHz e acima de 450 MHz. Agora há dados em HF e frequências superiores; limites são validados e extrapolação LMR abaixo de 30 MHz é indicada.
3. Presets genéricos sem origem foram substituídos por produtos com fonte, Z₀ e unidade original.
4. O modo direto aplicava o descasamento antes de lançar a onda e descontava a reflexão outra vez na carga. P+, P− e entrada líquida agora fecham o balanço energético.
5. SWR de entrada incompatível não é mais limitado silenciosamente; campos inválidos não viram defaults e animação recalcula os dados atuais.

## Fontes dos fabricantes

| Produto | Fonte | Método / faixa |
|---|---|---|
| Belden 8240 | [ficha](https://catalog.belden.com/techdata/EN/8240_techdata.pdf) | tabela, 1–1000 MHz |
| Belden 9258 | [ficha](https://catalog.belden.com/techdata/EN/9258_techdata.pdf) | tabela, 1–1000 MHz |
| Belden 8267 | [ficha](https://catalog.belden.com/techdata/EN/8267_techdata.pdf), [produto](https://www.belden.com/products/cable/coax-triax-cable/50-ohm-coax-cable/8267) | tabela, 1–4000 MHz |
| Belden 1694A | [ficha](https://catalog.belden.com/techdata/EN/1694A_techdata.pdf) | tabela, 1–6000 MHz; 75 Ω |
| LMR-240 | [ficha](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-240-datasheet.pdf) | k1=0,242080; k2=0,000330 |
| LMR-400 | [ficha](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-400-datasheet.pdf) | k1=0,122290; k2=0,000260 |
| LMR-400-UF | [ficha](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-400-uf-datasheet-1.pdf) | k1=0,146748; k2=0,000312 |
| LMR-600 | [ficha](https://timesmicrowave.com/wp-content/uploads/2022/03/lmr-600-coax-cables-datasheet.pdf) | k1=0,075550; k2=0,000260 |

Coeficientes LMR em k1√f + k2f, f em MHz, resultado em dB/100 ft. Pontos publicados de 30–8000 MHz, exceto UF (5800 MHz). Uso de 1–30 MHz é extrapolação indicada, não um novo dado tabulado. Não confundir LMR com qualquer cabo compatível.

**Diferença histórica:** a ficha/página atual de Belden 8267 mostra **0,17 dB/100 ft em 1 MHz**, enquanto fichas antigas de 2012/2019 exibem 0,27. Adotou-se o registro atual (revisão 0.599, 20/02/2026), sem combinar os dois catálogos. Datas e construção podem explicar divergências em calculadoras antigas.

## Calculadoras indicadas pelo usuário

Resultados observados diretamente nas interfaces, sem copiar seus programas, em 22/10/2026:

| Entrada / saída | Powertec | QSL / CO8TW |
|---|---|---|
| Cabo | L-400 | TMS LMR-400 |
| Comprimento | 30,48 m | 100 ft |
| Frequência / SWR / potência | 100 MHz / 3:1 / 100 W | 100 MHz / 3:1 / 100 W |
| Perda casada | 1,25 dB | 1,232 dB |
| Campo SWR Loss | 1,25 dB | 0,586 dB |
| Perda total | 2,50 dB | 1,818 dB |
| Potência de saída | 56,3 W | 65,798 W |

A saída Powertec observada é consistente com Pincidente × a × (1−g²); seu SWR Loss coincide, nesse caso, com −10log10(1−g²). A saída QSL é consistente com Pentrada_líquida × η, incluindo a perda dissipativa adicional. **É uma inferência a partir dos resultados, não uma afirmação sobre o código interno dos sites.**

Com os coeficientes atuais LMR-400, este simulador dá perda casada **1,248900 dB**, saída **56,256313 W** no modo direto e **65,464296 W** no modo tuner ideal. No modo direto: **29,678031 W** no cabo e **14,065657 W** na fonte; soma de 100 W.

Para isolar o cálculo do cadastro histórico QSL, usando a perda casada exibida de **1,232 dB/100 ft** como entrada personalizada, o modo tuner dá **0,585498 dB** adicionais, **1,817498 dB** totais e **65,803690 W**. A pequena diferença é compatível com arredondamento de entrada/saída; testes usam tolerância de 0,002 dB e 0,02 W. Não se altera a ficha atual para forçar coincidência com a calculadora antiga.

## Verificações

- Todos os pontos Belden, interpolação log-log e conversão exata de unidades.
- Fórmulas LMR versus tabelas arredondadas (0,051 dB/100 ft de tolerância).
- Conservação de energia em 1024 combinações de cabo, frequência, comprimento, SWR e modo.
- Cabo ideal, carga casada, tuner ideal, 0 W, alta atenuação e inferência de SWR.
- Restante das oito parcelas e solução analítica infinita.
- Erros, unidades, perda manual, animação, proveniência e dois HTMLs idênticos.

Premissas e limites estão no README e na interface.
