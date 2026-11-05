(function () {
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTERVALO = 3200;

  function criarAnimacao(caixa, nome, repetir) {
    if (!window.lottie || semMovimento) return null;
    var alvo = document.createElement('div');
    caixa.appendChild(alvo);
    var animacao = window.lottie.loadAnimation({
      container: alvo,
      renderer: 'svg',
      loop: repetir,
      autoplay: true,
      path: 'assets/anim/' + nome + '.json',
    });
    animacao.addEventListener('DOMLoaded', function () {
      var imagem = caixa.querySelector('img');
      if (imagem) imagem.style.visibility = 'hidden';
    });
    return { alvo: alvo, animacao: animacao };
  }

  // Jornada do pedido: cada passo troca a expressão do personagem.
  var caixa = document.getElementById('personagem');
  var chip = document.getElementById('chip');
  var passos = Array.prototype.slice.call(document.querySelectorAll('.passo'));
  var atual = -1;
  var atualAnimacao = null;
  var relogio = null;

  function mostrar(indice) {
    if (indice === atual) return;
    atual = indice;
    passos.forEach(function (passo, i) {
      passo.classList.toggle('is-feito', i < indice);
      passo.classList.toggle('is-agora', i === indice);
      passo.setAttribute('aria-current', i === indice ? 'step' : 'false');
    });
    var passo = passos[indice];
    chip.textContent = passo.dataset.chip;
    chip.classList.toggle('chip--liberado', indice === passos.length - 1);

    var nova = criarAnimacao(caixa, passo.dataset.animacao, indice !== passos.length - 1);
    if (nova) {
      var anterior = atualAnimacao;
      atualAnimacao = nova;
      if (anterior) {
        anterior.animacao.destroy();
        anterior.alvo.remove();
      }
    }
  }

  function parar() {
    clearInterval(relogio);
    relogio = null;
  }

  function tocar() {
    if (relogio || semMovimento) return;
    relogio = setInterval(function () {
      mostrar((atual + 1) % passos.length);
    }, INTERVALO);
  }

  var escolheu = false;
  passos.forEach(function (passo, i) {
    passo.addEventListener('click', function () {
      escolheu = true;
      parar();
      mostrar(i);
    });
  });

  mostrar(0);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (escolheu) return;
          if (entrada.isIntersecting) tocar();
          else parar();
        });
      },
      { threshold: 0.35 },
    ).observe(document.querySelector('.demo'));

    // O "olá" do final só toca quando aparece.
    var ola = document.getElementById('personagem-ola');
    var observador = new IntersectionObserver(
      function (entradas) {
        if (!entradas[0].isIntersecting) return;
        observador.disconnect();
        criarAnimacao(ola, 'ola', true);
      },
      { threshold: 0.4 },
    );
    observador.observe(ola);
  }

  // Formulário de contato: a mensagem vai pelo Web3Forms até o e-mail do fundador.
  var contato = document.getElementById('contato');
  var aviso = document.getElementById('contato-aviso');
  var secaoAcesso = document.getElementById('acesso');
  var botaoEnviar = contato.querySelector('button');
  var ERRO_ENVIO = 'We couldn\'t send your message. Try again, or email us at <a href="mailto:matheus@siavopay.com">matheus@siavopay.com</a>.';

  function avisar(tipo, html) {
    aviso.className = 'contato__aviso contato__aviso--' + tipo;
    aviso.innerHTML = html;
    aviso.hidden = false;
    aviso.scrollIntoView({ block: 'nearest', behavior: semMovimento ? 'auto' : 'smooth' });
    // O manual não deixa o personagem ao lado de uma mensagem de erro.
    secaoAcesso.classList.toggle('tem-erro', tipo === 'erro');
  }

  contato.addEventListener('submit', function (evento) {
    evento.preventDefault();
    var dados = Object.fromEntries(new FormData(contato));
    botaoEnviar.disabled = true;
    botaoEnviar.textContent = 'Sending...';
    aviso.hidden = true;

    fetch(contato.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(dados),
    })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('Envio recusado');
        contato.reset();
        avisar('ok', 'Thanks. We got your message and we\'ll reply to your email soon.');
      })
      .catch(function () {
        avisar('erro', ERRO_ENVIO);
      })
      .finally(function () {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = 'Send message';
      });
  });
})();
