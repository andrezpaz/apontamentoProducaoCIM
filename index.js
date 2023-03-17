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

app.use(bodyParser.urlencoded({ extended: false }));


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
    console.log(dataProducao);
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
    console.log(updateOPMaquina);
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
    console.log(updateProd);
    ( async () => {
        const db = require("./db");
        const result = await db.updateProducao({maquina:updateProd.maquina, datainicio: updateProd.datainicio, datafim: updateProd.datafim, 
                                                quantidade: updateProd.quantidade, id:updateProd.id});
        console.log(result);
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
        console.log(result);
    })();
})


function queryOP(buscaOP, recurso) {
    return (async () => {
        const db = require("./db");
        //const op = req.params.op;
        console.log('\nBuscando OP : ' + buscaOP + showDate());
        const producao = await db.selectProducao(buscaOP, recurso)
        console.log(producao)
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
            console.log(result);
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

router.get('/fila/:recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectFila(recurso);
        const tipo_imagem = await db.selectTipoImagem(recurso);
        const mrpList = await db.selectOPsMrp(recurso);
        let codigo_cor_mrp;
        let novafila = maquina.reduce((acumula, element) =>{
            let tipo_imagem_item = tipo_imagem.filter(item => item.codigo_item === element.codigo_item )
            let cor_mrp = mrpList.find(mrp => mrp.mrp === element.mrp)
            if (cor_mrp) codigo_cor_mrp = cor_mrp.codigo_cor 
            else codigo_cor_mrp = null;
            acumula.push({'op':element.op,
                          'recurso': element.recurso,
                          'seq_fila': element.seq_fila,
                          'inicioprog':element.inicioprog,
                          'fimprog': element.fimprog, 
                          'peso': element.peso,
                          'quantidade': element.quantidade,
                          'nomecliente': element.nomecliente,
                          'descricao_item': element.descricao_item,
                          'cod_clicheria': element.cod_clicheria,
                          'codigo_item': element.codigo_item,
                          'tem_perfil': element.tem_perfil,
                          'codigo_cor_mrp': codigo_cor_mrp,
                          'TIPO_IMAGEM':tipo_imagem_item})
        return acumula
        },[]);
        console.log("\nIniciando Busca da Fila Recurso : " + recurso + showDate());
        console.log(novafila);
        res.render('fila', {maquina: novafila, functions:functions})
    })();
 
})
router.get('/perfilcores/:item', function(req, res) {
    (async () => {
        const db = require("./db");
        const codigo_item = req.params.item;
        const perfilcores = await db.selectPerfilCores(codigo_item);
        console.log("\nIniciando busca do perfil do item : " + codigo_item + showDate())
        console.log(perfilcores);
        res.render('perfilcores', {perfilcores: perfilcores})
    })();
})


const auth = require('./auth');
const e = require('express');


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

app.use('/', router);
app.use('/scripts', express.static(__dirname+'/scripts'))
app.use('/styles', express.static(__dirname+'/styles'))



const server = app.listen(8000, function () {
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
