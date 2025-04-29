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
            `
}
module.exports = sql;