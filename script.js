let rawQuestions = []; // Array para armazenar as perguntas carregadas do JSON
let questions = []; // Array para armazenar as perguntas na ordem escolhida
const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restart-button');
const orderSelect = document.getElementById('order');

let currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
let score = parseInt(localStorage.getItem('quizScore')) || 0;
let answeredQuestions = JSON.parse(localStorage.getItem('answeredQuestions')) || [];
let questionOrder = localStorage.getItem('questionOrder') || 'normal';

// Função para embaralhar um array (algoritmo de Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função para aplicar a ordem das perguntas
function applyQuestionOrder() {
    questionOrder = orderSelect.value;
    localStorage.setItem('questionOrder', questionOrder);
    questions = [...rawQuestions]; // Cria uma cópia do array original
    if (questionOrder === 'random') {
        questions = shuffleArray(questions);
    }
}

// Função para carregar as perguntas e aplicar a ordem
async function loadQuestionsAndOrder() {
    try {
        const response = await fetch('./dados.json');
        const data = await response.json();
        rawQuestions = data;
        applyQuestionOrder();
        loadQuestion();
    } catch (error) {
        console.error('Erro ao carregar as perguntas:', error);
        questionElement.textContent = 'Erro ao carregar as perguntas.';
    }
}

function loadQuestion() {
    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
        optionsElement.innerHTML = '';
        currentQuestion.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => checkAnswer(index));

            // Mantém a lógica para exibir respostas anteriores, se houver
            const answered = answeredQuestions.find(ans => ans.question === currentQuestion.question);
            if (answered && answered.chosenAnswer === option) {
                button.classList.add(answered.isCorrect ? 'correct' : 'incorrect');
                button.disabled = true;
            } else if (answered && currentQuestion.options[currentQuestion.answer] === option && !answered.isCorrect) {
                button.classList.add('correct');
            } else if (answered) {
                button.disabled = true;
            }

            optionsElement.appendChild(button);
        });

        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.disabled = currentQuestionIndex === questions.length - 1; // Habilita o "Próxima" sempre, a lógica de mostrar o resultado está em nextButton event

        // Salva o índice da pergunta atual no localStorage
        localStorage.setItem('currentQuestionIndex', currentQuestionIndex);

    } else {
        showResults();
    }
}

function checkAnswer(selectedIndex) {
    if (currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedIndex === currentQuestion.answer;
        const chosenAnswer = currentQuestion.options[selectedIndex];

        const answeredIndex = answeredQuestions.findIndex(ans => ans.question === currentQuestion.question);
        if (answeredIndex !== -1) {
            answeredQuestions[answeredIndex] = {
                question: currentQuestion.question,
                chosenAnswer: chosenAnswer,
                correctAnswer: currentQuestion.options[currentQuestion.answer],
                isCorrect: isCorrect
            };
        } else {
            answeredQuestions.push({
                question: currentQuestion.question,
                chosenAnswer: chosenAnswer,
                correctAnswer: currentQuestion.options[currentQuestion.answer],
                isCorrect: isCorrect
            });
        }

        const optionButtons = optionsElement.querySelectorAll('button');
        optionButtons.forEach((button, index) => {
            button.disabled = true;
            if (index === selectedIndex) {
                button.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
            if (index === currentQuestion.answer) {
                button.classList.add('correct');
            }
        });

        nextButton.disabled = false; // Habilita o "Próxima" após responder

        // Salva as respostas e pontuação no localStorage
        localStorage.setItem('answeredQuestions', JSON.stringify(answeredQuestions));
        localStorage.setItem('quizScore', answeredQuestions.filter(ans => ans.isCorrect).length);
    }
}

function showResults() {
    questionElement.style.display = 'none';
    optionsElement.style.display = 'none';
    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
    resultsContainer.style.display = 'block';

    score = answeredQuestions.filter(answer => answer.isCorrect).length;
    scoreElement.textContent = `Você acertou ${score} de ${questions.length} perguntas.`;

    const reviewContainer = document.createElement('div');
    reviewContainer.innerHTML = '<h2>Revisão das Questões</h2>';
    questions.forEach((questionItem, index) => {
        const answered = answeredQuestions.find(ans => ans.question === questionItem.question);
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('review-item');
        questionDiv.innerHTML = `
            <h3>Pergunta ${index + 1}: ${questionItem.question}</h3>
            <p>Sua resposta: <span class="${answered && answered.chosenAnswer === questionItem.options[questionItem.options.findIndex(opt => opt === answered?.chosenAnswer)] ? (answered.isCorrect ? 'correct-text' : 'incorrect-text') : 'não respondida'}">${answered?.chosenAnswer || 'Não respondida'}</span></p>
            <p>Resposta correta: <span class="correct-text">${questionItem.options[questionItem.answer]}</span></p>
        `;
        reviewContainer.appendChild(questionDiv);
    });
    resultsContainer.appendChild(reviewContainer);

    // Limpa os dados do localStorage ao finalizar o quiz
    localStorage.removeItem('currentQuestionIndex');
    localStorage.removeItem('quizScore');
    localStorage.removeItem('answeredQuestions');
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    answeredQuestions = [];
    localStorage.removeItem('currentQuestionIndex');
    localStorage.removeItem('quizScore');
    localStorage.removeItem('answeredQuestions');
    applyQuestionOrder(); // Aplica a ordem escolhida ao recomeçar
    questionElement.style.display = 'block';
    optionsElement.style.display = 'block';
    prevButton.style.display = 'block';
    nextButton.style.display = 'block';
    resultsContainer.style.display = 'none'; // Esconde resultados
    resultsContainer.innerHTML = `
        <h2>Seus Resultados</h2>
        <p id="score"></p>
        <button id="restart-button">Recomeçar</button>
    `;
    const restartButtonElement = document.getElementById('restart-button');
    restartButtonElement.addEventListener('click', restartQuiz);
    loadQuestion();
}

nextButton.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }
});

prevButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
});

restartButton.addEventListener('click', restartQuiz);

orderSelect.addEventListener('change', () => {
    applyQuestionOrder(); // Aplica a nova ordem
    restartQuiz(); // Reinicia o quiz
});

// Carrega as perguntas e a ordem ao carregar a página
loadQuestionsAndOrder();

// Mostra a seleção de ordem o tempo todo
orderSelect.style.display = 'block';