const display = document.querySelector("#display");
const history = document.querySelector("#history");
const keys = document.querySelector(".keypad");

let expression = "";
let justEvaluated = false;
let hasError = false;

const operatorPattern = /[+\-*/]/;

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid result");
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return String(rounded);
}

function render() {
  display.textContent = expression || "0";
  display.title = display.textContent;
}

function reset() {
  expression = "";
  history.textContent = "";
  justEvaluated = false;
  hasError = false;
  render();
}

function showError() {
  expression = "Error";
  history.textContent = "Invalid calculation";
  hasError = true;
  justEvaluated = false;
  render();
}

function calculate(input) {
  if (!input || !/^[0-9+\-*/.()\s]+$/.test(input)) {
    throw new Error("Invalid expression");
  }

  // Expressions are built only from calculator keys, so Function avoids
  // adding a large parser while still keeping input strictly restricted.
  const normalized = input.replace(/(^|[+\-*/])-(?=\d)/g, "$1 - ");
  const result = Function(`"use strict"; return (${normalized})`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Invalid result");
  }
  return formatNumber(result);
}

function currentNumber() {
  return expression.split(operatorPattern).pop() || "";
}

function addDigit(digit) {
  if (hasError || justEvaluated) {
    expression = "";
    history.textContent = "";
    hasError = false;
    justEvaluated = false;
  }

  if (expression === "0") {
    expression = digit;
  } else {
    expression += digit;
  }
  render();
}

function addDecimal() {
  if (hasError || justEvaluated) {
    expression = "";
    history.textContent = "";
    hasError = false;
    justEvaluated = false;
  }

  if (!currentNumber().includes(".")) {
    expression += currentNumber() ? "." : "0.";
    render();
  }
}

function addOperator(operator) {
  if (hasError) return;
  if (justEvaluated) justEvaluated = false;

  if (!expression && operator === "-") {
    expression = "-";
  } else if (expression && !/[+\-*/.]$/.test(expression)) {
    expression += operator;
  } else if (/[+\-*/]$/.test(expression)) {
    expression = expression.slice(0, -1) + operator;
  }
  render();
}

function toggleSign() {
  if (hasError || !expression) return;
  const match = expression.match(/(\d*\.?\d+)$/);
  if (!match) return;

  let start = match.index;
  if (start > 0 && expression[start - 1] === "-" &&
      (start === 1 || /[+*/]/.test(expression[start - 2]))) {
    start -= 1;
  }

  const value = expression.slice(start);
  const signed = value.startsWith("-") ? value.slice(1) : `-${value}`;
  expression = expression.slice(0, start) + signed;
  render();
}

function percent() {
  if (hasError || !currentNumber()) return;
  const value = Number(currentNumber()) / 100;
  if (!Number.isFinite(value)) return;
  expression = expression.slice(0, -currentNumber().length) + formatNumber(value);
  render();
}

function backspace() {
  if (hasError || justEvaluated) {
    reset();
    return;
  }
  expression = expression.slice(0, -1);
  render();
}

function evaluate() {
  if (hasError || !expression || /[+\-*/.]$/.test(expression)) return;

  try {
    const result = calculate(expression);
    history.textContent = `${expression} =`;
    expression = result;
    justEvaluated = true;
    render();
  } catch {
    showError();
  }
}

function handleAction(action) {
  if (action === "clear") reset();
  if (action === "backspace") backspace();
  if (action === "decimal") addDecimal();
  if (action === "toggle-sign") toggleSign();
  if (action === "percent") percent();
  if (action === "equals") evaluate();
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.value && /^\d$/.test(button.dataset.value)) {
    addDigit(button.dataset.value);
  } else if (button.dataset.value) {
    addOperator(button.dataset.value);
  } else {
    handleAction(button.dataset.action);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) addDigit(event.key);
  else if (["+", "-", "*", "/"].includes(event.key)) addOperator(event.key);
  else if (event.key === ".") addDecimal();
  else if (event.key === "%") percent();
  else if (event.key === "Enter" || event.key === "=") evaluate();
  else if (event.key === "Backspace") backspace();
  else if (event.key === "Escape" || event.key.toLowerCase() === "c") reset();
  else return;

  event.preventDefault();
});

render();
