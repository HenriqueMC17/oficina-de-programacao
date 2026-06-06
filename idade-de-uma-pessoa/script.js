"use strict";

(function () {
    // Solicita ao usuário que insira a idade
    let idadeStr = prompt("Digite sua idade:");

    // Converte a entrada do usuário (que é uma string) para um número inteiro
    let idade = parseInt(idadeStr, 10);

    // Verifica se a idade é válida (maior ou igual a zero)
    if (!isNaN(idade) && idade >= 0) {
        // Verifica se o usuário é maior de idade (18 anos ou mais)
        if (idade >= 18) {
            alert("Você é maior de idade.");
        } else {
            alert("Você é menor de idade.");
        }
    } else {
        alert("Por favor, insira uma idade válida");
    }
})();