# SWR Power Flow Simulator

Simulador didático em HTML para visualizar o fluxo de potência em sistemas de rádio com cabo coaxial, antena descasada, SWR, perda de linha e múltiplas reflexões.

O projeto foi criado para ajudar radioamadores a entenderem uma ideia central: **potência refletida não é automaticamente potência perdida**.

O modelo é inspirado nos conceitos apresentados por M. Walter Maxwell, W2DU, em *Reflections III: Transmission Lines and Antennas*.

## Objetivo

Muitos radioamadores aprendem que, se uma antena reflete parte da potência, essa potência foi “perdida” ou “voltou para queimar o rádio”. Essa interpretação é incompleta.

Em um sistema com tuner/transmatch ou rede de saída adequada, a potência refletida pela antena volta pela linha de transmissão, chega à entrada da linha e pode ser re-refletida novamente em direção à antena.

A perda real aparece principalmente como:

1. perda normal do cabo;
2. perda adicional causada pelas viagens extras da energia na linha.

Ou seja:

```text
potência refletida ≠ potência automaticamente perdida
```

## O que o simulador mostra

O simulador calcula e apresenta:

- potência configurada no rádio;
- potência efetivamente transferida para o sistema;
- potência entregue à antena;
- potência dissipada como calor no cabo;
- perda normal do cabo em linha casada;
- perda adicional causada pelo SWR;
- SWR na entrada da linha;
- SWR estimado na antena;
- diferença entre a primeira chegada da potência e o resultado após múltiplas reflexões;
- efeito de um tuner/transmatch na entrada da linha.

## Modos de operação

### 1. Com tuner/transmatch na entrada da linha

Este é o modo principal do simulador.

```text
Rádio → tuner/transmatch → cabo → antena
```

Neste modo, o tuner ou rede de saída faz o casamento para o rádio, mas a linha entre o tuner e a antena ainda pode operar com SWR alto.

A potência refletida pela antena retorna pela linha. Ao chegar ao tuner/rede de saída, ela não é tratada como potência perdida no rádio. Ela é re-refletida para a linha e tenta chegar à antena novamente.

Neste modo, a perda real fica concentrada principalmente na atenuação do cabo.

### 2. Sem tuner, rádio direto no cabo

```text
Rádio → cabo → antena
```

Neste modo, o rádio vê diretamente o descasamento apresentado pela linha e pela antena.

O simulador separa a potência configurada no rádio da potência efetivamente transferida para o sistema, porque um rádio real pode não conseguir entregar toda a potência ajustada quando enxerga um descasamento significativo.

## Sobre os dois SWRs

O simulador separa dois conceitos diferentes.

### SWR visto pelo rádio

É o SWR que o transceptor enxerga do seu lado do tuner.

Com um tuner bem ajustado, esse valor pode ser próximo de:

```text
1,0:1
```

Mesmo que o cabo e a antena estejam com SWR maior.

### SWR da linha / antena

É o SWR existente depois do tuner, no cabo que alimenta a antena.

É possível ter, ao mesmo tempo:

```text
SWR visto pelo rádio: 1,0:1
SWR na linha/antena: 4,0:1
```

Isso significa que o rádio está casado, mas a linha continua trabalhando com ondas estacionárias.

## Exemplo conceitual

Imagine um rádio configurado para 100 W.

Com uma linha casada, parte da potência já seria perdida no cabo por atenuação normal.

Com SWR na antena, parte da potência incidente é refletida. Essa potência volta pelo cabo, sofre atenuação, chega ao tuner/rede de saída e é re-refletida.

Depois de várias idas e voltas, a potência efetivamente termina em dois lugares principais:

```text
antena + calor no cabo
```

A diferença entre uma linha casada e uma linha com SWR é a perda extra causada pelas viagens adicionais.

## O que este simulador não modela

Este é um simulador didático. Ele não substitui medições reais nem softwares completos de RF.

A versão atual não modela em detalhe:

- impedância complexa completa;
- fase elétrica da linha;
- Smith Chart;
- baluns;
- conectores;
- corrente de modo comum;
- perdas reais do tuner;
- comportamento específico de foldback de cada rádio;
- aquecimento interno do transmissor;
- eficiência real de radiação da antena;
- diagrama de radiação;
- ERP ou EIRP.

O foco é o entendimento do fluxo de potência e da diferença entre potência refletida e potência realmente perdida.

## Como usar

Baixe ou clone o repositório e abra o arquivo HTML no navegador.

Não é necessário instalar nada.

```text
simulador.html
```

Depois configure:

1. potência configurada no rádio;
2. frequência de operação;
3. tipo de cabo;
4. comprimento do cabo;
5. perda do cabo;
6. modo do sistema;
7. SWR visto pelo rádio, se aplicável;
8. SWR da linha ou da antena.

Clique em **Calcular** para ver os resultados.

Clique em **Animar** para acompanhar a explicação passo a passo.

## Referência conceitual

M. Walter Maxwell, W2DU — *Reflections III: Transmission Lines and Antennas*.

## Licença

Este projeto pode ser distribuído sob a licença MIT.

Veja o arquivo `LICENSE` para mais detalhes.
