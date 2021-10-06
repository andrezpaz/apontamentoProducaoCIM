
/*window.onload = function(){
    //$('#iframeApontamentos').contents().find('#buttonMaquinasBack').hide(); 
    console.log("CARRE")
}
/*$(document).ready(function(){
    console.log("Carregando")
    $('#iframeApontamentos').contents().find('#buttonMaquinasBack').hide();
})*/
/*$('#iframeApontamentos').load(function(){
    $('#iframeApontamentos').contents().find('#buttonMaquinasBack').hide();
});*/

function onLoadFunction() { // oculta botao de voltar o iframe
    //hideButtonIframe();
    //changeMaquina();
}

function hideButtonIframe(iframe) {
    console.log(iframe.contentWindow.document)
    let buttonBack = iframe.contentWindow.document.getElementById("buttonMaquinasBack");
    buttonBack.style.display = "none";
}


function dateFormat(typeDate, date) {
//console.log(typeDate)
//console.log(date)
    /*var data = new Date(),
    dia  = data.getDate().toString().padStart(2, '0'),
    mes  = (data.getMonth()+1).toString().padStart(2, '0'), //+1 pois no getMonth Janeiro começa com zero.
    ano  = data.getFullYear(),
    hora = data.getHours(),
    min  = data.getMinutes().toString().padStart(2,'0');
    return dia+"/"+mes+"/"+ano+" "+hora+":"+min;*/
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: "America/Sao_Paulo"
    }
    if (typeDate === "custom")
    return new Date(date).toLocaleDateString('pt-BR', options)
    if (typeDate === "mysql") { 
        var tzoffset = new Date().getTimezoneOffset() * 60000;
        var localISOTime = new Date((new Date(date).getTime() - tzoffset)).toISOString().slice(0, 19).replace('T', ' ')
        //var localISOTime = new Date(date).toISOString({timeZone:"America/Sao_Paulo"}).slice(0, 19).replace('T', ' ');
        //console.log(localISOTime)
        return localISOTime;
    }
    //return moment().format('D/MM/YYYY, hh:mm')
}

/*function insertOP() {
        let idinputOP = document.getElementById("inputOP");
        let idButtonOP = document.getElementById("buttonOP");
        function changeInput (event) {
            console.log(event);
        if (event.code === 'Enter') {
            console.log("ENTER REALIZD")
                if (idinputOP.value) {
                //document.getElementById("inputOP").value = "TESTE";
                document.getElementById("inputOP").style.color = "green"
                //document.getElementById("selectMaquina").style.color = "green"
                document.getElementById("inputOP").readOnly = true;
                //document.getElementById("selectMaquina").readOnly = true;
                //findOP(idinputOP.value);
                }
            }
        }

        idinputOP.addEventListener('keyup', function(event){
            changeInput(event)
        })
        idButtonOP.addEventListener('click', function(event){
            changeInput(event)
        })
} */

function findOP(numeroOP) {
    //let numeroOP = document.getElementById("inputOP").value;
    const userRequest = new XMLHttpRequest();
        userRequest.open('post', '/apont', true);
        userRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
        userRequest.send(JSON.stringify({'op':numeroOP}));
        //parent.document.getElementById("iframeApontamentosAtual").src = "/opatual";
        //setTimeout(function(){
        //    parent.document.getElementById("iframeApontamentosAtual").src = "/buscaop";
        //}, 1000)
        
}


var GlobalMaquinaSelecionada;
function GetMaqSelecGlobal(maq) {
    console.log(maq);
    GlobalMaquinaSelecionada = maq;
    return GlobalMaquinaSelecionada;
}
function changeMaquina() {
    console.log("Maquina Selecionada")
    let  maquinaSelected = document.getElementById("selectMaquina").value;
    let iframeUltimosApontamento = parent.document.getElementById("iframeUltimosApontamentos");
    //parent.document.getElementById("GlobalMaqSelecionada").innerHTML = maquinaSelected;
    GetMaqSelecGlobal(maquinaSelected);
    if (maquinaSelected === "Selecione")
    iframeUltimosApontamento.src = "/defultIframe"
    else {  
    iframeUltimosApontamento.src = `maquinas/${maquinaSelected}`
    hideButtonIframe(iframeUltimosApontamento);
    }
}
//window.onload = changeMaquina();

function resetButton(askUpdateOrInsert) {
    console.log(askUpdateOrInsert);
    let iframeApontamentosAtual = parent.document.getElementById("iframeApontamentosAtual").contentWindow;
    if (askUpdateOrInsert) { // usado quando encontado apontamento ja existe e usuario selecionar insert, deixa apenas a op e maquina digitada
        CleanAfterInsertUpdate()
    }
    else {
        console.log("Clean Geral")
        CleanAfterInsertUpdate();
        iframeApontamentosAtual.document.getElementById("inputOP").value = null;
        iframeApontamentosAtual.document.getElementById("inputOP").readOnly = false;
        iframeApontamentosAtual.document.getElementById("inputOP").style.color = "white";
        iframeApontamentosAtual.document.getElementById("selectMaquina").style.color = "white";
}

}
function CleanAfterInsertUpdate() {
    let iframeApontamentosAtual = parent.document.getElementById("iframeApontamentosAtual").contentWindow;
    console.log("Clear After Insert");
    iframeApontamentosAtual.document.getElementById("valueStart").innerHTML = null;
    iframeApontamentosAtual.document.getElementById("valueStop").innerHTML = null;
    iframeApontamentosAtual.document.getElementsByName("valueStart")[0].value = null;
    iframeApontamentosAtual.document.getElementsByName("valueStop")[0].value = null;
    iframeApontamentosAtual.document.getElementById("inputQuantidade").value = null;
    iframeApontamentosAtual.document.getElementById("idUpdate").value = null;
}

function checkInput(id) {
    let valueInput = document.getElementById(id);
    if ((valueInput.innerHTML) || (valueInput.value) && (valueInput.readOnly)) return true;
    else return false;
}
function buttonPress(element){
    console.log(element);
}

function insertDate(id) {
    let idvaluestart = document.getElementById(id);
    let namevaluestart = document.getElementsByName(id)[0];
    let idSelectMaquina = document.getElementById("selectMaquina").value;
    console.log(namevaluestart)
    console.log(idSelectMaquina)
    if  (idSelectMaquina === "Selecione") idSelectMaquina = false;
    if ((checkInput('valueStart')) && (id === 'valueStop') || ((id ==='valueStart') && checkInput('inputOP') && (idSelectMaquina)) ) {
        if ( (!idvaluestart.innerHTML)) {
            idvaluestart.innerHTML = dateFormat("custom", new Date());
            namevaluestart.value = dateFormat("mysql", new Date()); // input para inserir data em formato original/ para inserir no banco              
        }       
    }
    else window.alert("Você precisa Digitar a OP, Maquina e Pressionar OK")
}
function XMLupdateProducao(id, maquina, inicio, fim, quantidade) {
    return new Promise(resolve => {
    const userRequest = new XMLHttpRequest();
          userRequest.open('post', '/updateProducao', true);
          userRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
          userRequest.send(JSON.stringify({'maquina': maquina,
                                    'datainicio': inicio,
                                    'datafim': fim,
                                    'quantidade': quantidade,
                                    'id':id}));
        setTimeout(() => {
        resolve("Resolvido")
            },1500);
    })
}
function XMLInsertProducao (op,maquina, inicio, fim, quantidade) {
    return new Promise(resolve => {
        // PROBLEMA ESTA AQUI E NO UPDATE, SEMPRE QUNADO RESTART O PM2, ELE EXECUTA ESSA PROMISSE
        // TESTAR SE EXECUTANDO NO NODE DIRETO, PROBLEMA ACONTECE
    const userRequest = new XMLHttpRequest();
          userRequest.timeout = 2000;
          userRequest.open('post', '/insert', true);
          userRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
          userRequest.send(JSON.stringify({'op':op,
                                        'maquina':maquina, 
                                        'datainicio':inicio,
                                        'datafim':fim,
                                        'quantidade':quantidade}));
        setTimeout(() => {
           resolve ("Resolvido")
            },1500);
        })
}

function msgSendUpdate() {
    CleanAfterInsertUpdate(); // reseta inputs
    document.getElementById("msgSend").style.display = "block"; // exibe mensagem de sucesso
    setTimeout(function() {
            document.getElementById("msgSend").style.display = "none"; 
        }, 3500)
    parent.document.getElementById("iframeUltimosApontamentos").contentWindow.location.reload(true)// atualiza iframe de ultimos apontamentos
        
}
function inserAllData() {
    let iframeApontamentosAtual = parent.document.getElementById("iframeApontamentosAtual").contentWindow;
    let op = iframeApontamentosAtual.document.getElementById("inputOP").value;
    let maquina = iframeApontamentosAtual.document.getElementById("selectMaquina").value;
    let inicio = iframeApontamentosAtual.document.getElementsByName("valueStart")[0].value;
    let fim = iframeApontamentosAtual.document.getElementsByName("valueStop")[0].value;
    let quantidade = iframeApontamentosAtual.document.getElementById("inputQuantidade").value;
    if (quantidade === '') quantidade = null;
    if (maquina === "Selecione") maquina = null;
    if (fim === '') fim = null;
    let idUpdate = iframeApontamentosAtual.document.getElementById("idUpdate").value;
    //console.log(quantidade);

    if ((op) && (inicio) && (maquina)) {
        iframeApontamentosAtual.document.getElementById("buttonOP").disabled = true; // desabilitar pra evitar uma busca logo em seguida após um insert
        document.getElementById("sendData").disabled = true;
        if(idUpdate) { // se for update
            console.log("Realizando Update "+ idUpdate);
            XMLupdateProducao(idUpdate, maquina, inicio, fim, quantidade).then((result) =>{
            //let result = await updateProducao(idUpdate, maquina, inicio, fim, quantidade) // para fins de estuo, de como usar com await a funcao async
                console.log(result)
                msgSendUpdate()
                document.getElementById("sendData").disabled = false;
                iframeApontamentosAtual.document.getElementById("buttonOP").disabled = false; 
            })
        } else {
            console.log("Realizando Insert")
            console.log(idUpdate);
            console.log("OP: " + op + " Rec: " + maquina + " INICIO : " + inicio + " FIM: " + fim + " Quanti: " + quantidade)
            XMLInsertProducao(op,maquina, inicio, fim, quantidade).then((result) => {
                console.log(result)
                msgSendUpdate()
                document.getElementById("sendData").disabled = false;
                iframeApontamentosAtual.document.getElementById("buttonOP").disabled = false;
            })
        }
    } 
    else {
        window.alert("Voce Precisa preencher todos os dados")
    }

// para tratar as respostas do post, tentar isso:
//https://blog.rocketseat.com.br/axios-um-cliente-http-full-stack/

}



function askUserUpdateOrInsert(){
    console.log("EXECC")
    if ( document.getElementById("idUpdate").value && document.getElementById("valueStart").innerHTML && !document.getElementById("valueStop").innerHTML) {
        console.log("Apontamento sem preenchimento encontrado")
        //functionJS();
        //if(!(window.confirm("Apontamento encontrado nessa OP, Continuar com o último apontamento ?"))) {
        //    resetButton(true) 
        //}
    } 
    else { // caso for novo apontamento ou inicio e fim estiverem preenchidos, limpa dados para nova insercao
        resetButton(true) 
    }
}

function onLoadApontamentos() { // para ser usado no ejs de apontamento, carregando funcoes apos carregar a pagina
    
    askUserUpdateOrInsert();
    changeMaquina();
}

module.exports = {dateFormat: dateFormat, changeMaquina:changeMaquina, onLoadApontamentos:onLoadApontamentos, GetMaqSelecGlobal:GetMaqSelecGlobal}; // para ser usado no render ejs
