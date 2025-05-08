const socket = io();
        const machineData = {};
        const params = new URLSearchParams(window.location.search);
        let recurso = params.get('recurso');
        let tipo_recurso = params.get('tipo_recurso');
  
        if (recurso) {
          recurso = `1-${recurso}`;
        }
        if (tipo_recurso) {
          if(tipo_recurso === '2') tipo_recurso = '02'
          if(tipo_recurso === '3') tipo_recurso = '05'
          if(tipo_recurso === '4') tipo_recurso = '07'
          if(tipo_recurso === '5') tipo_recurso = '06'
        }
      
        const container = document.getElementById('dados-maquinas');
      
        function renderizar(maquina) {
          let velocidadeConvertida = maquina.productionSpeed.toFixed(0)
          const id = maquina.id;
          let msgVelocidade = '';
          let idElementTitleMetturno = document.getElementById('titleMetragemTurno')
          console.log(tipo_recurso)
          if (tipo_recurso === '02') {
            velocidadeConvertida = (velocidadeConvertida / 60).toFixed(0);
          }
          if (maquina.state === 'PRODUCING' && recurso) {
            //msgVelocidade = `<h2><img src="/images/iconVelocidade.png" class="imgVelocidade"> ${velocidadeConvertida ?? '---'}</h2>`
            msgVelocidade = `<div class="velocidade-container">
                             <img src="/images/iconVelocidade.png" class="imgVelocidade">
                             <span>${velocidadeConvertida ?? '---'}</span></div>`;
            idElementTitleMetturno.style.backgroundColor = '#00ff7f' // verde neon
          } else {
            idElementTitleMetturno.style.backgroundColor = '#ff4d4d' // vermelhor vivo
          }
          const html = `
            <div>
              ${msgVelocidade}
            </div>
          `;
      
          let el = document.getElementById(id);
          if (el) {
            el.innerHTML = html;
          } else {
            el = document.createElement('div');
            el.id = id;
            el.innerHTML = html;
            container.appendChild(el);
          }
        }
      
        // 🔁 Consulta inicial
        fetch('/painelAutoflex/statusAtual')
          .then(res => res.json())
          .then(data => {
            for (const id in data) {
              const m = data[id];
      
              if (recurso && m.machine !== recurso) continue;
              if (tipo_recurso && m.machineTypeSequence !== tipo_recurso) continue;
      
              machineData[id] = m;
              renderizar(m);
            }
          });
      
        // 🔄 Atualizações em tempo real
        socket.on('update', data => {
          if (!data.id) return;
      
          if (recurso && data.machine !== recurso) return;
          if (tipo_recurso && data.machineTypeSequence !== tipo_recurso) return;
      
          machineData[data.id] = {
            ...machineData[data.id],
            ...data
          };
      
          renderizar(machineData[data.id]);
        });