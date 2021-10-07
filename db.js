console.log("Modulo DB Iniciado")
async function connect() {

    const mysql = require("mysql2/promise");
    let connCreds = require('./connectionsConfig.json');
    const connection = await mysql.createConnection({
        host: connCreds['host'],
        user: connCreds['username'],
        password: connCreds['password'],
        database: connCreds['database'],
        port: 3306
    });
    console.log("Conectado ao Mysql");
    return connection;
}

async function connectionClose() {
    const conn = await connect();
    return await conn.end();
}

async function insertProducao(producao){
    const conn = await connect();
    const sql = 'INSERT INTO producao(op,maquina,datainicio,datafim,quantidade, numbob) VALUES (?,?,?,?,?,?);';
    const values = [producao.op, producao.maquina, producao.datainicio, producao.datafim, producao.quantidade, producao.numbob];
    const resultInsert = await conn.query(sql,values);
    conn.end();
    return resultInsert;
}

async function selectProducao(op, recurso) {
    const conn = await connect();
    const [rows] = await conn.query(`SELECT * FROM producao where op = ${op} and maquina = ${recurso} and id = (select max(id) from producao where op = ${op} and maquina = ${recurso})`);
    conn.end();
    return rows;
}
async function selectMaquina(maquina) {
    const conn = await connect();
    const [rows] = await conn.query(`SELECT * FROM producao where maquina = ${maquina} order by datainicio desc`);
    conn.end();
    return rows;
    }

async function updateOPMaquina(producao) {
    const conn = await connect();
    const sql = 'UPDATE producao SET marcado =? where id =?';
    const values = [producao.marcado, producao.id];
    const resultUpdate = await conn.query(sql, values);
    conn.end();
    return resultUpdate; 
}

async function updateProducao(producao) {
    const conn = await connect();
    const sql = 'UPDATE producao SET maquina =?, datainicio =?, datafim =?, quantidade =? where id =?';
    const values = [producao.maquina, producao.datainicio, producao.datafim, producao.quantidade, producao.id];
    const resultUpdate = await conn.query(sql, values);
    conn.end();
    return resultUpdate;
}

async function deleteOPMaquina(producao) {
    const conn = await connect();
    const sql = 'DELETE from producao where id =?';
    const values = [producao.id];
    const resultDelete = await conn.query(sql, values);
    conn.end();
    return resultDelete 
}
async function selectFila(recurso) {
    const conn = await connect();
    //const [rows] = await conn.query(`SELECT * FROM pcpfila where recurso = ${recurso} order by seq_fila`);
    const [rows] = await conn.query(`SELECT *, 
                                    (select count(codigo_item) from perfilcores where codigo_item = pcpfila.codigo_item) as tem_perfil 
                                     FROM pcpfila where recurso = ${recurso} order by seq_fila`);
    conn.end();
    return rows;
}
async function numBob(op) {
    let numOP = op.op;
    const conn = await connect();
    const [rows] = await conn.query(`SELECT IFNULL((SELECT max(numbob)+1 FROM producao where op = ${numOP} group by op),1) as bob FROM DUAL`);
    conn.end();
    return rows;
}
async function selectPerfilCores(codigo_item) {
    const conn = await connect();
    const [rows] = await conn.query(`SELECT * FROM perfilcores where codigo_item = ${codigo_item} order by seq_cor`);
    conn.end();
    return rows;
}
async function selectTipoImagem(recurso) {
        const conn = await connect();
        const [rows] = await conn.query(`SELECT tipoimagemitem.id_tipo_imagem, tipoimagemitem.descricao_tipo_imagem, 
                                                tipoimagemitem.codigo_item
                                           FROM tipoimagemitem, pcpfila 
                                          where tipoimagemitem.codigo_item = pcpfila.codigo_item
                                            and pcpfila.recurso = ${recurso}              
                                       group by codigo_item, tipoimagemitem.id_tipo_imagem, tipoimagemitem.descricao_tipo_imagem
                                       order by tipoimagemitem.id_tipo_imagem desc`);
    conn.end();   
    return rows;
}
async function selectOPsMrp(recurso) {
    const conn = await connect();
    const [rows] = await conn.query(`select mrp, (select codigo_cor from coresmrp where seq_cor = coresmrp.rownum) as codigo_cor 
                                       from (
                                            SELECT (@row_number :=@row_number +1) as rownum, 
                                                    max(mrp) as mrp 
                                              FROM pcpfila, (SELECT @row_number:=0) AS t 
                                             WHERE recurso = ${recurso}
                                               and mrp is not null 
                                          group by mrp 
                                          order by mrp) as coresmrp`)
    conn.end();
    return rows;
}
module.exports = {connectionClose, selectProducao, insertProducao, selectMaquina, updateOPMaquina, deleteOPMaquina, updateProducao, selectFila, 
    numBob, selectPerfilCores, selectTipoImagem, selectOPsMrp}