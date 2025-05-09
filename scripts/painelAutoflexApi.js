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
        const iconEngrenagen = `<svg id="engrenagemVelocidade" class="gear imgVelocidade" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <!-- SVG da engrenagem -->
                                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.42 1.24 1.02 1.48.2.09.41.14.63.14H21a2 2 0 1 1 0 4h-.09c-.66 0-1.24.42-1.48 1.02z"/>
                                </svg>`
      
        function calcularDuracaoRotacao(velocidade) {
          const minSpeed = 0;
          const maxSpeed = 500;
          const minDuration = 0.2;
          const maxDuration = 3;
          const clampedVel = Math.max(minSpeed, Math.min(maxSpeed, velocidade));
          const proporcao = clampedVel / maxSpeed;
          const duracao = maxDuration - proporcao * (maxDuration - minDuration);
          return duracao.toFixed(2); // segundos
        }
                                
        function renderizar(maquina) {
          let velocidadeConvertida = maquina.productionSpeed.toFixed(0)
          const id = maquina.id;
          let msgVelocidade = '';
          let idElementTitleMetturno = document.getElementById('titleMetragemTurno')
          if (tipo_recurso === '02') {
            velocidadeConvertida = (velocidadeConvertida / 60).toFixed(0);
          }

          // Ajusta a velocidade de rotação da engrenagem
          let tempoAnimacao = calcularDuracaoRotacao(velocidadeConvertida); // tempo em segundos
          if (velocidadeConvertida <= 0) tempoAnimacao = 1000 // caso for abaixo de zero, deixa a roda parada
          setTimeout(() => {
            const engrenagem = document.getElementById("engrenagemVelocidade");
            if (engrenagem) {
              engrenagem.style.animationDuration = `${tempoAnimacao}s`;
            }
          }, 50); // pequeno delay para garantir que o DOM foi renderizado

          if (maquina.state === 'PRODUCING' && recurso) {
            //msgVelocidade = `<h2><img src="/images/iconVelocidade.png" class="imgVelocidade"> ${velocidadeConvertida ?? '---'}</h2>`
            msgVelocidade = `<div class="velocidade-container">
                             <img src="/images/iconVelocidade.png" class="imgVelocidade">
                             <span>${velocidadeConvertida ?? '---'}</span>${iconEngrenagen}</div>`;
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