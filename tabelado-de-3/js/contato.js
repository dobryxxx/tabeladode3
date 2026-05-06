function iniciarContato() {
  const form = document.querySelector("#contato-form");
  const retorno = document.querySelector("#contato-retorno");
  if (!form || !retorno) return;

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const dados = new URLSearchParams(new FormData(form));
    const resposta = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: dados.toString()
    });

    if (resposta.ok) {
      form.hidden = true;
      retorno.hidden = false;
      retorno.textContent = "Obrigado pelo envio!";
      return;
    }

    retorno.hidden = false;
    retorno.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
  });
}

iniciarContato();
