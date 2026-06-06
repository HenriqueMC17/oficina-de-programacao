"use strict";

class RockPaperScissorsGame {
  constructor() {
    this.jogador = { nome: "Jogador" };
    this.rodadas = [];
    this.choices = ["pedra", "papel", "tesoura"];
  }

  init() {
    this.jogador.nome = this.obterNomeJogador();
    let continuar = true;
    while (continuar) {
      this.playRound();
      continuar = confirm("Deseja continuar?");
    }
    this.gerarTabela();
  }

  playRound() {
    const escolhaJogador = this.obterEscolhaJogador();
    if (!escolhaJogador) return; // cancelled
    const escolhaComputador = this.obterEscolhaComputador();
    const resultado = this.determinarVencedor(escolhaJogador, escolhaComputador);
    this.atualizarRodadas(escolhaJogador, escolhaComputador, resultado);
  }

  obterNomeJogador() {
    const nome = prompt("Digite seu nome:");
    return nome ? nome.trim() : "Jogador";
  }

  obterEscolhaJogador() {
    let escolha = prompt(`Olá, ${this.jogador.nome}! Escolha pedra, papel ou tesoura:`);
    if (!escolha) return null;
    escolha = escolha.toLowerCase().trim();
    while (!this.choices.includes(escolha)) {
      escolha = prompt("Escolha inválida. Por favor, digite pedra, papel ou tesoura:");
      if (!escolha) return null;
      escolha = escolha.toLowerCase().trim();
    }
    return escolha;
  }

  obterEscolhaComputador() {
    const escolhaAleatoria = Math.floor(Math.random() * this.choices.length);
    return this.choices[escolhaAleatoria];
  }

  determinarVencedor(escolhaJogador, escolhaComputador) {
    if (escolhaJogador === escolhaComputador) return "Empate";

    if (
      (escolhaJogador === "pedra" && escolhaComputador === "tesoura") ||
      (escolhaJogador === "papel" && escolhaComputador === "pedra") ||
      (escolhaJogador === "tesoura" && escolhaComputador === "papel")
    ) {
      return this.jogador.nome;
    }
    return "Computador";
  }

  atualizarRodadas(escolhaJogador, escolhaComputador, resultado) {
    this.rodadas.push({ jogador: escolhaJogador, computador: escolhaComputador, resultado: resultado });
  }

  gerarTabela() {
    const tableContainer = document.getElementById("tabela");
    if (!tableContainer) return;

    let tabelaHTML = `<table border="1">`;
    tabelaHTML += `<tr><th>${this.jogador.nome}</th><th>Computador</th><th>Resultado</th></tr>`;

    this.rodadas.forEach((rodada) => {
      tabelaHTML += `<tr><td>${rodada.jogador}</td><td>${rodada.computador}</td><td>${rodada.resultado}</td></tr>`;
    });
    tabelaHTML += `</table>`;
    tableContainer.innerHTML = tabelaHTML;
  }

  reiniciarJogo() {
    this.rodadas = [];
    this.gerarTabela();
    this.init();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new RockPaperScissorsGame();

  const playAgainBtn = document.getElementById("jogarNovamente");
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => game.reiniciarJogo());
  }

  // Delay start slightly to allow rendering
  setTimeout(() => game.init(), 100);
});