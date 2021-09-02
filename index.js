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
    res.sendFile(path.join(__dirname+'/index.html') )
})

router.get('/apontamento', function(req, res) {
    let producao = [{op:'', maquina:'', datainicio: '', datafim: '', quantidade:''}]; // define o array para quando carregar a primeira vez
    res.render('apontamento', {producao: producao, functions:functions})
    //res.redirect(req.get('apontamento', {producao: producao}))
})

// https://stackoverflow.com/questions/53918363/insert-into-mysql-table-from-html-simple-form-using-node-js-and-javascript/53919762


app.post('/insert', jsonParser, function(request, response) {
    
    console.log(request.body);
    const dataProducao = request.body
    
    console.log('INSERT INTO PRODUCAO');
    ( async () => {
        const db = require("./db");
        const testResult = {op: dataProducao.op, maquina:dataProducao.maquina, datainicio: dataProducao.datainicio, 
            datafim: dataProducao.datafim, quantidade: dataProducao.quantidade}
        console.log(testResult)
        const result = await db.insertProducao({op: dataProducao.op, maquina:dataProducao.maquina, datainicio: dataProducao.datainicio, 
                                                datafim: dataProducao.datafim, quantidade: dataProducao.quantidade})
           .then ((result) => {
                console.log("Sucesso No Insert")
                console.log(result);
                let ress = result[0].insertId.toString();
                console.log(ress);
                //response.send(console.log(ress));
                    setTimeout(function(){
                        const axios = require('axios');
                        var querystring = require('querystring');
                        const data = {
                            
                        };
                        console.log(data);
                        axios.post('http://localhost:8000/apont', querystring.stringify({
                            op: '123'
                    }), {
                        headers: { 
                            "Content-Type": "application/x-www-form-urlencoded"
                          }
                    })
                            .then((res) => {
                                console.log(`Status: ${res.status}`);
                                //console.log('Body: ', res.data);
                                response.send(res.data)
                            }).catch((err) => {
                                console.error(err);
                            });
                        //response.render('apontamento', {producao:prod, functions:functions})
                        
                    },2500)
                //response.send(true);
                //response.sendStatus(status);
                //result[0].insertId
                /*const axios = require('axios');
                const data = {
                    op: 12131
                };
                axios.post('/apont', data)
                .then((res) => {
                    console.log(`Status: ${res.status}`);
                    console.log('Body: ', res.data.op);
                }).catch((err) => {
                    console.error(err);
                });
                //return result[0].insertId;
                /*var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                const userRequest = new XMLHttpRequest();
                userRequest.open('post', '/apont2', true);
                userRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
                userRequest.send(JSON.stringify({'op':12131}));*/
                //res.render('apontamento', {producao:result, functions:functions})

            })
            .catch ((error) => {
                console.log("ERRO NO INSERT")
                console.log(error)
            }) 
    }
    )()
    
})

app.post('/update', jsonParser, function(request, response) {
    const updateOPMaquina = request.body
    console.log('UPDATE OP MAQUINA');
    console.log(updateOPMaquina);
    ( async () => {
        const db = require("./db");
        const testResult = {marcado: updateOPMaquina.marcado, id:updateOPMaquina.id}
        console.log(testResult)
        const result = await db.updateOPMaquina({marcado: updateOPMaquina.marcado, id:updateOPMaquina.id});
        console.log(result);
    })();
})

app.post('/updateProducao', jsonParser, function(request, response) {
    const updateProd = request.body;
    console.log('UPDATE PRODUCAO');
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
    console.log('DELETE PRODUCAO');
    console.log(deleteProd.id);
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
        console.log('Começou!');
        console.log('SELECT * FROM PRODUCAO');
        const producao = await db.selectProducao(buscaOP)
        console.log(producao)
        return producao; 
    })
    ();
}

app.post("/apont", (req, res) => {
    const buscaOP = req.body;
    console.log(req.body)
    queryOP(buscaOP.op).then(function (result){
    if (result.length > 0){
        console.log("Dados Encontrados")
        res.render('apontamento', {producao:result, functions:functions})
    } else {
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
        //console.log(maquina);
        console.log(maquina[0].maquina)
        res.render('maquinas', {maquina: maquina})
        //res.send(maquina)
    })();
 
})

router.get('/defultIframe', function (req, res) {
    res.sendFile(path.join(__dirname+'/defaultIfrme.html'))
    //res.send("Sem Apontamento")
})

app.use('/', router);
app.use('/scripts', express.static(__dirname+'/scripts'))
app.use('/styles', express.static(__dirname+'/styles'))



app.listen(8000, function () {
    console.log('Example app listening on port 8000')
})