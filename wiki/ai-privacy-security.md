# Prywatność i bezpieczeństwo w lokalnej AI

> Artykuł w przygotowaniu.

Ten artykuł omówi aspekty prywatności i bezpieczeństwa specyficzne dla lokalnej AI: ochronę modelu przed kradzieżą intelektualną, bezpieczne przechowywanie danych treningowych, federacyjne uczenie maszynowe oraz zagrożenia atakami adversarialnymi na urządzeniu mobilnym.

## Zagadnienia

- Dlaczego lokalna AI poprawia prywatność (brak transferu danych do chmury)
- Ochrona modelu: szyfrowanie `.tflite` / `.mlpackage`, obfuskacja wag
- Bezpieczna enklawa (Secure Enclave / Titan M2) dla prywatnych operacji AI
- Federated Learning — trening rozproszony bez ujawniania danych
- Differential Privacy w kontekście lokalnych modeli adaptacyjnych
- Ataki adversarialne na modele mobilne (adversarial examples, model inversion)
- Zagrożenia side-channel: timing attacks, power analysis na NPU
- Regulacje prawne: RODO/GDPR a dane biometryczne przetwarzane lokalnie
- App Store / Google Play wymagania dotyczące AI i prywatności
- Audyt modeli: narzędzia do wykrywania bias i fairness
