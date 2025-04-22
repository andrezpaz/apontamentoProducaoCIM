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
        SELECT distinct pcpapproducao.peso_tara taras
          FROM pcpapproducao
         WHERE pcpapproducao.empresa   = :empresa
           AND pcpapproducao.op        = :op
           AND pcpapproducao.etapa     = :etapa`
}
module.exports = sql;