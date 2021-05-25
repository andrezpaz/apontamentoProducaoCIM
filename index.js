// https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const router = express.Router();
const alert = require('alert');



//import moment from 'moment';

//const database = require("./db");

// create application/json parser
var jsonParser = bodyParser.json();

// Definie View Padrao
app.set('views', './views');
app.set('view engine', 'ejs');

    

(async () => {
    const db = require("./db");
    console.log('Começou!');
    console.log('SELECT * FROM PRODUCAO');
    const clientes = await db.selectProducao();
    console.log(clientes); 
})();

router.get('/', function(req,res) {
    res.sendFile(path.join(__dirname+'/index.html') )
})

// https://stackoverflow.com/questions/53918363/insert-into-mysql-table-from-html-simple-form-using-node-js-and-javascript/53919762

app.post('/insert', jsonParser, function(request, response) {

    console.log(request.body);
    const dataProducao = request.body
    
    console.log('INSERT INTO CLIENTES');
    ( async () => {
        const db = require("./db");
        const testResult = {op: dataProducao.op, maquina:dataProducao.maquina, datainicio: dataProducao.datainicio, 
            datafim: dataProducao.datafim, quantidade: dataProducao.quantidade}
        console.log(testResult)
        const result = await db.insertProducao({op: dataProducao.op, maquina:dataProducao.maquina, datainicio: dataProducao.datainicio, 
                                                datafim: dataProducao.datafim, quantidade: dataProducao.quantidade})
           .then ((result) => {
                console.log("Sucesso No Insert")
                console.log(result)
            })
            .catch ((error) => {
                console.log("ERRO NO INSERT")
                console.log(error)
            }) 
    }
    )()
    
})

app.post('/update', jsonParser, function(request, response) {

    console.log(request.body);
    const updateProducao = request.body
    
    console.log('UPDATE PRODUCAO');
    ( async () => {
        const db = require("./db");
        const testResult = {marcado: updateProducao.marcado, id:updateProducao.id}
        console.log(testResult)
        const result = await db.updateOPMaquina({marcado: updateProducao.marcado, id:updateProducao.id});
        console.log(result);
    })();
})

//https://stackoverflow.com/questions/26690271/how-to-send-array-values-to-html-pages-in-express-js
//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application-pt

router.get('/maquinas', function(req,res) {
    res.sendFile(path.join(__dirname+'/maquinas.html') )
})
router.get('/maquinas/:recurso', function(req, res) {
    //res.send('Hello World');
    (async () => {
        const db = require("./db");
        const recurso = req.params.recurso;
        const maquina = await db.selectMaquina(recurso);
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