export const FILES_DATA = [
    {
        section: 'Wykłady',
        icon: 'fa-solid fa-chalkboard-teacher',
        files: [
            { href: 'zajecia/wyklady/pam_w01_intro.pdf',      type: 'pdf', label: 'W1 – Wprowadzenie do PAM' },
            { href: 'zajecia/wyklady/pam_w02_hardware.pdf',   type: 'pdf', label: 'W2 – Architektura sprzętu' },
            { href: 'zajecia/wyklady/pam_w03_ui.pdf',         type: 'pdf', label: 'W3 – Projektowanie UI/UX' },
            { href: 'zajecia/wyklady/pam_w04_natywne.pdf',    type: 'pdf', label: 'W4 – Projektowanie natywne' },
            { href: 'zajecia/wyklady/pam_w05_cross.pdf',      type: 'pdf', label: 'W5 – Projektowanie cross-platformowe' },
            { href: 'zajecia/wyklady/pam_w06_sensors.pdf',    type: 'pdf', label: 'W6 – Obsługa sensorów urządzeń mobilnych' },
            { href: 'zajecia/wyklady/pam_w07_IoT.pdf',        type: 'pdf', label: 'W7 – Programowanie aplikacji współpracujących z IoT' },
            { href: 'zajecia/wyklady/pam_w08_affective.pdf',  type: 'pdf', label: 'W8 – Informatyka afektywna' },
            { href: 'zajecia/wyklady/pam_w09_xr.pdf',         type: 'pdf', label: 'W9 – Programowanie aplikacji mobilnych XR' },
            { href: 'zajecia/wyklady/pam_w10_games.pdf',      type: 'pdf', label: 'W10 – Programowanie gier mobilnych' },
            { href: 'zajecia/wyklady/pam_w11_robots.pdf',     type: 'pdf', label: 'W11 – Programowanie autonomicznych robotów' },
        ],
    },
    {
        section: 'Laboratoria',
        icon: 'fa-solid fa-flask',
        files: [
            { href: 'zajecia/laby/kotlin.pdf',           type: 'pdf', label: 'Lab – Kotlin' },
            { href: 'zajecia/laby/flutter.pdf',          type: 'pdf', label: 'Lab – Flutter' },
            { href: 'zajecia/laby/unity.pdf',            type: 'pdf', label: 'Lab – Unity' },
            { href: 'zajecia/laby/react.pdf',            type: 'pdf', label: 'Lab – React' },
            { href: 'zajecia/laby/tests.pdf',            type: 'pdf', label: 'Lab – Tests' },
            { href: 'zajecia/laby/tematyprojektow.pdf',  type: 'pdf', label: 'Tematy projektów' },
        ],
    },
    {
        section: 'Dodatkowe strony',
        icon: 'fa-solid fa-window-restore',
        files: [
            { href: 'pages/3dgs.html',           type: 'html', label: '3DGS Viewer – szkielet podglądu' },
            { href: 'pages/InsectTracker.html',  type: 'html', label: 'InsectTracker – system śledzenia owadów' },
        ],
    },
];

export const LIVE_MATERIALS_DATA = [
    {
        section: 'Wykłady live',
        icon: 'fa-solid fa-tower-broadcast',
        files: [
            { title: 'W1 – Wprowadzenie do PAM',                   livePath: 'zajecia/live/wyklady/w01-intro-live.html', pdfPath: 'zajecia/wyklady/pam_w01_intro.pdf' },
            { title: 'W2 – Architektura sprzętu',                  livePath: 'zajecia/live/wyklady/w02-hardware-live.html', pdfPath: 'zajecia/wyklady/pam_w02_hardware.pdf' },
            { title: 'W3 – Projektowanie UI/UX',                   livePath: 'zajecia/live/wyklady/w03-ui-live.html', pdfPath: 'zajecia/wyklady/pam_w03_ui.pdf' },
            { title: 'W4 – Projektowanie natywne',                 livePath: 'zajecia/live/wyklady/w04-native-live.html', pdfPath: 'zajecia/wyklady/pam_w04_natywne.pdf' },
            { title: 'W5 – Projektowanie cross-platformowe',       livePath: 'zajecia/live/wyklady/w05-cross-live.html', pdfPath: 'zajecia/wyklady/pam_w05_cross.pdf' },
            { title: 'W6 – Obsługa sensorów urządzeń mobilnych',   livePath: 'zajecia/live/wyklady/w06-sensors-live.html', pdfPath: 'zajecia/wyklady/pam_w06_sensors.pdf' },
            { title: 'W7 – Programowanie aplikacji z IoT',         livePath: 'zajecia/live/wyklady/w07-iot-live.html', pdfPath: 'zajecia/wyklady/pam_w07_IoT.pdf' },
            { title: 'W8 – Informatyka afektywna',                 livePath: 'zajecia/live/wyklady/w08-affective-live.html', pdfPath: 'zajecia/wyklady/pam_w08_affective.pdf' },
            { title: 'W9 – Programowanie aplikacji mobilnych XR',  livePath: 'zajecia/live/wyklady/w09-xr-live.html', pdfPath: 'zajecia/wyklady/pam_w09_xr.pdf' },
            { title: 'W10 – Programowanie gier mobilnych',         livePath: 'zajecia/live/wyklady/w10-games-live.html', pdfPath: 'zajecia/wyklady/pam_w10_games.pdf' },
            { title: 'W11 – Programowanie autonomicznych robotów', livePath: 'zajecia/live/wyklady/w11-robots-live.html', pdfPath: 'zajecia/wyklady/pam_w11_robots.pdf' },
        ],
    },
];

export const FILE_ICON_MAP = {
    pdf:  { cls: 'fa-solid fa-file-pdf',        label: 'PDF' },
    pptx: { cls: 'fa-solid fa-file-powerpoint', label: 'PPTX' },
    html: { cls: 'fa-solid fa-file-code', label: 'Strona HTML' },
};
