"use strict";

(function () {
  const numeroStr = prompt("Digite um número para ver a tabuada:");
  const numero = parseInt(numeroStr, 10);

  if (!isNaN(numero)) {
    console.log(`Tabuada do ${numero}:`);
    for (let i = 1; i <= 10; i++) {
      let resultado = numero * i;
      console.log(`${numero} x ${i} = ${resultado}`);
    }
  } else {
    console.log("Por favor, insira um número válido para ver a tabuada.");
  }
})();