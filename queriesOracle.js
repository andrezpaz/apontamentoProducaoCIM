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
               estpallet.situacao
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
      ORDER BY decode(estpallet.situacao,'I',1,'F',2,3), estpallet.sequencial
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
  `
}
module.exports = sql;