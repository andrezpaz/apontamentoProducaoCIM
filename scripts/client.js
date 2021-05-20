
const button = document.getElementById('myButton');
button.addEventListener('click', function(e) {
  console.log('button was clicked');
});


function dateFormat(typeDate) {

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
    return new Date().toLocaleDateString('pt-BR', options)
    if (typeDate === "mysql") {
        var tzoffset = (new Date()).getTimezoneOffset() * 60000;
        var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 19).replace('T', ' ')
        return localISOTime;
    }
    //return moment().format('D/MM/YYYY, hh:mm')
}
function insertOP() {
    let idinputOP = document.getElementById("inputOP").value;
    console.log(idinputOP);
    if (idinputOP) {
        console.log(idinputOP);
        //document.getElementById("inputOP").value = "TESTE";
        document.getElementById("inputOP").style.color = "green"
        document.getElementById("selectMaquina").style.color = "green"
        document.getElementById("inputOP").readOnly = true;
        document.getElementById("selectMaquina").readOnly = true;
    }
}
function resetButton() {
    console.log("Clear");
    document.getElementById("valueStart").innerHTML = null;
    document.getElementById("valueStop").innerHTML = null;
    document.getElementsByName("valueStart")[0].value = null;
    document.getElementsByName("valueStop")[0].value = null;
    document.getElementById("inputOP").value = null;
    document.getElementById("inputQuantidade").value = null;
    document.getElementById("inputOP").readOnly = false;
    document.getElementById("inputOP").style.color = "white";
    document.getElementById("selectMaquina").style.color = "white";

}
function checkInput(id) {
    let valueInput = document.getElementById(id);
    console.log(valueInput.innerHTML);
    if ((valueInput.innerHTML) || (valueInput.value) && (valueInput.readOnly)) return true;
    else return false;
}
function insertDate(id) {
    let idvaluestart = document.getElementById(id);
    let namevaluestart = document.getElementsByName(id)[0];
    console.log(namevaluestart);
    if ((checkInput('valueStart')) && (id === 'valueStop') || ((id ==='valueStart') && checkInput('inputOP')) ) {
        if ( (!idvaluestart.innerHTML)) {
            idvaluestart.innerHTML = dateFormat("custom");
            namevaluestart.value = dateFormat("mysql"); // input para inserir data em formato original/ para inserir no banco              
        } 
    }
}
function inserAllData() {
    const userRequest = new XMLHttpRequest();
    userRequest.open('post', '/insert', true);
    userRequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    userRequest.send(JSON.stringify({'op':document.getElementById("inputOP").value,
                                     'maquina':document.getElementById("selectMaquina").value, 
                                     'datainicio':document.getElementsByName("valueStart")[0].value,
                                     'datafim':document.getElementsByName("valueStop")[0].value,
                                     'quantidade':document.getElementById("inputQuantidade").value}));

    console.log(document.getElementById("valueStart").innerHTML);
    console.log(document.getElementById("valueStop").innerHTML); 
    console.log(document.getElementById("inputOP").value);
    console.log(document.getElementById("inputQuantidade").value);  
}