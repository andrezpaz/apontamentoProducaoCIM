const sql = {
    selectProdProg: `
         SELECT pcpapproducao.op op, 
                SUM(pcpapproducao.peso - pcpapproducao.peso_tara) totalProduzidoPeso,
                SUM(pcpapproducao.quantidade) totalProduzidoQtd
           FROM pcpapproducao
          WHERE pcpapproducao.empresa   = :empresa
            AND pcpapproducao.op        = :op
            AND pcpapproducao.etapa     = :etapa
       GROUP BY pcpapproducao.op`,
    selectEntregasOP:`
        SELECT pcpopep.pedido,
               pcpopep.seq_entrega,
               pcpopep.quantidade,
               estitem.unidade 
          FROM pcpopep, pcpop, estitem
         WHERE pcpopep.empresa   = :empresa
           AND pcpopep.empresa   = pcpop.empresa 
           AND pcpopep.op        = pcpop.op 
           AND pcpop.produto     = estitem.codigo 
           AND pcpopep.op        = :op
      ORDER BY pcpopep.seq_entrega`,
    selectTarasOP: `
     SELECT taras 
       FROM (   
        SELECT distinct NVL(pcpapprodlote.peso_tara, pcpapproducao.peso_tara) taras
          FROM pcpapproducao
     LEFT JOIN pcpapprodlote 
            ON pcpapproducao.empresa        = pcpapprodlote.empresa 
           AND pcpapproducao.sequencial     = pcpapprodlote.seq_ap  
         WHERE pcpapproducao.empresa   = :empresa
           AND pcpapproducao.op        = :op
           AND pcpapproducao.etapa     = :etapa
          )
     WHERE taras > 0`,
    selectTipoRecursoProdutivos: `
    SELECT pcptprecurso.codigo, pcptprecurso.descricao 
      FROM pcptprecurso, cadccusto
     WHERE pcptprecurso.empresa = :empresa
       AND pcptprecurso.empresa = cadccusto.empresa 
       AND pcptprecurso.centro_custo = cadccusto.codigo
       AND cadccusto.produtivo = 'S'
  ORDER BY pcptprecurso.codigo
    `,
    selectProducaoTurnoAtual: `
     SELECT dia dia,
            turno,
            recurso,
            empresa,
            SUM(quant_prod) quant_prod,
            SUM(peso_prod)  peso_prod
       FROM (SELECT pcpapproducao.empresa,
                    TO_CHAR(periodo.dia, 'dd') dia,
                    peso - peso_tara peso_prod,
                    pcpapproducao.recurso recurso,
                    periodo.turno,
                    pcpapproducao.quantidade quant_prod
               FROM pcpapproducao,pcprecurso,
                                       (SELECT pcpperiodostur.dia dia,
                                               pcpperiodostur.data_hora_ini data_hora_ini,
                                               pcpperiodostur.data_hora_fim data_hora_fim,
                                               pcpperiodostur.tipo_turno tipo_turno,
                                               turno
                                           FROM pcpperiodostur
                                          WHERE sysdate BETWEEN data_hora_ini
                                                           AND data_hora_fim ) periodo
              WHERE pcpapproducao.empresa = :empresa
                AND pcpapproducao.empresa = pcprecurso.empresa
                AND pcpapproducao.recurso = pcprecurso.codigo
                AND periodo.tipo_turno    = pcprecurso.tipo_turno
                AND pcprecurso.tipo_recurso = :tipo_recurso
                AND pcpapproducao.data_hora_fim BETWEEN periodo.data_hora_ini AND periodo.data_hora_fim)  
   GROUP BY dia,
            recurso,
            empresa,
            turno
            `,
    selectPalletsVolumesEnderecos: `
        SELECT pcpopcomponente.op_componente,
               pcpopcomponente.componente,
               pcpopcomponente.versao, 
               pcpopcomponente.etapa_aplicacao,
               f_descricao_item(pcpopcomponente.empresa, pcpopcomponente.componente, pcpopcomponente.versao) desc_comp,
               pcpopcomponente.total_aplicado,
               estpallet.sequencial pallet,
               estpallet.endereco,
               estpalletvol.quantidade,
               estpalletvol.peso_liquido,
               pcpapprodlote.seq_lote,
               DECODE(estpallet.situacao,'F','Fechado','I','Consumo Interno','X','Faturado','D', 'Cancelado', 'A', 'Aberto', 'C', 'Carregado'),
          FROM pcpopcomponente
          JOIN estitem
            ON pcpopcomponente.empresa = estitem.empresa
           AND pcpopcomponente.componente = estitem.codigo
          JOIN estpallet
            ON estpallet.empresa = pcpopcomponente.empresa
           AND estpallet.op = pcpopcomponente.op_componente
          JOIN estpalletvol
            ON estpalletvol.empresa = estpallet.empresa
           AND estpalletvol.sequencial = estpallet.sequencial
          JOIN pcpapprodlote
            ON pcpapprodlote.empresa = estpalletvol.empresa
           AND pcpapprodlote.seq_ap = estpalletvol.seq_producao
           AND pcpapprodlote.seq_lote = estpalletvol.seq_lote  
         WHERE pcpopcomponente.empresa = :empresa
           AND pcpopcomponente.op = :op  
           AND pcpopcomponente.etapa_aplicacao = :etapa
           AND estitem.tipo_item = 2
           AND estpallet.situacao NOT IN ('A','X','D'/* ,'I' */)
           AND pcpopcomponente.etapa_aplicacao = DECODE(( SELECT CASE WHEN MAX(COUNT(pcpopcomponente2.etapa_aplicacao)) > 1 
                                                           THEN 2 
                                                           ELSE 1 
                                                           END 
                                                            FROM pcpopcomponente pcpopcomponente2
                                                            JOIN estitem estitem2
                                                              ON pcpopcomponente2.empresa = estitem2.empresa
                                                             AND pcpopcomponente2.componente = estitem2.codigo
                                                            JOIN pcpetapa 
                                                              ON pcpetapa.empresa = pcpopcomponente2.empresa 
                                                             AND pcpetapa.codigo = pcpopcomponente2.etapa_aplicacao     
                                                           WHERE pcpopcomponente2.empresa = :empresa
                                                             AND pcpopcomponente2.op = :op
                                                             AND pcpetapa.tipo_recurso in (2, 3)
                                                             AND estitem2.tipo_item = 2 
                                                        GROUP BY pcpopcomponente2.componente, pcpopcomponente2.versao, pcpopcomponente2.op_componente),  2, pcpapprodlote.lote, pcpopcomponente.etapa_aplicacao) 
      ORDER BY decode(estpallet.situacao,'F',1,'I',2,3), estpallet.sequencial
    `,
     selectItensBobinasComposicao: `
     select pcpversao.produto, 
       pcpversao.versao, 
       estitem.descricao,
       --f_descricao_item(pcpversao.empresa, pcpversao.produto, pcpversao.versao),
       pcpgrupocomp.grupo, 
       insumo.codigo codigo_insumo,
       insumo.descricao descricao_insumo,
       pcpcomponente.quantidade_aplicada
  from estitem, pcpversao, pcpcomposicao, pcpcomponente, pcpgrupocomp, estitem insumo
 where estitem.empresa          = :empresa
   and estitem.empresa          = pcpversao.empresa 
   and pcpversao.empresa        = pcpcomposicao.empresa 
   and pcpcomposicao.empresa    = pcpcomponente.empresa 
   and pcpcomponente.empresa    = pcpgrupocomp.empresa
   and pcpversao.composicao     = pcpcomposicao.codigo  
   and estitem.codigo           = pcpversao.produto  
   and pcpcomposicao.codigo     = pcpcomponente.composicao
   and pcpcomponente.composicao = pcpgrupocomp.composicao
   and pcpcomponente.seq_grupo  = pcpgrupocomp.seq_grupo 
   and pcpcomponente.empresa    = insumo.empresa
   and pcpcomponente.componente = insumo.codigo 
   and estitem.tipo_item        = 2
   and estitem.situacao         = 'A'
     `,
  selectItensEstoque: `
  select 
pcpversao.produto, 
       f_descricao_item(pcpversao.empresa, pcpversao.produto, pcpversao.versao) descricao_item,
       estsaldos.quantidade,
       estitem.unidade,
       estsaldos.valor,
       estitem.tipo_item codigo_tipo_item,
       esttpitem.descricao descricao_tipo_item,
       estsaldos.deposito,
       estgrupo.descricao descricao_grupo,
       estsubgrupo.descricao descricao_subgrupo
  from estsaldos, pcpversao, estitem, esttpitem, estgrupo, estsubgrupo
 where estsaldos.empresa    = :empresa
   and estsaldos.empresa    = pcpversao.empresa 
   and pcpversao.empresa    = estitem.empresa
   and estitem.empresa      = esttpitem.empresa
   and esttpitem.empresa    = estgrupo.empresa 
   and estgrupo.empresa     = estsubgrupo.empresa
   and estsaldos.item        = pcpversao.produto 
   and estsaldos.versao     = pcpversao.versao
   and pcpversao.produto     = estitem.codigo 
   and estitem.tipo_item    = esttpitem.codigo
   and estitem.grupo||'#'||estitem.subgrupo = estgrupo.codigo || '#'||estsubgrupo.codigo
   and estgrupo.codigo = estsubgrupo.grupo
   and estsaldos.quantidade > 0 
   and estitem.tipo_item in (1,10,2)
  `,
  selectFaturamentoDia: `
  select tipo,
       nota, 
       serie, 
       peso, 
       CODIGO_ITEM || '/' || versao_item codigo_item ,
       VALOR_IPI,
       FATURAMENTO_LIQUIDO,
       TOTAL_ITEM,
       CODIGO_CORRENTISTA codigo_cliente,
       f_descricao_item(codigo_empresa,CODIGO_ITEM, versao_item ) as DESCRICAO_ITEM,
       NOME_CORRENTISTA nome_cliente,
       data_emissao,
       peso_devolucao,
       valor_devolucao,
       rs_kg
  from (
select 'DO DIA' TIPO,
       codigo_empresa, 
       nota, 
       serie, 
       peso, 
       CODIGO_ITEM,
       versao_item,
       VALOR_IPI,
       FATURAMENTO_LIQUIDO,
       TOTAL_ITEM,
       CODIGO_CORRENTISTA,
       DESCRICAO_ITEM,
       NOME_CORRENTISTA,
       data_emissao,
       0 peso_devolucao,
       0 valor_devolucao,
       decode(peso,0 ,0 , TOTAL_ITEM/peso ) rs_kg
  from view_fatnotait
 where codigo_empresa = :empresa
   and DATA_EMISSAO                           = trunc(sysdate)
   and view_fatnotait.situacao                = 'N'
   and view_fatnotait.venda                   = 'S'
       
union all
   
select 'DO DIA' TIPO,   
       codigo_empresa,
       nota, 
       serie, 
       0 peso,
       view_fatnotadev.codigo_item,
        versao_item,
       VALOR_IPI,
       0 FATURAMENTO_LIQUIDO,
       0 TOTAL_ITEM,
       CODIGO_CORRENTISTA,
       f_descricao_item(codigo_empresa,CODIGO_ITEM, versao_item ) as DESCRICAO_ITEM,
       NOME_CORRENTISTA,
       data_emissao,
       view_fatnotadev.peso_devolucao,
       --TOTAL_ITEM valor_devolucao
       view_fatnotadev.valor_devolucao valor_devolucao,
       0 rs_kg
  from view_fatnotadev
 where codigo_empresa = :empresa
   and DATA_EMISSAO                            = trunc(sysdate)
   and view_fatnotadev.situacao                = 'N'
   and view_fatnotadev.venda                   = 'S'
   )
  `,
  selectFilaAtual:`
  select pcpop.op, 
       pcpop.produto codigo_item,
       max(f_descricao_item(pcpop.empresa, pcpop.produto, pcpop.versao)) descricao_item, 
       pcpoprecurso.etapa,  
       pcpoprecurso.recurso,
       pcpoprecurso.data_prog_ini,
       pcpoprecurso.data_prog_fim, 
       pcpoprecurso.descricao_situacao, 
       pcpoprecurso.quantidade, 
       pcpoprecurso.peso,
       pcpoprecurso.prioridade,
       max(decode(pcpoprecurso.etapa,10,
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 123),
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 20)
       )) largura,
       max(decode(pcpoprecurso.etapa,10,
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 122),
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 22)
       )) espessura,
       max(decode(pcpoprecurso.etapa,10,
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 144),
       f_busca_valor_ficha(pcpop.empresa, pcpop.produto,pcpop.versao, null, 44)
       )) densidade,
       min(venpedidoep.previsao_entrega) previsao_entrega
  from pcpoprecurso, pcpop, pcpopep, venpedidoep
 where pcpoprecurso.empresa     = :empresa
   and pcpoprecurso.empresa     = pcpop.empresa
   and pcpop.empresa            = pcpopep.empresa
   and pcpopep.empresa          = venpedidoep.empresa
   and pcpoprecurso.op          = pcpop.op 
   and pcpop.op                 = pcpopep.op
   and pcpopep.pedido           = venpedidoep.pedido 
   and pcpopep.item_pedido      = venpedidoep.ITEM_PEDIDO
   and pcpopep.seq_entrega      = venpedidoep.sequencia
   and pcpoprecurso.situacao    in ('F')
   and pcpoprecurso.imprime = 'S'
   and etapa not in (90, 70)

group by pcpop.op, 
       pcpop.produto, 
       pcpoprecurso.etapa,  
       pcpoprecurso.recurso,
       pcpoprecurso.data_prog_ini,
       pcpoprecurso.data_prog_fim, 
       pcpoprecurso.descricao_situacao, 
       pcpoprecurso.quantidade, 
       pcpoprecurso.peso,
       pcpoprecurso.prioridade
  `,
  selectFilaRecursoOpInterrompida: 
  `select pcpoprecurso.empresa ,                    
                    pcpoprecurso.etapa,                     
                    pcpoprecurso.recurso,                     
                    pcpoprecurso.prioridade,                     
                    pcpoprecurso.op,                     
                    pcpop.produto, 
                    pcpop.versao,
                    f_descricao_item(pcpop.empresa, pcpop.produto, pcpop.versao) descricao_item,
                    pcpoprecurso.quantidade,                     
                    pcpoprecurso.peso,                     
                    to_char(pcpoprecurso.data_prog_ini, 'dd/mm/yyyy hh24:mi') data_prog_ini,                     
                    to_char(pcpoprecurso.data_prog_fim, 'dd/mm/yyyy hh24:mi') data_prog_fim,
                    -- Codigo Clicheria
                    REGEXP_REPLACE(f_busca_valor_ficha(pcpoprecurso.empresa,pcpop.produto,pcpop.versao, null, 3241),'[[:space:]]','') codigo_clicheria,
                    pcpop.plano,
                    -- Velocidade Recomendada
                    f_busca_valor_ficha(pcpoprecurso.empresa,pcpop.produto,pcpop.versao, null, 3253) velocidade_recomendada,
                    -- Previsões de entrega dos pedidos relacionados na OP
                    (SELECT wm_concat(venpedidoep.previsao_entrega)
                       FROM pcpopep, venpedidoep
                      WHERE pcpopep.empresa       = :empresa
                        AND pcpopep.empresa       = venpedidoep.empresa
                        AND pcpopep.pedido        = venpedidoep.pedido
                        AND pcpopep.item_pedido   = venpedidoep.item_pedido
                        AND pcpopep.seq_entrega   = venpedidoep.sequencia
                        AND pcpopep.op            = f_op_do_pedido(1, pcpop.op)) previsao_entrega,
                    -- Quantidade de Cores cadastrada na OP
                    (SELECT COUNT(*)
                       FROM pcpopcomponente, pcpopgrupocomp
                      WHERE pcpopcomponente.empresa   = :empresa
                        AND pcpopcomponente.empresa   = pcpopgrupocomp.empresa
                        AND pcpopcomponente.op        = pcpop.op
                        AND pcpopcomponente.op        = pcpopgrupocomp.op
                        AND pcpopcomponente.seq_grupo = pcpopgrupocomp.seq_grupo
                        AND pcpopgrupocomp.grupo like 'COR%') qtd_cores_op,
                    pcpoprecurso.situacao

               from pcpoprecurso, pcpop                                                      
              where pcpoprecurso.empresa    = :empresa                                               
                and pcpoprecurso.empresa    = pcpop.empresa                                                      
                and pcpoprecurso.op         = pcpop.op                                                   
                and pcpop.situacao          in ('A','P')                                                     
                and pcpoprecurso.situacao   in ('T')
                and pcpoprecurso.recurso    = :recurso                                       
           order by pcpoprecurso.recurso, pcpoprecurso.prioridade, pcpoprecurso.op
  `,

  selectOPsEmAberto:
  `
  select op, etapa, descricao_item, recurso, 
       total_produzido, total_perdido, total_consumido,
       case when resultado_equacao > 0 
       then resultado_equacao
       else 0 end QTD_FALTA_CONSUMIR,
       case when resultado_equacao < 0 
       then resultado_equacao
       else 0 end QTD_FALTA_APONT_PROD_PERD,
       bobinas_para_consumir,
       componentes_para_consumir
  from 
(
WITH producao AS (
    SELECT
        pcpapproducao.empresa,
        pcpapproducao.op,
        pcpapproducao.etapa,
        SUM(pcpapprodlote.peso - NVL(pcpapprodlote.peso_tara, 0)) AS total_produzido
    FROM pcpapproducao
    JOIN pcpapprodlote
      ON pcpapprodlote.empresa = pcpapproducao.empresa
     AND pcpapprodlote.seq_ap  = pcpapproducao.sequencial
    GROUP BY
        pcpapproducao.empresa,
        pcpapproducao.op,
        pcpapproducao.etapa
),
perda AS (
    SELECT
        pcpapperda.empresa,
        pcpapperda.op,
        pcpapperda.etapa,
        SUM(pcpapperda.peso) AS total_perdido
    FROM pcpapperda
    GROUP BY
        pcpapperda.empresa,
        pcpapperda.op,
        pcpapperda.etapa
),
insumo AS (
    SELECT
        pcpapinsumo.empresa,
        pcpapinsumo.op,
        pcpapinsumo.etapa,
        ROUND(SUM(pcpapinsumo.peso), 1) AS total_consumido
    FROM pcpapinsumo
    GROUP BY
        pcpapinsumo.empresa,
        pcpapinsumo.op,
        pcpapinsumo.etapa
),
bobinas AS (
    SELECT
        pcpopcomponente.empresa,
        pcpopcomponente.op,
        pcpopcomponente.etapa_aplicacao AS etapa,
        LISTAGG(
            pcpopcomponente.componente || ' - ' ||
            f_descricao_item(
                pcpopcomponente.empresa,
                pcpopcomponente.componente,
                pcpopcomponente.versao
            )
        ) WITHIN GROUP (ORDER BY pcpopcomponente.componente) AS bobinas_para_consumir
    FROM pcpopcomponente
    JOIN estitem
      ON estitem.empresa = pcpopcomponente.empresa
     AND estitem.codigo = pcpopcomponente.componente
    WHERE estitem.tipo_item = 2
    GROUP BY
        pcpopcomponente.empresa,
        pcpopcomponente.op,
        pcpopcomponente.etapa_aplicacao
),
componentes AS (
    SELECT
        pcpopcomponente.empresa,
        pcpopcomponente.op,
        pcpopcomponente.etapa_aplicacao AS etapa,
        LISTAGG(
            pcpopcomponente.componente || ' - ' ||
            f_descricao_item(
                pcpopcomponente.empresa,
                pcpopcomponente.componente,
                pcpopcomponente.versao
            ),
            ' || '
        ) WITHIN GROUP (ORDER BY pcpopcomponente.componente) AS componentes_para_consumir
    FROM pcpopcomponente
    JOIN estitem
      ON estitem.empresa = pcpopcomponente.empresa
     AND estitem.codigo = pcpopcomponente.componente
    WHERE estitem.tipo_item = 10
    GROUP BY
        pcpopcomponente.empresa,
        pcpopcomponente.op,
        pcpopcomponente.etapa_aplicacao
)

SELECT
    pcpoprecurso.op,
    pcpoprecurso.etapa,
    MIN(f_descricao_item(pcpop.empresa,pcpop.produto,pcpop.versao)) AS descricao_item,
    MIN(pcpoprecurso.recurso) recurso, 
    MIN(NVL(producao.total_produzido, 0)) AS total_produzido,
    MIN(NVL(perda.total_perdido, 0)) AS total_perdido,
    MIN(NVL(insumo.total_consumido, 0)) AS total_consumido,
    MIN(NVL(producao.total_produzido, 0) + NVL(perda.total_perdido, 0)) AS total_prod_perdido,
    MIN((NVL(producao.total_produzido, 0) + NVL(perda.total_perdido, 0)) - NVL(insumo.total_consumido, 0)) AS resultado_equacao,
    bobinas.bobinas_para_consumir,
    componentes.componentes_para_consumir
FROM pcpoprecurso
JOIN pcpop
  ON pcpop.empresa = pcpoprecurso.empresa
 AND pcpop.op      = pcpoprecurso.op

LEFT JOIN producao
  ON producao.empresa = pcpoprecurso.empresa
 AND producao.op      = pcpoprecurso.op
 AND producao.etapa   = pcpoprecurso.etapa

LEFT JOIN perda
  ON perda.empresa = pcpoprecurso.empresa
 AND perda.op      = pcpoprecurso.op
 AND perda.etapa   = pcpoprecurso.etapa

LEFT JOIN insumo
  ON insumo.empresa = pcpoprecurso.empresa
 AND insumo.op      = pcpoprecurso.op
 AND insumo.etapa   = pcpoprecurso.etapa

LEFT JOIN bobinas
  ON bobinas.empresa = pcpoprecurso.empresa
 AND bobinas.op      = pcpoprecurso.op
 AND bobinas.etapa   = pcpoprecurso.etapa

LEFT JOIN componentes
  ON componentes.empresa = pcpoprecurso.empresa
 AND componentes.op      = pcpoprecurso.op
 AND componentes.etapa   = pcpoprecurso.etapa

WHERE pcpoprecurso.empresa  = :empresa
  AND pcpoprecurso.etapa    IN (20, 21, 30, 31, 40, 41, 50, 51, 52, 53, 54, 55)
  AND pcpoprecurso.op       = :op
  AND pcpoprecurso.situacao IN ('T', 'P')

GROUP BY 
pcpoprecurso.op,
    pcpoprecurso.etapa,
    bobinas.bobinas_para_consumir,
    componentes.componentes_para_consumir
)
  `,
  selectPalletEmAberto:
  `
select 
pallet, 
item,
op,
desc_item,
endereco,
recurso_que_produziu,
etapa_que_produziu,
pcprecurso.nome setor_que_produziu,
sum(peso_pallet) peso_pallet


from (

        SELECT estpallet.empresa,
               estpallet.sequencial pallet,
               estpallet.item, 
               estpallet.op,
               estpallet.endereco,
               (select MAX(recurso)
                  from pcpapproducao
                 where pcpapproducao.empresa = pcpapprodlote.empresa
                   and pcpapproducao.sequencial = pcpapprodlote.seq_ap) recurso_que_produziu,
               (select MAX(etapa)
                  from pcpapproducao
                 where pcpapproducao.empresa = pcpapprodlote.empresa
                   and pcpapproducao.sequencial = pcpapprodlote.seq_ap) etapa_que_produziu,
               estpallet.situacao,
               pcpapprodlote.seq_ap,
               pcpapprodlote.seq_lote,
               f_descricao_item(estpallet.empresa, estpallet.item ,estpallet.versao) desc_item,
               (pcpapprodlote.peso - pcpapprodlote.peso_tara) peso_bobina,

               (pcpapprodlote.peso - pcpapprodlote.peso_tara) -
               NVL((SELECT SUM(pcpapinsumo.peso)
                      FROM pcpapinsumo 
                     WHERE pcpapinsumo.empresa = 1 
                       AND pcpapinsumo.lote = 7000||pcpapprodlote.seq_ap||pcpapprodlote.seq_lote),0) peso_pallet,
               NVL((SELECT SUM(pcpapinsumo.peso)
                      FROM pcpapinsumo 
                     WHERE pcpapinsumo.empresa = 1 
                       AND pcpapinsumo.lote = 7000||pcpapprodlote.seq_ap||pcpapprodlote.seq_lote),0) total_consumido
               
          FROM estpallet
          JOIN estpalletvol  
            ON estpalletvol.empresa = estpallet.empresa
           AND estpalletvol.sequencial = estpallet.sequencial 
          JOIN pcpapprodlote  
            ON pcpapprodlote.empresa = estpalletvol.empresa 
           AND pcpapprodlote.seq_ap = estpalletvol.seq_producao  
           AND pcpapprodlote.seq_lote = estpalletvol.seq_lote  
          JOIN estitem
            ON estpallet.empresa = estitem.empresa 
           AND estpallet.item = estitem.codigo  
         WHERE estpallet.empresa = :empresa   
           AND nvl(estpallet.tipo_pallet,0) NOT IN (2) 
           AND estpallet.situacao NOT IN ('D','I','X','A')
           AND EXISTS (SELECT 1 
                         FROM pcpopcomponente 
                        WHERE pcpopcomponente.empresa = estpallet.empresa 
                          AND pcpopcomponente.op      = :op
                          AND pcpopcomponente.componente = estpallet.item )
      
) pallets,
pcprecurso

where pallets.empresa = pcprecurso.empresa
  AND pallets.recurso_que_produziu = pcprecurso.codigo    
group by pallet, 
item,
op,
desc_item,
endereco,
recurso_que_produziu,
etapa_que_produziu,
pcprecurso.nome

  `,
selectPalletsLidos: `
select 
pallet, 
item,
op,
desc_item,
endereco,
recurso_que_produziu,
etapa_que_produziu,
pcprecurso.nome setor_que_produziu,
sum(peso_pallet) peso_pallet


from (

        SELECT estpallet.empresa,
               estpallet.sequencial pallet,
               estpallet.item, 
               estpallet.op,
               estpallet.endereco,
               (select MAX(recurso)
                  from pcpapproducao
                 where pcpapproducao.empresa = pcpapprodlote.empresa
                   and pcpapproducao.sequencial = pcpapprodlote.seq_ap) recurso_que_produziu,
               (select MAX(etapa)
                  from pcpapproducao
                 where pcpapproducao.empresa = pcpapprodlote.empresa
                   and pcpapproducao.sequencial = pcpapprodlote.seq_ap) etapa_que_produziu,
               estpallet.situacao,
               pcpapprodlote.seq_ap,
               pcpapprodlote.seq_lote,
               f_descricao_item(estpallet.empresa, estpallet.item ,estpallet.versao) desc_item,
               (pcpapprodlote.peso - pcpapprodlote.peso_tara) peso_bobina,

               (pcpapprodlote.peso - pcpapprodlote.peso_tara) -
               NVL((SELECT SUM(pcpapinsumo.peso)
                      FROM pcpapinsumo 
                     WHERE pcpapinsumo.empresa = :empresa
                       AND pcpapinsumo.lote = 7000||pcpapprodlote.seq_ap||pcpapprodlote.seq_lote),0) peso_pallet,
               NVL((SELECT SUM(pcpapinsumo.peso)
                      FROM pcpapinsumo 
                     WHERE pcpapinsumo.empresa = :empresa
                       AND pcpapinsumo.lote = 7000||pcpapprodlote.seq_ap||pcpapprodlote.seq_lote),0) total_consumido
               
          FROM estpallet
          JOIN estpalletvol  
            ON estpalletvol.empresa = estpallet.empresa
           AND estpalletvol.sequencial = estpallet.sequencial 
          JOIN pcpapprodlote  
            ON pcpapprodlote.empresa = estpalletvol.empresa 
           AND pcpapprodlote.seq_ap = estpalletvol.seq_producao  
           AND pcpapprodlote.seq_lote = estpalletvol.seq_lote  
          JOIN estitem
            ON estpallet.empresa = estitem.empresa 
           AND estpallet.item = estitem.codigo  
         WHERE estpallet.empresa = :empresa
           AND nvl(estpallet.tipo_pallet,0) NOT IN (2) 
           AND estpallet.situacao NOT IN ('D','I','X','A')
           and estpallet.sequencial in (select volume from ESTBALANCOITBARRA1 where empresa = :empresa and balanco = 504922 and tipo_barra = 'PALLET')
           AND EXISTS (SELECT 1 
                         FROM pcpopcomponente 
                        WHERE pcpopcomponente.empresa = estpallet.empresa 
                          AND pcpopcomponente.op      = :op
                          AND pcpopcomponente.componente = estpallet.item )
      
) pallets,
pcprecurso

where pallets.empresa = pcprecurso.empresa
  AND pallets.recurso_que_produziu = pcprecurso.codigo   

group by pallet, 
item,
op,
desc_item,
endereco,
recurso_que_produziu,
etapa_que_produziu,
pcprecurso.nome
`
}
module.exports = sql;