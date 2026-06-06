"use strict";

(function () {
    let num1 = parseFloat(prompt("Digite um primeiro número:"));
    let num2 = parseFloat(prompt("Digite um segundo número:"));

    function encontrarMaior(a, b) {
        if (isNaN(a) || isNaN(b)) {
            console.log("Valores inválidos");
            return null;
        }
        if (a > b) {
            console.log(a);
            return a;
        } else {
            console.log(b);
            return b;
        }
    }

    encontrarMaior(num1, num2);

    // Exposing globally if needed by the HTML
    window.encontrarMaior = encontrarMaior;
})();