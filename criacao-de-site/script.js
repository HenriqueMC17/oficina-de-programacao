"use strict";

(function () {
    const meuBotao = document.getElementById("meuBotao");

    if (meuBotao) {
        meuBotao.addEventListener("click", function () {
            alert("Você clicou no botão? Não tem medo do perigo?");
        });
    }
})();