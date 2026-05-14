function iniciarContato() {
  const form = document.querySelector("#contato-form");
  const retorno = document.querySelector("#contato-retorno");
  if (!form || !retorno) return;

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const botao = form.querySelector('button[type="submit"]');
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Enviando...";
    }

    try {
      const dados = new URLSearchParams(new FormData(form));
      const resposta = await fetch("/", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: dados.toString()
      });

      if (!resposta.ok) throw new Error(`Envio retornou ${resposta.status}`);

      form.hidden = true;
      retorno.hidden = false;
      retorno.textContent = "Obrigado pelo envio!";
    } catch (erro) {
      retorno.hidden = false;
      retorno.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
      if (botao) {
        botao.disabled = false;
        botao.textContent = "Enviar";
      }
    }
  });
}

iniciarContato();
