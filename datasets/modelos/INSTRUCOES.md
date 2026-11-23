# Modelos para inserir os seus documentos

Os dois arquivos ao lado estão vazios de dados: nenhum artigo nem número foi inventado. Faça uma cópia de segurança e preencha com o material que você já reuniu.

## 50 matérias

Arquivo: `materias_covid_50.txt`.

Para cada bloco numerado, preencha a data de publicação em `AAAA-MM-DD`, a fonte, a categoria, o título, a URL pública e a licença/condições de uso. Cole o texto integral depois de `texto:` e antes do próximo separador `=== DOCUMENTO NN ===`. Não cole informações pessoais ou sensíveis. O painel `/historico` aceita esse TXT; também aceita CSV com cabeçalhos `data,fonte,categoria,titulo,texto` e campos opcionais `url,licenca`.

A análise do painel aceita de 2 a 50 matérias, limita cada texto a 25.000 caracteres e o total a 250.000 caracteres. Se uma matéria ultrapassar o limite, mantenha o original e prepare uma versão autorizada/trecho indicado para análise; não corte citações sem registrar isso.

## 50 dados oficiais

Arquivo: `dados_oficiais_covid_50.csv`.

Preencha uma observação por linha: data de referência, órgão que publicou, URL direta da fonte, indicador, valor numérico, unidade, localidade e observação metodológica. Exemplo de nomes de indicadores (apenas rótulos, sem valores): casos confirmados, óbitos, doses aplicadas. Como o CSV usa vírgula como separador, escreva decimais com ponto e não use separador de milhar (por exemplo, `1234` ou `12.5`). Não misture unidades ou territórios na mesma série. Use o painel `/dados-oficiais` para carregar o arquivo.

O gráfico só reproduz os números presentes no CSV e mantém cada URL clicável. Confira definição, atualização, revisão e licença no documento de origem. A página não busca nem confirma os dados automaticamente.

## Privacidade e licença

O histórico envia somente os textos selecionados para o serviço PLN temporário; os dados numéricos ficam no navegador. O sistema não persiste os documentos importados. Confirme que você tem permissão para processar/reproduzir o material e guarde a atribuição original. Se o portal da disciplina pedir outro formato de referência, mantenha também o arquivo original sem alterações.
