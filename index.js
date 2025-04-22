// https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const router = express.Router();
const alert = require('alert');
const { render } = require('ejs');
var functions = require('./scripts/client');
var fs = require('fs');
const { resourceLimits } = require('worker_threads');
const axios = require('axios');
const https = require('https');

const oracledb = require('oracledb');
oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_21_8/' });
const sqlOracle = require('./queriesOracle');

app.use(bodyParser.urlencoded({ extended: false }));


async function connectionOracle() {
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
    let conn = await oracledb.getConnection({ user: process.env.DB_USER, password: process.env.DB_PASS, connectionString: process.env.DB_HOST});
    return conn;
}

async function queryOracle(query, binds = [], insert) {
    let connection;
    try {
        connection = await connectionOracle();
        const result = await connection.execute(
            query,
            binds,
            []
        );

        if (insert) {
            await connection.commit();
        }

        return result.rows || [];
        
    } catch (err) {
        console.log(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
}


function showDate() {
    return " - Data: " + new Date()
}

function listDirectoryImages() {
    let dir = __dirname+'/images/itens/';
    let filesDir = fs.readdirSync(dir);
    let statFiles = filesDir.map((file)=>{
        let statFile = fs.statSync(dir+file)
        let dateModFile = statFile.mtime.toLocaleString()
        return {file:file, date:dateModFile}
    })
    return statFiles
}

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

//import moment from 'moment';

//const database = require("./db");

// create application/json parser
var jsonParser = bodyParser.json();

// Definie View Padrao
app.set('views', './views');
app.set('view engine', 'ejs');

// Definie Diretorios padrodes
app.use('/images', express.static('images'));
app.use('/files', express.static('files'));

router.get('/', function(req,res) {
    res.sendFile(path.join(__dirname+'/index.html'))
})

router.get('/apontamento', function(req, res) {
    let producao = [{op:'', maquina:'', datainicio: '', datafim: '', quantidade:''}]; // define o array para quando carregar a primeira vez
    res.render('apontamento', {producao: producao, functions:functions})
    //res.redirect(req.get('apontamento', {producao: producao}))
})

// https://stackoverflow.com/questions/53918363/insert-into-mysql-table-from-html-simple-form-using-node-js-and-javascript/53919762


app.post('/insert', jsonParser, function(request, response) {
    
    const dataProducao = request.body;
    console.log('\nIniciando insercao do apontamento ' + showDate());
    ( async () => {
        const db = require("./db");
        let numbob = await db.numBob({op:dataProducao.op});
        let bob = numbob[0].bob;
        const result = await db.insertProducao({op: dataProducao.op, maquina:dataProducao.maquina, datainicio: dataProducao.datainicio, 
                                                datafim: dataProducao.datafim, quantidade: dataProducao.quantidade, numbob:bob})
           .then ((resultInsert) => {
                console.log("Sucesso No Insert" + showDate())
                console.log(resultInsert);
                let ress = resultInsert[0].insertId.toString();
            })
            .catch ((error) => {
                console.log("ERRO NO INSERT" + showDate())
                console.log(error)
            }) 
    }
    )()
    
})

app.post('/update', jsonParser, function(request, response) {
    const updateOPMaquina = request.body
    console.log('\nUPDATE OP MAQUINA' + showDate());
    ( async () => {
        const db = require("./db");
        const testResult = {marcado: updateOPMaquina.marcado, id:updateOPMaquina.id}
        const result = await db.updateOPMaquina({marcado: updateOPMaquina.marcado, id:updateOPMaquina.id});
        console.log(result);
    })();
})

app.post('/updateProducao', jsonParser, function(request, response) {
    const updateProd = request.body;
    console.log('\nUPDATE PRODUCAO' + showDate());
    ( async () => {
        const db = require("./db");
        const result = await db.updateProducao({maquina:updateProd.maquina, datainicio: updateProd.datainicio, datafim: updateProd.datafim, 
                                                quantidade: updateProd.quantidade, id:updateProd.id});
    })();
})

//https://stackoverflow.com/questions/26690271/how-to-send-array-values-to-html-pages-in-express-js
//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application-pt


app.post('/deleteProducao', jsonParser, function(request, response) {
    const deleteProd = request.body;
    console.log('\nDELETE PRODUCAO ID: ' + deleteProd.id + showDate());
    ( async () => {
        const db = require("./db");
        const result = await db.deleteOPMaquina({id:deleteProd.id});
    })();
})


function queryOP(buscaOP, recurso) {
    return (async () => {
        const db = require("./db");
        //const op = req.params.op;
        console.log('\nBuscando OP : ' + buscaOP + showDate());
        const producao = await db.selectProducao(buscaOP, recurso)
        return producao; 
    })
    ();
}

app.post("/apont", (req, res) => {
    const buscaOP = req.body;
    if (buscaOP.op && buscaOP.maquina !=="Selecione") {
        console.log(buscaOP)
        queryOP(buscaOP.op, buscaOP.maquina).then(function (result){
        if ((result.length > 0) && !(result.datafim)){
            console.log("\nApontamento em aberto encontrado" + showDate());
            res.render('apontamento', {producao:result, functions:functions})
        } else {
            console.log("\nSem Dados Encontrados")
            console.log("Iniciando com novo apontamento")
            let producao = [{op:buscaOP.op, maquina:buscaOP.maquina, datainicio: '', datafim: '', quantidade:''}]; // define o array para quando carregar a primeira vez
            res.render('apontamento', {producao: producao, functions:functions})
        }
        });
    }
})

router.get('/maquinas', function(req,res) {
    res.sendFile(path.join(__dirname+'/maquinas.html') )
})
router.get('/maquinas/:recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectMaquina(recurso);
        if (maquina) {
        console.log("Iniciando busca de apontamentos do recurso : " + maquina[0].maquina + showDate());
        res.render('maquinas', {maquina: maquina})
        }
    })();
})


router.get('/defultIframe', function (req, res) {
    res.sendFile(path.join(__dirname+'/defaultIfrme.html'))
})

router.get('/fila_tipo_recurso/:tipo_recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const tipo_recurso = req.params.tipo_recurso;
        const listMaquinasFila = await db.selectRecursoFila(tipo_recurso);
        if (listMaquinasFila.length > 0) {
            res.render('recursos_fila', {listMaquinasFila: listMaquinasFila, functions:functions})
        } else {
            res.render('errorPage', {msg:"Recurso não encontrado ou Sem OPs programadas !"})
        }
    })();
    
})

router.get('/fila/:recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectFila(recurso);
        const tipo_imagem = await db.selectTipoImagem(recurso);
        const mrpList = await db.selectOPsMrp(recurso);
        const componentes_fila = await db.selectComponetesFila(recurso);
        let codigo_cor_mrp;
        let saldo_somado_comp_op = {}

        componentes_fila.forEach(componente => {
            const chave = `${componente.op}-${componente.etapa}`;
            if (componente.saldo === undefined || componente.saldo === null) {
                componente.saldo = 0; // Define o saldo como 0 se for nulo ou indefinido
            }
            if (!saldo_somado_comp_op[chave]) {
                saldo_somado_comp_op[chave] = parseFloat(componente.saldo);
            } else {
                saldo_somado_comp_op[chave] += parseFloat(componente.saldo);
            }
        });

        let novafila = maquina.reduce((acumula, element) =>{
            let tipo_imagem_item = tipo_imagem.filter(item => item.codigo_item === element.codigo_item )
            let cor_mrp = mrpList.find(mrp => mrp.mrp === element.mrp)
            if (cor_mrp) codigo_cor_mrp = cor_mrp.codigo_cor 
            else codigo_cor_mrp = null;
            let componente_op_negativo = componentes_fila.some(componentes => 
                    componentes.op === element.op && componentes.etapa === element.etapa && componentes.saldo < 1
                )
            let componente_bob_extrusada = componentes_fila.some(componentes => 
                componentes.op === element.op && componentes.etapa === element.etapa && componentes.tipo_componente === 'bobina_extrusada'
            )
            let componente_bob_terceiro = componentes_fila.some(componentes => 
                componentes.op === element.op && componentes.etapa === element.etapa && componentes.tipo_componente === 'bobina_terceiro'
            )
            
        
            acumula.push({'op':element.op,
                          'recurso': element.recurso,
                          'seq_fila': element.seq_fila,
                          'inicioprog':element.inicioprog,
                          'fimprog': element.fimprog, 
                          'peso': Number(element.peso).toLocaleString('pt-BR'),
                          'quantidade': Number(element.quantidade).toLocaleString('pt-BR'),
                          'nomecliente': element.nomecliente,
                          'descricao_item': element.descricao_item,
                          'cod_clicheria': element.cod_clicheria,
                          'codigo_item': element.codigo_item,
                          'tem_perfil': element.tem_perfil,
                          'codigo_cor_mrp': codigo_cor_mrp,
                          'TIPO_IMAGEM':tipo_imagem_item,
                          'velocidade_item': element.velocidade_item,
                          'previsoes_entregas': element.previsoes_entregas,
                          'quantidade_cores': element.quantidade_cores,
                          'situacao_recurso': element.situacao_recurso,
                          'componente_op_negativo': componente_op_negativo,
                          'etapa': element.etapa,
                          'saldo_componentes': saldo_somado_comp_op[`${element.op}-${element.etapa}`],
                          'componente_bob_extrusada': componente_bob_extrusada,
                          'componente_bob_terceiro':componente_bob_terceiro})
        return acumula
        },[]);
        console.log("\nIniciando Busca da Fila Recurso : " + recurso + showDate());
        if (novafila.length > 0) {
            res.render('fila', {maquina: novafila, functions:functions})
        } else {
            res.render('errorPage', {msg:"Recurso não encontrado ou Sem OPs programadas !"})
        }
        
    })();
 
})

router.get('/errorPage', function(req,res){
    let msg = "Erro 404 - Não encontrado"
    res.render('errorPage', {msg:msg})
})

router.get('/perfilcores/:item', function(req, res) {
    (async () => {
        const db = require("./db");
        const codigo_item = req.params.item;
        const perfilcores = await db.selectPerfilCores(codigo_item);
        console.log("\nIniciando busca do perfil do item : " + codigo_item + showDate())
        res.render('perfilcores', {perfilcores: perfilcores})
    })();
})

router.get('/componentes/:op/:etapa/:recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const op = req.params.op;
        const etapa = req.params.etapa;
        const recurso = req.params.recurso;
        const componentes_op = await db.selectComponetesFilaDetalhes(recurso, op, etapa);
        console.log("\nIniciando busca dos componentes da OP : " + op + showDate())
        res.render('componentes_detalhes', {componentes_op: componentes_op})
    })();
})


const auth = require('./auth');
const e = require('express');
const { deflate } = require('zlib');


router.get('/images/itens/delete', auth, function(req, res){
    let files = listDirectoryImages()
    res.render('deleteitens', {itens:files})
})

router.post('/images/itens/deletefile', auth, function(req, res) {
    const item = req.body.file;
    let files = listDirectoryImages()
    var filePath = __dirname+'/images/itens/'+item;
    if (item) {
        console.log("Item Preenchido:  " + item)
        if (fs.existsSync(filePath)) {
            console.log("Item deletado: " + item);
            fs.unlinkSync(filePath)
            res.redirect('/images/itens/delete')
        } else {
            res.redirect('/images/itens/delete')
        }
    } else {
        res.redirect('/images/itens/delete')
    }
})

router.get('/images/itens/:imageName', (req, res) =>{
    const imageName = req.params.imageName;

    const imagePaths = [
        path.join(__dirname, 'images', 'itens', imageName + '.jpg'),
        path.join(__dirname, 'images', 'itens', imageName + '.webp')
    ];
    let imagePath = null;

    for (const path of imagePaths) {
        if (fileExists(path)) {
            imagePath = path
            break
        }
    }

    if (imagePath) {
        const extension = path.extname(imagePath)
        const contentType = extension === '.webp' ? 'image/webp' : 'image/jpg';
        res.type(contentType);
        res.sendFile(imagePath)
    } else {
        res.status(404).send('Imagem não encontrada')
    }

})

router.post('/getUrlFila', jsonParser, async (req, res) => {
    let connCreds = require('./connectionsConfig.json');
    const codRecurso = req.body.recurso;
    const apiURL = connCreds['URL_FILA'];
    const urlFila = `${apiURL}/${codRecurso}`;
    try {
        const response = await axios.get(urlFila);
        if (response.status === 200) {
            res.json({ urlFila });
        } else {
            res.status(500).json({error:'URL com erro' + response.status})
        }
    }
    catch (error) {
        res.status(500).json({error:'Falha ao obter a URL', details:error.message})
    }
})

router.post('/getUrlChecklist', jsonParser, async (req, res) =>{
    let connCreds = require('./connectionsConfig.json');
    const apiURL = connCreds['URL_CHECKLIST'];
    const numeroOP = req.body.op;
    const codEtapa = req.body.etapa;
    const codRecurso = req.body.recurso;
    const urlChecklist = `${apiURL}?op=${numeroOP}&etapa=${codEtapa}&recurso=${codRecurso}`;
    try {
        const response = await axios.get(urlChecklist);
        if (response.status === 200) {
            res.json({ urlChecklist });
        } else {
            res.status(500).json({error:'URL com erro' + response.status})
        }
    }
    catch (error) {
        res.status(500).json({error:'Falha ao obter a URL', details:error.message})
    }
})

router.post('/getUrlConsumo', jsonParser, async (req, res) =>{
    let connCreds = require('./connectionsConfig.json');
    const apiURL = connCreds['URL_CONSUMO'];
    const numeroOP = req.body.op;
    const codEtapa = req.body.etapa;
    const codRecurso = req.body.recurso;
    const urlConsumo = `${apiURL}?op=${numeroOP}&etapa=${codEtapa}&recurso=${codRecurso}`;

    // Criando um agente HTTPS que ignora a verificação de certificado
    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    try {
        const response = await axios.get(urlConsumo); //, { httpsAgent: agent }); por enqunato nao usa https na api
        if (response.status === 200) {
            res.json({ urlConsumo });
        } else {
            res.status(500).json({error:'URL com erro' + response.status})
        }
    }
    catch (error) {
        res.status(500).json({error:'Falha ao obter a URL', details:error.message})
    }
})

router.post('/gerarOP', jsonParser, async (req, res) =>{
    let connCreds = require('./connectionsConfig.json');
    const apiURL = connCreds['API_URL_INIFLEX'];
    const token = connCreds['API_TOKEN_INIFLEX'];

    const params = {
        eOrigemExecucao:'ROTINA',
        relatorio: 'rpcp156',
        empresa: 1,
        pEmpresa: 1, 
        pUsuario: 1027,
        pOp: req.body.op,
        pEtapa: req.body.etapa,
        pSeqEtapa: req.body.seqEtapa,
        pRecurso: req.body.recurso

    };

    try {
        const response = await axios.get(apiURL, {
            headers: {
                 'Authorization': `Bearer ${token}`
            },
            params: params
        });
    
        //Dados PDF em Base64
        const base64Data = response.data.binario;
        const nameFile = response.data.nome;
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const pdfFilePath = path.join(__dirname, 'files', nameFile);
    
        //Salvando arquivo PDF
        fs.writeFileSync(pdfFilePath, pdfBuffer);
    
        res.json({fileURL: `/files/${nameFile}`})
    } catch (error) {
        console.log('Erro ao gerar OP', error);
        res.status(500).send('Erro ao gerar OP');
    }
    
})

async function selecProdProgOP(ordemProducao, etapa) {
    const binds = {
       empresa: 1,
       etapa: etapa,
       op: ordemProducao
    }
   let result = await queryOracle(sqlOracle.selectProdProg, binds);
   return result
}
async function selectEntregasOP(ordemProducao) {
    const binds = {
       empresa: 1,
       op: ordemProducao
    }
   let result = await queryOracle(sqlOracle.selectEntregasOP, binds);
   return result
}
async function selectTarasOP(ordemProducao, etapa) {
    const binds = {
       empresa: 1,
       op: ordemProducao,
       etapa: etapa
    }
   let result = await queryOracle(sqlOracle.selectTarasOP, binds);
   return result
}

router.get('/gerarRelProducaoOP', async function(req, res) {
    const {op, etapa} = req.query;
    let connection;
    let producaoOP;
    let entregasOP;
    let tarasOP;

    try {
        connection = await connectionOracle();
        producaoOP = await selecProdProgOP(op,etapa);
        entregasOP = await selectEntregasOP(op);
        tarasOP = await selectTarasOP(op, etapa);
        await connection.close()
    
        if (producaoOP.length > 0 || !producaoOP) {
            //res.status(200).json(result)
            res.render('produzidoOP', {producao: producaoOP, entregasOP:entregasOP, tarasOP:tarasOP})
        } else {
            //res.status(404).json({ mensagem: 'Dados não encontrados'})
            res.render('errorPage', {msg:"OP SEM Produção Encontrada !"})
        }
        
    } catch (error) {
        console.log('Erro ao gerar Relatório de OP', error);
        res.status(500).send('Erro ao gerar Relatório de OP');
    }
})

app.use('/', router);
app.use('/scripts', express.static(__dirname+'/scripts'))
app.use('/styles', express.static(__dirname+'/styles'))



/*const server = app.listen(8000, function () {
    console.log("\nCIM Rodando na Porta 8000 \\o/")
    process.send('ready');
})*/

const pathSSL = '/etc/letsencrypt/live/cim.bazei.com.br/';
const options = {
    key: fs.readFileSync(path.join(pathSSL, 'privkey.pem')),
    cert: fs.readFileSync(path.join(pathSSL,'fullchain.pem'))
}

https.createServer(options, app).listen(8000, () =>{
    console.log("\nCIM Rodando na Porta 8000 \\o/")
    process.send('ready');
})


process.on('message', function(msg) {
    if (msg == 'shutdown') {
      console.log('Fechando todas as conexões...' + showDate())
        server.close()
        console.log('HTTP Server Fechado' + showDate())
        const db = require("./db");
        db.connectionClose()
        console.log('Banco desconectado' + showDate())
        
      setTimeout(function() {
        console.log('Finalizando o PM2' + showDate())
        process.exit(0)
      }, 1500)
    }
  })
