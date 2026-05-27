'use strict';

const QUIZ_QUESTIONS_URL = 'quiz-questions.json'; // Witajcie studenci! tak, to tutaj jest kod dotyczący modułu testów.
const LETTERS = ['A', 'B', 'C', 'D']; // Zapraszam do czytania i zrozumienia jak i co dziala.
const QUIZ_MODE_SIZES = {
    // Mapa trybów testu na docelową liczbę pytań w sesji.
    short: 25,
    normal: 50
};

const QUIZ_MODE_TIME_LIMITS = {
    // Limity czasu w sekundach zależne od trybu testu.
    short: 20 * 60,
    normal: 40 * 60
};


const PRACTICE_MODULES = {
    // Kluczowe moduły z zadaniami praktycznymi i jednoznacznym kryterium zaliczenia.
    4: {
        materialUrl: 'wiki/kotlin-basics.md',
        tasks: [
            { title: 'Walidacja danych formularza', criterion: 'Funkcja zwraca `true` dla poprawnych danych i `false` dla niepoprawnych.', validation: 'Uruchom testy jednostkowe: 4/4 testów musi przejść.', hint: 'Zacznij od funkcji z guard clauses dla pustych pól.', solution: 'Rozwiązanie referencyjne: osobna funkcja `validateProfile(input)` + testy skrajnych przypadków.' },
            { title: 'Obsługa stanu ekranu', criterion: 'Po zmianie danych widok aktualizuje wszystkie pola bez odświeżania aktywności.', validation: 'Expected output: po kliknięciu „Odśwież” licznik zwiększa się o 1.', hint: 'Wykorzystaj `mutableStateOf` lub `StateFlow`.', solution: 'Rozwiązanie referencyjne: ViewModel z jednym źródłem prawdy i mapowaniem stanu UI.' }
        ]
    },
    8: {
        materialUrl: 'wiki/android-network.md',
        tasks: [
            { title: 'Pobranie API z timeoutem', criterion: 'Aplikacja pokazuje dane lub kontrolowany komunikat błędu przy timeout.', validation: 'Checklist: timeout=3s, retry=1, komunikat błędu widoczny.', hint: 'Dodaj timeout w kliencie HTTP i oddziel warstwę repozytorium.', solution: 'Rozwiązanie referencyjne: `suspend fun fetchData()` + `Result.Success/Error` i test mockowanego timeoutu.' },
            { title: 'Mapowanie DTO->UI', criterion: 'Każde pole widoczne na ekranie jest mapowane z modelu domenowego.', validation: 'Expected output: lista 5 elementów wyświetla tytuł i status bez `null`.', hint: 'Stwórz funkcję `toUiModel()` i obsłuż brakujące wartości domyślne.', solution: 'Rozwiązanie referencyjne: mapper z fallbackami i test snapshot odpowiedzi.' }
        ]
    },
    10: {
        materialUrl: 'wiki/android-testing.md',
        tasks: [
            { title: 'Test regresji logiki', criterion: 'Błąd zgłoszony przez prowadzącego jest odtwarzany testem i naprawiony.', validation: 'Uruchom `npm test`/`gradle test`: test regresji ma status PASS.', hint: 'Najpierw napisz failing test na minimalnym przykładzie.', solution: 'Rozwiązanie referencyjne: scenariusz RED->GREEN->REFACTOR z jednym testem regresji.' },
            { title: 'Pomiar wydajności', criterion: 'Czas renderu kluczowego ekranu spada o min. 20%.', validation: 'Expected output: metryka before/after zapisana w raporcie.', hint: 'Zidentyfikuj najdroższe operacje w profilerze.', solution: 'Rozwiązanie referencyjne: memoizacja + paginacja + porównanie metryk przed/po.' }
        ]
    }
};

const HELP_UNLOCK_SECONDS = 60;
const SOLUTION_UNLOCK_SECONDS = 120;

const CATEGORY_LABELS = {
    // Mapowanie numerów kategorii na nazwy tematów z sekcji „Tematy egzaminacyjne”.
    1: 'Systemy operacyjne i ekosystemy mobilne',
    2: 'Projektowanie interfejsu użytkownika',
    3: 'Architektura aplikacji mobilnych',
    4: 'Programowanie Android (Kotlin / Jetpack)',
    5: 'Programowanie iOS (Swift / SwiftUI)',
    6: 'Cross-Platform i PWA',
    7: 'Hardware i obsługa sensorów',
    8: 'Sieć i komunikacja',
    9: 'Bezpieczeństwo aplikacji mobilnych',
    10: 'Testowanie i wydajność',
    11: 'Robotyka mobilna i sterowanie',
    12: 'Publikacja, utrzymanie i analityka aplikacji'
};

const state = {
    allQuestions: [],
    questions: [],
    currentIndex: 0,
    selectedAnswers: [],
    mode: 'short',
    isReady: false,
    timeLeft: 0,
    timerId: null,
    resultShownAt: null
};

// Inicjalizacja modułu testowego po załadowaniu drzewa DOM.
document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await initializeQuiz();
});

// Podpinanie zdarzeń przycisków sterujących testem.
function bindEvents() {
    document.getElementById('startQuizBtn')?.addEventListener('click', startQuiz);
    document.getElementById('nextBtn')?.addEventListener('click', handleNext);
    document.getElementById('prevBtn')?.addEventListener('click', handlePrevious);
    document.getElementById('restartBtn')?.addEventListener('click', showConfigPanel);
    document.getElementById('resultRestartBtn')?.addEventListener('click', showConfigPanel);
    document.querySelectorAll('input[name="quizMode"]').forEach((input) => {
        input.addEventListener('change', updateModePreview);
    });
}

// Wczytanie pytań przygotowuje konfigurację, ale nie uruchamia jeszcze testu.
async function initializeQuiz() {
    try {
        const loadedQuestions = await loadQuestions();
        state.allQuestions = loadedQuestions;
        state.isReady = true;
        state.mode = getSelectedMode();

        const status = document.getElementById('questionsLoadStatus');
        if (status) {
            const categoryCount = groupQuestionsByCategory(state.allQuestions).size;
            status.textContent = `Dostępne pytania: ${state.allQuestions.length}, dostępnych tematów: ${categoryCount}.`;
        }

        renderTopicSelector();
        document.getElementById('startQuizBtn')?.removeAttribute('disabled');
        updateModePreview();
        showConfigPanel({ scroll: false });
    } catch (error) {
        renderLoadError(error);
    }
}

// Zeruje indeks i odpowiedzi dla aktualnie przygotowanego zestawu pytań.
function resetSessionState() {
    state.currentIndex = 0;
    state.selectedAnswers = new Array(state.questions.length).fill(null);
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

// Buduje sesję pytań tak, aby każda kategoria była reprezentowana możliwie równomiernie.
function buildBalancedQuestionSet(allQuestions, targetSize) {
    const groupedByCategory = groupQuestionsByCategory(allQuestions);
    const categories = [...groupedByCategory.keys()];
    const finalSize = Math.min(targetSize, allQuestions.length);

    if (categories.length === 0) return [];

    const shuffledPools = new Map();
    categories.forEach((category) => {
        shuffledPools.set(category, shuffle([...groupedByCategory.get(category)]));
    });

    const selected = [];

    // Pierwsza faza: rozdajemy pytania po jednej sztuce na kategorię w rundach.
    while (selected.length < finalSize) {
        let addedInRound = false;

        for (const category of categories) {
            if (selected.length >= finalSize) break;
            const pool = shuffledPools.get(category);
            if (!pool || pool.length === 0) continue;
            selected.push(pool.pop());
            addedInRound = true;
        }

        if (!addedInRound) break;
    }

    return shuffle(selected);
}

// Grupuje pytania po polu category dla późniejszego zbalansowanego losowania.
function groupQuestionsByCategory(questions) {
    const map = new Map();

    questions.forEach((question) => {
        if (!map.has(question.category)) {
            map.set(question.category, []);
        }
        map.get(question.category).push(question);
    });

    return map;
}

// Zwraca nową tablicę z losową kolejnością elementów (Fisher-Yates).
function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}



// Czyści aktywny licznik czasu, aby nie tworzyć równoległych interwałów.
function stopTimer() {
    if (state.timerId !== null) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
}

// Formatuje czas w sekundach do czytelnego zapisu mm:ss.
function formatTime(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Zwraca limit czasu dla podanego trybu testu.
function getTimeLimitForMode(mode) {
    return QUIZ_MODE_TIME_LIMITS[mode] ?? QUIZ_MODE_TIME_LIMITS.short;
}

// Aktualizuje etykietę licznika czasu w interfejsie.
function updateTimerDisplay() {
    state.timerLabelElement = state.timerLabelElement || document.getElementById('timerLabel');
    if (state.timerLabelElement) {
        state.timerLabelElement.textContent = `Pozostały czas: ${formatTime(state.timeLeft)}`;
    }
}

// Uruchamia odliczanie czasu i kończy test po wyzerowaniu licznika.
function startTimer() {
    stopTimer();
    updateTimerDisplay();

    state.timerId = window.setInterval(() => {
        state.timeLeft -= 1;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            stopTimer();
            showResults();
        }
    }, 1000);
}

// Buduje etykietę kategorii na bazie numeru i mapy tematów egzaminacyjnych.
function getCategoryLabel(categoryNumber) {
    const categoryName = CATEGORY_LABELS[categoryNumber] || 'Nieznana kategoria';
    return `${categoryNumber}. ${categoryName}`;
}

// Odczytuje aktualnie wybrany tryb testu z kontrolek formularza.
function getSelectedMode() {
    const checked = document.querySelector('input[name="quizMode"]:checked')?.value;
    // Obsługuje zarówno nazwy trybów (short/normal), jak i ewentualne wartości liczbowe z HTML (np. 25/50).
    if (checked && QUIZ_MODE_SIZES[checked]) {
        return checked;
    }

    if (checked && /^\d+$/.test(checked)) {
        const targetSize = Number.parseInt(checked, 10);
        return Object.keys(QUIZ_MODE_SIZES).find(key => QUIZ_MODE_SIZES[key] === targetSize) || 'short';
    }

    return 'short';
}

// Zwraca docelową liczbę pytań dla trybu krótkiego lub normalnego.
function getTargetSizeForMode(mode) {
    return QUIZ_MODE_SIZES[mode] ?? QUIZ_MODE_SIZES.short;
}

function getPlannedQuestionCount(mode = getSelectedMode()) {
    const targetSize = getTargetSizeForMode(mode);
    return state.allQuestions.length > 0 ? Math.min(targetSize, state.allQuestions.length) : targetSize;
}

function updateModePreview() {
    state.mode = getSelectedMode();
    const plannedCount = getPlannedQuestionCount(state.mode);
    updateQuestionTotal(plannedCount);

    const summary = document.getElementById('selectedModeSummary');
    if (summary) summary.textContent = `${plannedCount} pytań · ${formatTime(getTimeLimitForMode(state.mode))}`;
}

function updateQuestionTotal(count = state.questions.length) {
    const total = document.getElementById('questionTotal');
    if (total) total.textContent = `${count} pytań w wybranym trybie`;
}


function renderTopicSelector() {
    const selector = document.getElementById('topicSelector');
    if (!selector) return;

    selector.innerHTML = '';

    const allButton = buildTopicButton('all', 'Wszystkie pytania');
    allButton.classList.add('active');
    selector.appendChild(allButton);

    Object.keys(CATEGORY_LABELS).map(Number).forEach((categoryNumber) => {
        const button = buildTopicButton(String(categoryNumber), getCategoryLabel(categoryNumber));
        selector.appendChild(button);
    });

    renderQuestionBankList('all');
}

function buildTopicButton(value, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'topic-chip';
    button.textContent = label;
    button.dataset.topic = value;
    button.addEventListener('click', () => {
        document.querySelectorAll('.topic-chip').forEach((chip) => chip.classList.remove('active'));
        button.classList.add('active');
        renderQuestionBankList(value);
    });
    return button;
}

function renderQuestionBankList(topic) {
    const container = document.getElementById('questionBankList');
    if (!container) return;

    const filteredQuestions = topic === 'all'
        ? state.allQuestions
        : state.allQuestions.filter((question) => String(question.category) === String(topic));

    container.innerHTML = '';
    if (filteredQuestions.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'Brak pytań dla wybranego zakresu.';
        container.appendChild(p);
        return;
    }

    const list = document.createElement('ol');
    for (const question of filteredQuestions) {
        const listItem = document.createElement('li');
        listItem.textContent = question.question;
        list.appendChild(listItem);
    }
    container.appendChild(list);
}

function startQuiz() {
    if (!state.isReady || state.allQuestions.length === 0) return;

    state.mode = getSelectedMode();
    state.questions = buildBalancedQuestionSet(state.allQuestions, getTargetSizeForMode(state.mode));
    resetSessionState();
    state.timeLeft = getTimeLimitForMode(state.mode);

    document.getElementById('configCard').hidden = true;
    document.getElementById('quizCard').hidden = false;
    document.getElementById('resultCard').classList.remove('visible');
    updateQuestionTotal(state.questions.length);
    updateProgress();
    renderQuestion();
    startTimer();
    window.scrollTo({ top: document.getElementById('quizCard').offsetTop - 16, behavior: 'smooth' });
}

function renderQuestion() {
    if (state.questions.length === 0) return;

    const question = state.questions[state.currentIndex];
    const answersContainer = document.getElementById('answers');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    document.getElementById('questionCount').textContent = `Pytanie ${state.currentIndex + 1} z ${state.questions.length}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCategory').textContent = `Kategoria: ${getCategoryLabel(question.category)}`;
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
    document.querySelector('.progress-track')?.setAttribute('aria-valuenow', String(progress));
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

// Wraca do konfiguracji bez automatycznego losowania kolejnej sesji.
function showConfigPanel(options = {}) {
    document.getElementById('configCard').hidden = false;
    document.getElementById('quizCard').hidden = true;
    document.getElementById('resultCard').classList.remove('visible');
    stopTimer();
    updateModePreview();

    if (options.scroll !== false) {
        window.scrollTo({ top: document.getElementById('configCard').offsetTop - 16, behavior: 'smooth' });
    }
}

function showResults() {
    if (state.questions.length === 0) return;

    const correctAnswers = state.questions.reduce((sum, question, index) => {
        return sum + Number(state.selectedAnswers[index] === question.correctIndex);
    }, 0);

    const score = Math.round((correctAnswers / state.questions.length) * 100);
    const scoreElement = document.getElementById('resultScore');

    document.getElementById('quizCard').hidden = true;
    document.getElementById('resultCard').classList.add('visible');
    scoreElement.textContent = `${score}%`;
    scoreElement.classList.toggle('good', score >= 60);
    scoreElement.classList.toggle('bad', score < 60);
    stopTimer();
    document.getElementById('resultSummary').textContent = `Poprawne odpowiedzi: ${correctAnswers} z ${state.questions.length}`;

    renderResultDetails();
    renderRecommendation();
    state.resultShownAt = Date.now();
    renderPracticeTasks();
    window.scrollTo({ top: document.getElementById('resultCard').offsetTop - 16, behavior: 'smooth' });
}

function renderResultDetails() {
    const detailsContainer = document.getElementById('resultDetails');
    detailsContainer.innerHTML = '';

    state.questions.forEach((question, index) => {
        const userAnswerIndex = state.selectedAnswers[index];
        const isCorrect = userAnswerIndex === question.correctIndex;

        const detail = document.createElement('article');
        detail.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        detail.innerHTML = `
            <h3>${index + 1}. ${question.question}</h3>
            <p><strong>Kategoria:</strong> ${getCategoryLabel(question.category)}</p>
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

    recommendation.textContent = `Najwięcej błędów masz w kategorii: ${getCategoryLabel(weakestCategory)}. Warto powtórzyć ten obszar.`;
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



function renderPracticeTasks() {
    const container = document.getElementById('practiceTasks');
    if (!container) return;
    container.innerHTML = '';

    const modulesToShow = getKeyModulesForReview();
    modulesToShow.forEach((category) => {
        const moduleConfig = PRACTICE_MODULES[category];
        if (!moduleConfig) return;

        const assessment = assessTaskReadiness(category);
        moduleConfig.tasks.forEach((task, taskIndex) => {
            const article = document.createElement('article');
            article.className = `review-item ${assessment.ready ? 'correct' : 'incorrect'}`;
            article.innerHTML = `
                <h3>${getCategoryLabel(category)} — zadanie ${taskIndex + 1}</h3>
                <p><strong>Zadanie:</strong> ${task.title}</p>
                <p><strong>Kryterium zaliczenia:</strong> ${task.criterion}</p>
                <p><strong>Automatyczna walidacja:</strong> ${task.validation}</p>
                <span class="task-badge ${assessment.ready ? 'ok' : 'fix'}">${assessment.ready ? 'Co działa: baza opanowana' : 'Wymaga poprawy: utrwal moduł'}</span>
                <p class="task-note">Materiał do powtórki: <a href="${moduleConfig.materialUrl}" target="_blank" rel="noopener">${moduleConfig.materialUrl}</a></p>
                <div class="task-actions">
                    <button class="secondary-btn" data-action="hint" data-category="${category}" data-task="${taskIndex}">Podpowiedź</button>
                    <button class="secondary-btn" data-action="solution" data-category="${category}" data-task="${taskIndex}">Rozwiązanie referencyjne</button>
                </div>
                <p class="task-note" id="taskMessage-${category}-${taskIndex}">Podpowiedź odblokuje się po ${HELP_UNLOCK_SECONDS}s, rozwiązanie po ${SOLUTION_UNLOCK_SECONDS}s.</p>
            `;
            container.appendChild(article);
        });
    });

    container.querySelectorAll('button[data-action]').forEach((button) => {
        button.addEventListener('click', handleTaskAction);
    });
}

function getKeyModulesForReview() {
    const present = new Set(state.questions.map((q) => q.category));
    return Object.keys(PRACTICE_MODULES)
        .map(Number)
        .filter((category) => present.has(category));
}

function assessTaskReadiness(category) {
    const categoryQuestions = state.questions.filter((q) => q.category === category);
    if (categoryQuestions.length === 0) return { ready: false };
    const correct = categoryQuestions.filter((question) => {
        const index = state.questions.indexOf(question);
        return state.selectedAnswers[index] === question.correctIndex;
    }).length;
    const ratio = correct / categoryQuestions.length;
    return { ready: ratio >= 0.6 };
}

function handleTaskAction(event) {
    const button = event.currentTarget;
    const category = Number(button.dataset.category);
    const taskIndex = Number(button.dataset.task);
    const action = button.dataset.action;
    const task = PRACTICE_MODULES[category]?.tasks?.[taskIndex];
    const message = document.getElementById(`taskMessage-${category}-${taskIndex}`);
    if (!task || !message) return;

    const elapsedSeconds = Math.floor((Date.now() - (state.resultShownAt || Date.now())) / 1000);
    const unlockSeconds = action === 'hint' ? HELP_UNLOCK_SECONDS : SOLUTION_UNLOCK_SECONDS;

    if (elapsedSeconds < unlockSeconds) {
        message.textContent = `Treść będzie dostępna za ${unlockSeconds - elapsedSeconds}s.`;
        return;
    }

    message.textContent = action === 'hint' ? `Podpowiedź: ${task.hint}` : `Rozwiązanie referencyjne: ${task.solution}`;
}

function formatAnswer(index, answers) {
    if (index === null || index === undefined || index < 0) return 'Brak odpowiedzi';
    return `${LETTERS[index]}. ${answers[index]}`;
}

// Informuje użytkownika o problemie z danymi zamiast pozostawiać pusty ekran.
function renderLoadError(error) {
    const status = document.getElementById('questionsLoadStatus');
    if (status) {
        status.textContent = `Błąd ładowania pytań: ${error.message}`;
    }
    document.getElementById('startQuizBtn')?.setAttribute('disabled', 'true');
    document.getElementById('nextBtn')?.setAttribute('disabled', 'true');
    document.getElementById('prevBtn')?.setAttribute('disabled', 'true');
}
