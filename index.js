// https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const router = express.Router();
const alert = require('alert');
const { render } = require('ejs');
var functions = require('./scripts/client');

app.use(bodyParser.urlencoded({ extended: false }));


function showDate() {
    return " - Data: " + new Date()
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
                //response.send(console.log(ress));
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
        //console.log(testResult)
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


function queryOP(buscaOP) {
    return (async () => {
        const db = require("./db");
        //const op = req.params.op;
        console.log('\nBuscando OP : ' + buscaOP + showDate());
        const producao = await db.selectProducao(buscaOP)
        console.log(producao)
        return producao; 
    })
    ();
}

app.post("/apont", (req, res) => {
    const buscaOP = req.body;
    //console.log(req.body)
    queryOP(buscaOP.op).then(function (result){
    if (result.length > 0){
        console.log("\nApontamento Encontrado" + showDate());
        console.log(result);
        res.render('apontamento', {producao:result, functions:functions})
    } else {
        console.log("\nSem Dados Encontrados")
        console.log("Iniciando com novo apontamento")
        let producao = [{op:buscaOP.op, maquina:'', datainicio: '', datafim: '', quantidade:''}]; // define o array para quando carregar a primeira vez
        res.render('apontamento', {producao: producao, functions:functions})
    }
    });
})

/*
app.route('/apontamento')
.post(jsonParser,(req, res) => getOP(req, res))
.get((req,res) => {
    res.render('apontamento', {producao:result})
})

getOP = (req, res) => {
    let buscaOP = req.body;
    queryOP(buscaOP).then(function (result){
    res.render('apontamento', {producao:result})
})
}
*/

/*router.post('/buscaop', jsonParser, function (req, res) {
    let buscaOP = req.body;
    queryOP(buscaOP).then(function (result){
        res.render('apontamento', {producao:result})
        //router.get('/opatual', function(req, res) {
        //    res.render('apontamento', {producao:result})  
        //})
        
    });
})*/

router.get('/maquinas', function(req,res) {
    res.sendFile(path.join(__dirname+'/maquinas.html') )
})
router.get('/maquinas/:recurso', function(req, res) {
    //res.send('Hello World');
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectMaquina(recurso);
        console.log("Iniciando busca de apontamentos do recurso : " + maquina[0].maquina + showDate());
        //console.log(maquina);
        res.render('maquinas', {maquina: maquina})
        //res.send(maquina)
    })();
 
})

router.get('/defultIframe', function (req, res) {
    res.sendFile(path.join(__dirname+'/defaultIfrme.html'))
    //res.send("Sem Apontamento")
})

router.get('/fila/:recurso', function(req, res) {
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectFila(recurso);
        const tipo_imagem = await db.selectTipoImagem(recurso);
        let novafila = maquina.reduce((acumula, element) =>{
            let tipo_imagem_item = tipo_imagem.filter(item => item.codigo_item === element.codigo_item )
            acumula.push({'op':element.op,
                          'recurso': element.recurso,
                          'seq_fila': element.seq_fila,
                          'nomecliente': element.nomecliente,
                          'descricao_item': element.descricao_item,
                          'cod_clicheria': element.cod_clicheria,
                          'codigo_item': element.codigo_item,
                          'tem_perfil': element.tem_perfil,
                          'TIPO_IMAGEM':tipo_imagem_item})
        return acumula
        },[]);
        console.log("\nIniciando Busca da Fila Recurso : " + recurso + showDate());
        console.log(novafila);
        res.render('fila', {maquina: novafila})
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

app.use('/', router);
app.use('/scripts', express.static(__dirname+'/scripts'))
app.use('/styles', express.static(__dirname+'/styles'))



app.listen(8000, function () {
    console.log("CIM Rodando na Porta 8000 \\o/")
})