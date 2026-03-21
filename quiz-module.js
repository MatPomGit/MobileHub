'use strict';

const QUIZ_QUESTIONS = [
    {
        question: 'Która warstwa architektury MVVM odpowiada bezpośrednio za przygotowanie stanu dla interfejsu użytkownika?',
        category: 'Architektura',
        answers: ['Repository', 'ViewModel', 'Room Database', 'Service'],
        correctIndex: 1,
        explanation: 'ViewModel przygotowuje i udostępnia stan dla UI, oddzielając logikę prezentacji od widoku.'
    },
    {
        question: 'Która biblioteka jest najczęściej używana w Androidzie do lokalnego przechowywania danych w relacyjnej bazie?',
        category: 'Android',
        answers: ['Retrofit', 'Room', 'Glide', 'WorkManager'],
        correctIndex: 1,
        explanation: 'Room jest warstwą abstrakcji nad SQLite i służy do przechowywania danych lokalnie.'
    },
    {
        question: 'Jaki mechanizm w Flutterze służy do budowy interfejsu w podejściu deklaratywnym?',
        category: 'Flutter',
        answers: ['Activities', 'Fragments', 'Widgets', 'Services'],
        correctIndex: 2,
        explanation: 'Flutter buduje cały interfejs z widgetów, które opisują wygląd i zachowanie ekranu.'
    },
    {
        question: 'Który protokół jest lekki i często używany w rozwiązaniach IoT do wymiany wiadomości?',
        category: 'Sieci',
        answers: ['FTP', 'MQTT', 'SOAP', 'IMAP'],
        correctIndex: 1,
        explanation: 'MQTT to lekki protokół publish/subscribe, bardzo popularny w IoT.'
    },
    {
        question: 'Który element Androida odpowiada za definicję tras i przejść między ekranami w Compose?',
        category: 'Android',
        answers: ['NavHost', 'RecyclerView', 'ConstraintLayout', 'BroadcastReceiver'],
        correctIndex: 0,
        explanation: 'NavHost przechowuje graf nawigacji i pozwala przełączać się między ekranami.'
    },
    {
        question: 'Jak nazywa się test, który sprawdza pojedynczą funkcję lub klasę w izolacji?',
        category: 'Testowanie',
        answers: ['Test jednostkowy', 'Test akceptacyjny', 'Test wydajnościowy', 'Test manualny'],
        correctIndex: 0,
        explanation: 'Test jednostkowy weryfikuje mały fragment logiki bez zależności od całego systemu.'
    },
    {
        question: 'Która technologia Apple jest standardowym frameworkiem do budowy nowoczesnego UI na iOS?',
        category: 'iOS',
        answers: ['UIKit XML', 'SwiftUI', 'CoreDataUI', 'SpriteKit'],
        correctIndex: 1,
        explanation: 'SwiftUI to deklaratywny framework Apple do tworzenia interfejsów.'
    },
    {
        question: 'Co oznacza skrót PWA w kontekście aplikacji mobilnych?',
        category: 'Web mobile',
        answers: ['Portable Web API', 'Progressive Web App', 'Programmed Widget Application', 'Private Web Access'],
        correctIndex: 1,
        explanation: 'PWA to Progressive Web App, czyli aplikacja webowa działająca jak aplikacja mobilna.'
    },
    {
        question: 'Który typ sensora pozwala wykrywać położenie urządzenia względem pola grawitacyjnego Ziemi?',
        category: 'Urządzenie',
        answers: ['Akcelerometr', 'Mikrofon', 'Czytnik linii papilarnych', 'Barometr'],
        correctIndex: 0,
        explanation: 'Akcelerometr mierzy przyspieszenie i jest wykorzystywany m.in. do wykrywania orientacji urządzenia.'
    },
    {
        question: 'Która praktyka zwiększa bezpieczeństwo aplikacji mobilnej podczas komunikacji z API?',
        category: 'Bezpieczeństwo',
        answers: ['Przechowywanie kluczy w kodzie źródłowym', 'Wyłączenie HTTPS', 'Stosowanie cert pinning i bezpiecznej autoryzacji', 'Brak walidacji danych'],
        correctIndex: 2,
        explanation: 'Cert pinning i bezpieczne mechanizmy autoryzacji utrudniają podsłuch i podszywanie się pod serwer.'
    },
    {
        question: 'Który komponent Androida najlepiej nadaje się do planowania gwarantowanej pracy w tle, nawet po restarcie aplikacji?',
        category: 'Android',
        answers: ['WorkManager', 'Toast', 'Intent Filter', 'TextView'],
        correctIndex: 0,
        explanation: 'WorkManager służy do niezawodnego wykonywania odroczonych zadań w tle z uwzględnieniem ograniczeń systemu.'
    },
    {
        question: 'Które rozwiązanie w iOS służy do trwałego, bezpiecznego przechowywania tokenów i haseł?',
        category: 'iOS',
        answers: ['UserDefaults', 'Clipboard', 'Keychain', 'Info.plist'],
        correctIndex: 2,
        explanation: 'Keychain jest przeznaczony do przechowywania wrażliwych danych, takich jak hasła i tokeny.'
    },
    {
        question: 'W Compose i SwiftUI stan interfejsu powinien być najczęściej traktowany jako:',
        category: 'UI',
        answers: ['Dane niemutowalne obserwowane przez widok', 'Stały plik konfiguracyjny', 'Zmienna globalna współdzielona przez cały system', 'Element zależny wyłącznie od XML'],
        correctIndex: 0,
        explanation: 'Nowoczesne frameworki UI promują jednokierunkowy przepływ danych i obserwowalny stan.'
    },
    {
        question: 'Który format jest najczęściej używany do lekkiej komunikacji REST API z aplikacją mobilną?',
        category: 'Sieci',
        answers: ['JSON', 'BMP', 'AVI', 'PSD'],
        correctIndex: 0,
        explanation: 'JSON jest lekki, czytelny i powszechnie stosowany w komunikacji klient-serwer.'
    },
    {
        question: 'Po co stosuje się cache lokalny w aplikacji mobilnej?',
        category: 'Wydajność',
        answers: ['Aby spowolnić uruchamianie aplikacji', 'Aby zmniejszyć liczbę renderowanych ekranów', 'Aby przyspieszyć dostęp do danych i wspierać tryb offline', 'Aby zastąpić system logowania'],
        correctIndex: 2,
        explanation: 'Cache lokalny poprawia szybkość działania i umożliwia korzystanie z części funkcji bez internetu.'
    },
    {
        question: 'Która praktyka poprawia dostępność aplikacji mobilnej?',
        category: 'Dostępność',
        answers: ['Ukrywanie etykiet pól formularza', 'Dodawanie opisów dla czytników ekranu i odpowiedniego kontrastu', 'Używanie wyłącznie koloru do przekazywania informacji', 'Blokowanie skalowania tekstu'],
        correctIndex: 1,
        explanation: 'Semantyczne opisy i odpowiedni kontrast wspierają użytkowników korzystających z technologii asystujących.'
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
    document.getElementById('prevBtn')?.addEventListener('click', handlePrevious);
    document.getElementById('restartBtn')?.addEventListener('click', restartQuiz);

    renderQuestion();
});

function renderQuestion() {
    const question = QUIZ_QUESTIONS[state.currentIndex];
    const answersContainer = document.getElementById('answers');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const answeredCount = state.selectedAnswers.filter((answer) => answer !== null).length;
    const progress = Math.round((answeredCount / QUIZ_QUESTIONS.length) * 100);

    document.getElementById('questionCount').textContent = `Pytanie ${state.currentIndex + 1} z ${QUIZ_QUESTIONS.length}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCategory').textContent = `Kategoria: ${question.category}`;
    document.getElementById('progressLabel').textContent = `Postęp: ${answeredCount}/${QUIZ_QUESTIONS.length} odpowiedzi`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', String(progress));
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
    const answeredCount = state.selectedAnswers.filter((answer) => answer !== null).length;
    const progress = Math.round((answeredCount / QUIZ_QUESTIONS.length) * 100);

    document.getElementById('progressLabel').textContent = `Postęp: ${answeredCount}/${QUIZ_QUESTIONS.length} odpowiedzi`;
    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressBar').setAttribute('aria-valuenow', String(progress));
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

function handlePrevious() {
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    renderQuestion();
}

function restartQuiz() {
    state.currentIndex = 0;
    state.selectedAnswers = new Array(QUIZ_QUESTIONS.length).fill(null);
    document.getElementById('quizCard').style.display = 'block';
    document.getElementById('resultCard').classList.remove('visible');
    updateProgress();
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showResults() {
    const correctAnswers = QUIZ_QUESTIONS.reduce((sum, question, index) => {
        return sum + Number(state.selectedAnswers[index] === question.correctIndex);
    }, 0);
    const percent = Math.round((correctAnswers / QUIZ_QUESTIONS.length) * 100);
    const weakAreas = getWeakAreas();

    document.getElementById('quizCard').style.display = 'none';

    const score = document.getElementById('score');
    score.textContent = `${correctAnswers}/${QUIZ_QUESTIONS.length} (${percent}%)`;
    score.className = `score ${percent >= 70 ? 'good' : 'bad'}`;

    const summary = document.getElementById('summary');
    summary.textContent = getSummaryText(percent);

    const weakAreasBox = document.getElementById('weakAreas');
    weakAreasBox.textContent = weakAreas.length
        ? `Najwięcej trudności sprawiły kategorie: ${weakAreas.join(', ')}.`
        : 'Świetnie! Wszystkie kategorie zostały zaliczone bez błędów.';

    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';

    QUIZ_QUESTIONS.forEach((question, index) => {
        const userAnswerIndex = state.selectedAnswers[index];
        const isCorrect = userAnswerIndex === question.correctIndex;
        const reviewItem = document.createElement('article');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
        reviewItem.innerHTML = `
            <h3>${index + 1}. ${question.question}</h3>
            <p><strong>Kategoria:</strong> ${question.category}</p>
            <p><strong>Twoja odpowiedź:</strong> ${formatAnswer(userAnswerIndex, question.answers)}</p>
            <p><strong>Poprawna odpowiedź:</strong> ${formatAnswer(question.correctIndex, question.answers)}</p>
            <p class="muted">${question.explanation}</p>
        `;
        reviewList.appendChild(reviewItem);
    });

    document.getElementById('resultCard').classList.add('visible');
    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getSummaryText(percent) {
    if (percent >= 85) return 'Świetny wynik — bardzo dobrze orientujesz się w zagadnieniach mobilnych.';
    if (percent >= 70) return 'Dobry wynik — masz solidne podstawy, ale warto utrwalić trudniejsze obszary.';
    if (percent >= 50) return 'Całkiem nieźle — przed egzaminem warto jeszcze powtórzyć kilka tematów.';
    return 'To dobry moment na powtórkę materiału i ponowne podejście do testu.';
}

function getWeakAreas() {
    const categoryMistakes = new Map();

    QUIZ_QUESTIONS.forEach((question, index) => {
        const isCorrect = state.selectedAnswers[index] === question.correctIndex;
        if (isCorrect) return;
        categoryMistakes.set(question.category, (categoryMistakes.get(question.category) || 0) + 1);
    });

    const highestMistakeCount = Math.max(0, ...categoryMistakes.values());
    return [...categoryMistakes.entries()]
        .filter(([, count]) => count === highestMistakeCount && count > 0)
        .map(([category]) => category);
}

function formatAnswer(index, answers) {
    if (index === null || index === undefined || index < 0) return 'Brak odpowiedzi';
    return `${LETTERS[index]}. ${answers[index]}`;
}
