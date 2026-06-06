"use strict";

class Calculator {
  constructor(displayElement) {
    this.display = displayElement;
  }

  evaluateExpression(expression) {
    // Basic sanitization allowing only numbers and simple operators
    const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
    if (!sanitized) return '';

    try {
      // Safe alternative to eval for simple math via Function
      return new Function(`return ${sanitized}`)();
    } catch {
      return 'Error';
    }
  }

  handleInput(buttonText) {
    if (buttonText === 'X') {
      this.display.value = 'INCOGNITA';
    } else if (buttonText === '=') {
      const result = this.evaluateExpression(this.display.value);
      this.display.value = result;
    } else if (buttonText === 'C') {
      this.display.value = '';
    } else {
      this.display.value += buttonText;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('button');

  if (display) {
    const calculator = new Calculator(display);

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        calculator.handleInput(button.textContent);
      });
    });
  }
});