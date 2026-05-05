'use strict';

const QUIZ_QUESTIONS_URL = 'quiz-questions.json';
const LETTERS = ['A', 'B', 'C', 'D'];

const state = {
    questions: [],
    currentIndex: 0,
    selectedAnswers: []
};

// Inicjalizacja modułu testowego po załadowaniu drzewa DOM.
document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await initializeQuiz();
});

// Podpinanie zdarzeń przycisków sterujących testem.
function bindEvents() {
    document.getElementById('nextBtn')?.addEventListener('click', handleNext);
    document.getElementById('prevBtn')?.addEventListener('click', handlePrevious);
    document.getElementById('restartBtn')?.addEventListener('click', restartQuiz);
}

// Wczytanie pytań z pliku JSON i przygotowanie stanu quizu.
async function initializeQuiz() {
    try {
        const loadedQuestions = await loadQuestions();
        state.questions = loadedQuestions;
        state.selectedAnswers = new Array(state.questions.length).fill(null);

        updateQuestionTotal();
        updateProgress();
        renderQuestion();
    } catch (error) {
        renderLoadError(error);
    }
}

// Pobiera pytania z zewnętrznego pliku JSON i waliduje ich strukturę.
async function loadQuestions() {
    const response = await fetch(QUIZ_QUESTIONS_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Nie udało się wczytać pytań (${response.status}).`);
    }

    const payload = await response.json();
    validateQuestions(payload);
    return payload;
}

// Podstawowa walidacja danych wejściowych, aby uniknąć uszkodzonego quizu.
function validateQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Baza pytań jest pusta lub ma niepoprawny format.');
    }

    questions.forEach((question, index) => {
        const hasValidAnswers = Array.isArray(question.answers) && question.answers.length === 4;
        const hasValidCorrectIndex = Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < 4;

        if (!question.question || !question.category || !question.explanation || !hasValidAnswers || !hasValidCorrectIndex) {
            throw new Error(`Pytanie #${index + 1} ma niepoprawną strukturę.`);
        }
    });
}

function updateQuestionTotal() {
    const total = document.getElementById('questionTotal');
    if (total) total.textContent = `${state.questions.length} pytań`;
}

function renderQuestion() {
    if (state.questions.length === 0) return;

    const question = state.questions[state.currentIndex];
    const answersContainer = document.getElementById('answers');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    document.getElementById('questionCount').textContent = `Pytanie ${state.currentIndex + 1} z ${state.questions.length}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCategory').textContent = `Kategoria: ${question.category}`;
    answersContainer.innerHTML = '';

    question.answers.forEach((answer, index) => {
        const answerBtn = document.createElement('button');
        answerBtn.type = 'button';
        answerBtn.className = 'answer';
        if (state.selectedAnswers[state.currentIndex] === index) {
            answerBtn.classList.add('selected');
        }
        answerBtn.innerHTML = `
            <span class="answer-letter">${LETTERS[index]}</span>
            <span>${answer}</span>
        `;
        answerBtn.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(answerBtn);
    });

    const isLastQuestion = state.currentIndex === state.questions.length - 1;
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.textContent = isLastQuestion ? 'Zakończ test' : 'Dalej';
    nextBtn.disabled = state.selectedAnswers[state.currentIndex] === null;
}

function selectAnswer(index) {
    state.selectedAnswers[state.currentIndex] = index;
    document.querySelectorAll('.answer').forEach((button, buttonIndex) => {
        button.classList.toggle('selected', buttonIndex === index);
    });
    document.getElementById('nextBtn').disabled = false;
    updateProgress();
}

function updateProgress() {
    if (state.questions.length === 0) return;

    const answeredCount = state.selectedAnswers.filter((answer) => answer !== null).length;
    const progress = Math.round((answeredCount / state.questions.length) * 100);

    document.getElementById('progressLabel').textContent = `Postęp: ${answeredCount}/${state.questions.length} odpowiedzi`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', String(progress));
}

function handleNext() {
    if (state.selectedAnswers[state.currentIndex] === null) return;

    if (state.currentIndex === state.questions.length - 1) {
        showResults();
        return;
    }

    state.currentIndex += 1;
    renderQuestion();
}

function handlePrevious() {
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    renderQuestion();
}

function restartQuiz() {
    state.currentIndex = 0;
    state.selectedAnswers = new Array(state.questions.length).fill(null);
    document.getElementById('quizCard').style.display = 'block';
    document.getElementById('resultCard').classList.remove('visible');
    updateProgress();
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showResults() {
    const correctAnswers = state.questions.reduce((sum, question, index) => {
        return sum + Number(state.selectedAnswers[index] === question.correctIndex);
    }, 0);

    const score = Math.round((correctAnswers / state.questions.length) * 100);

    document.getElementById('quizCard').style.display = 'none';
    document.getElementById('resultCard').classList.add('visible');
    document.getElementById('resultScore').textContent = `${score}%`;
    document.getElementById('resultSummary').textContent = `Poprawne odpowiedzi: ${correctAnswers} z ${state.questions.length}`;

    renderResultDetails();
    renderRecommendation();
}

function renderResultDetails() {
    const detailsContainer = document.getElementById('resultDetails');
    detailsContainer.innerHTML = '';

    state.questions.forEach((question, index) => {
        const userAnswerIndex = state.selectedAnswers[index];
        const isCorrect = userAnswerIndex === question.correctIndex;

        const detail = document.createElement('article');
        detail.className = `result-detail ${isCorrect ? 'correct' : 'incorrect'}`;
        detail.innerHTML = `
            <h3>${index + 1}. ${question.question}</h3>
            <p><strong>Kategoria:</strong> ${question.category}</p>
            <p><strong>Twoja odpowiedź:</strong> ${formatAnswer(userAnswerIndex, question.answers)}</p>
            <p><strong>Poprawna odpowiedź:</strong> ${formatAnswer(question.correctIndex, question.answers)}</p>
            <p class="muted">${question.explanation}</p>
        `;

        detailsContainer.appendChild(detail);
    });
}

function renderRecommendation() {
    const recommendation = document.getElementById('resultRecommendation');
    const weakestCategory = getWeakestCategory();

    if (!weakestCategory) {
        recommendation.textContent = 'Świetna robota! Utrzymuj regularne powtórki, aby utrwalać wiedzę.';
        return;
    }

    recommendation.textContent = `Najwięcej błędów masz w kategorii: ${weakestCategory}. Warto powtórzyć ten obszar.`;
}

function getWeakestCategory() {
    const categoryMistakes = new Map();

    state.questions.forEach((question, index) => {
        const isCorrect = state.selectedAnswers[index] === question.correctIndex;
        if (isCorrect) return;
        categoryMistakes.set(question.category, (categoryMistakes.get(question.category) || 0) + 1);
    });

    const sorted = [...categoryMistakes.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
}

function formatAnswer(index, answers) {
    if (index === null || index === undefined || index < 0) return 'Brak odpowiedzi';
    return `${LETTERS[index]}. ${answers[index]}`;
}

// Informuje użytkownika o problemie z danymi zamiast pozostawiać pusty ekran.
function renderLoadError(error) {
    const questionText = document.getElementById('questionText');
    if (questionText) {
        questionText.textContent = `Błąd ładowania pytań: ${error.message}`;
    }
    document.getElementById('nextBtn')?.setAttribute('disabled', 'true');
    document.getElementById('prevBtn')?.setAttribute('disabled', 'true');
}
