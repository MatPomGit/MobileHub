'use strict';

const QUIZ_QUESTIONS = [
    {
        question: 'Która warstwa architektury MVVM odpowiada bezpośrednio za przygotowanie stanu dla interfejsu użytkownika?',
        answers: ['Repository', 'ViewModel', 'Room Database', 'Service'],
        correctIndex: 1,
        explanation: 'ViewModel przygotowuje i udostępnia stan dla UI, oddzielając logikę prezentacji od widoku.'
    },
    {
        question: 'Która biblioteka jest najczęściej używana w Androidzie do lokalnego przechowywania danych w relacyjnej bazie?',
        answers: ['Retrofit', 'Room', 'Glide', 'WorkManager'],
        correctIndex: 1,
        explanation: 'Room jest warstwą abstrakcji nad SQLite i służy do przechowywania danych lokalnie.'
    },
    {
        question: 'Jaki mechanizm w Flutterze służy do budowy interfejsu w podejściu deklaratywnym?',
        answers: ['Activities', 'Fragments', 'Widgets', 'Services'],
        correctIndex: 2,
        explanation: 'Flutter buduje cały interfejs z widgetów, które opisują wygląd i zachowanie ekranu.'
    },
    {
        question: 'Który protokół jest lekki i często używany w rozwiązaniach IoT do wymiany wiadomości?',
        answers: ['FTP', 'MQTT', 'SOAP', 'IMAP'],
        correctIndex: 1,
        explanation: 'MQTT to lekki protokół publish/subscribe, bardzo popularny w IoT.'
    },
    {
        question: 'Który element Androida odpowiada za definicję tras i przejść między ekranami w Compose?',
        answers: ['NavHost', 'RecyclerView', 'ConstraintLayout', 'BroadcastReceiver'],
        correctIndex: 0,
        explanation: 'NavHost przechowuje graf nawigacji i pozwala przełączać się między ekranami.'
    },
    {
        question: 'Jak nazywa się test, który sprawdza pojedynczą funkcję lub klasę w izolacji?',
        answers: ['Test jednostkowy', 'Test akceptacyjny', 'Test wydajnościowy', 'Test manualny'],
        correctIndex: 0,
        explanation: 'Test jednostkowy weryfikuje mały fragment logiki bez zależności od całego systemu.'
    },
    {
        question: 'Która technologia Apple jest standardowym frameworkiem do budowy nowoczesnego UI na iOS?',
        answers: ['UIKit XML', 'SwiftUI', 'CoreDataUI', 'SpriteKit'],
        correctIndex: 1,
        explanation: 'SwiftUI to deklaratywny framework Apple do tworzenia interfejsów.'
    },
    {
        question: 'Co oznacza skrót PWA w kontekście aplikacji mobilnych?',
        answers: ['Portable Web API', 'Progressive Web App', 'Programmed Widget Application', 'Private Web Access'],
        correctIndex: 1,
        explanation: 'PWA to Progressive Web App, czyli aplikacja webowa działająca jak aplikacja mobilna.'
    },
    {
        question: 'Który typ sensora pozwala wykrywać położenie urządzenia względem pola grawitacyjnego Ziemi?',
        answers: ['Akcelerometr', 'Mikrofon', 'Czytnik linii papilarnych', 'Barometr'],
        correctIndex: 0,
        explanation: 'Akcelerometr mierzy przyspieszenie i jest wykorzystywany m.in. do wykrywania orientacji urządzenia.'
    },
    {
        question: 'Która praktyka zwiększa bezpieczeństwo aplikacji mobilnej podczas komunikacji z API?',
        answers: ['Przechowywanie kluczy w kodzie źródłowym', 'Wyłączenie HTTPS', 'Stosowanie cert pinning i bezpiecznej autoryzacji', 'Brak walidacji danych'],
        correctIndex: 2,
        explanation: 'Cert pinning i bezpieczne mechanizmy autoryzacji utrudniają podsłuch i podszywanie się pod serwer.'
    }
];

const LETTERS = ['A', 'B', 'C', 'D'];

const state = {
    currentIndex: 0,
    selectedAnswers: new Array(QUIZ_QUESTIONS.length).fill(null)
};

document.addEventListener('DOMContentLoaded', () => {
    const total = document.getElementById('questionTotal');
    if (total) total.textContent = `${QUIZ_QUESTIONS.length} pytań`;

    document.getElementById('nextBtn')?.addEventListener('click', handleNext);
    document.getElementById('restartBtn')?.addEventListener('click', restartQuiz);

    renderQuestion();
});

function renderQuestion() {
    const question = QUIZ_QUESTIONS[state.currentIndex];
    const answersContainer = document.getElementById('answers');
    const nextBtn = document.getElementById('nextBtn');

    document.getElementById('questionCount').textContent = `Pytanie ${state.currentIndex + 1} z ${QUIZ_QUESTIONS.length}`;
    document.getElementById('questionText').textContent = question.question;
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

    const isLastQuestion = state.currentIndex === QUIZ_QUESTIONS.length - 1;
    nextBtn.textContent = isLastQuestion ? 'Zakończ test' : 'Dalej';
    nextBtn.disabled = state.selectedAnswers[state.currentIndex] === null;
}

function selectAnswer(index) {
    state.selectedAnswers[state.currentIndex] = index;
    document.querySelectorAll('.answer').forEach((button, buttonIndex) => {
        button.classList.toggle('selected', buttonIndex === index);
    });
    document.getElementById('nextBtn').disabled = false;
}

function handleNext() {
    if (state.selectedAnswers[state.currentIndex] === null) return;

    if (state.currentIndex === QUIZ_QUESTIONS.length - 1) {
        showResults();
        return;
    }

    state.currentIndex += 1;
    renderQuestion();
}

function restartQuiz() {
    state.currentIndex = 0;
    state.selectedAnswers = new Array(QUIZ_QUESTIONS.length).fill(null);
    document.getElementById('quizCard').style.display = 'block';
    document.getElementById('resultCard').classList.remove('visible');
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showResults() {
    const correctAnswers = QUIZ_QUESTIONS.reduce((sum, question, index) => {
        return sum + Number(state.selectedAnswers[index] === question.correctIndex);
    }, 0);
    const percent = Math.round((correctAnswers / QUIZ_QUESTIONS.length) * 100);

    document.getElementById('quizCard').style.display = 'none';

    const score = document.getElementById('score');
    score.textContent = `${correctAnswers}/${QUIZ_QUESTIONS.length} (${percent}%)`;
    score.className = `score ${percent >= 70 ? 'good' : 'bad'}`;

    const summary = document.getElementById('summary');
    summary.textContent = percent >= 70
        ? 'Bardzo dobry wynik — masz solidne podstawy do egzaminu.'
        : 'Warto jeszcze powtórzyć materiał i spróbować ponownie.';

    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';

    QUIZ_QUESTIONS.forEach((question, index) => {
        const userAnswerIndex = state.selectedAnswers[index];
        const isCorrect = userAnswerIndex === question.correctIndex;
        const reviewItem = document.createElement('article');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        reviewItem.innerHTML = `
            <h3>${index + 1}. ${question.question}</h3>
            <p><strong>Twoja odpowiedź:</strong> ${formatAnswer(userAnswerIndex, question.answers)}</p>
            <p><strong>Poprawna odpowiedź:</strong> ${formatAnswer(question.correctIndex, question.answers)}</p>
            <p class="muted">${question.explanation}</p>
        `;
        reviewList.appendChild(reviewItem);
    });

    document.getElementById('resultCard').classList.add('visible');
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatAnswer(index, answers) {
    if (index === null || index === undefined || index < 0) return 'Brak odpowiedzi';
    return `${LETTERS[index]}. ${answers[index]}`;
}
