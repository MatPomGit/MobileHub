# Computer-Aided Diagnosis (CAD)

## Streszczenie

Computer-Aided Diagnosis (CAD) to zastosowanie technik obliczeniowych - tradycyjnych metod przetwarzania obrazu, uczenia maszynowego i głębokiego uczenia - do wspomagania lekarzy w wykrywaniu i klasyfikacji chorób na podstawie obrazów medycznych. Artykuł omawia historię CAD, rodzaje systemów (CADe i CADx), modalności obrazowania, architekty sieci neuronowych, kluczowe zastosowania kliniczne, wyzwania (nierównowaga klas, interpretowalność, prywatność), aspekty regulacyjne oraz aplikacje mobilne.

**Słowa kluczowe:** CAD, CADe, CADx, głębokie uczenie, CNN, U-Net, ResNet, DenseNet, segmentacja, Grad-CAM, federated learning, FDA clearance, radiologia, patologia cyfrowa, retinopathy, aplikacje medyczne

---

## 1. Historia i kontekst

### 1.1. Od lat sześćdziesiątych do głębokiego uczenia

Historia CAD sięga lat sześćdziesiątych XX wieku, kiedy Lodwick i współpracownicy (1963) zaproponowali komputerową analizę radiogramów klatki piersiowej. Wczesne systemy opierały się na ręcznie zaprojektowanych cechach i prostych klasyfikatorach:

| Dekada | Podejście | Przykład |
|---|---|---|
| 1960–1980 | Analiza histogramów, progi | Wczesna analiza mammografii |
| 1980–2000 | Ręczne cechy + SVM / sieci neuronowe | CALMA (mammografia), CAD dla CT płuc |
| 2000–2012 | Skalowane SVM, Random Forest, Boosting | LIDC-IDRI, lung CAD komercyjne |
| 2012– | Głębokie CNN, Transfer Learning | AlexNet, ResNet, U-Net |
| 2017– | Transformery, Foundation Models | ViT, BioViL, CLIP dla medycyny |

Przełomem był rok 2012, gdy AlexNet wygrał ImageNet Challenge z błędem top-5 poniżej 17%. Szybko okazało się, że sieci konwolucyjne wytrenowane na danych naturalnych mogą być dostrajane (*fine-tuned*) do analizy obrazów medycznych z bardzo dobrymi wynikami.

### 1.2. Definicja i cel

**CAD** (*Computer-Aided Diagnosis*) - szeroka kategoria systemów obliczeniowych wspierających decyzje diagnostyczne.

Dwa główne podtypy:

- **CADe** (*Computer-Aided Detection*): wykrywanie i lokalizacja zmian (guzki, polipy, zwapnienia)
- **CADx** (*Computer-Aided Diagnosis/Classification*): klasyfikacja wykrytych zmian (łagodna/złośliwa, stopień zaawansowania)

Systemy CAD są zaprojektowane jako **narzędzia wspomagające** - ostateczna decyzja należy do lekarza.

---

## 2. Modalności obrazowania medycznego

### 2.1. Przegląd modalności

| Modalność | Zasada fizyczna | Zastosowanie CAD | Charakterystyczne wyzwania |
|---|---|---|---|
| RTG / X-ray | Promieniowanie jonizujące | Płuca, kości, serce | Nakładanie się struktur, 2D |
| CT (*computed tomography*) | Wieloobrazowy RTG | Płuca, wątroba, mózg | Duże wolumeny danych 3D |
| MRI | Rezonans magnetyczny | Mózg, prostata, serce | Długi czas akwizycji, szum |
| Ultrasonografia | Ultradźwięki | Tarczyca, wątroba, serce | Szum speckle, artefakty |
| Mammografia | RTG niskiej energii | Rak piersi | Subtelne zwapnienia |
| Funduskopia | Fotografia siatkówki | Retinopatia cukrzycowa, jaskra | Jakość zdjęć klinicznych |
| Histopatologia | Mikroskopia optyczna | Rak (wszystkie typy) | Gigapikselowe skany (WSI) |
| Dermatoskopia | Fotografia skóry | Czerniak, rak podstawnokomórkowy | Zmienność oświetlenia |

### 2.2. Specyfika przetwarzania modalności

```python
# Preprocessing dla różnych modalności (pseudokod)
import numpy as np

def preprocess_xray(image):
    """Normalizacja i wyrównanie histogramu dla RTG."""
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    from skimage import exposure
    img = image.astype(np.float32)
    img = (img - img.min()) / (img.max() - img.min())
    img_clahe = exposure.equalize_adapthist(img, clip_limit=0.03)
    return img_clahe

def preprocess_mri(volume):
    """N4 bias field correction + z-score normalizacja dla MRI."""
    mu, sigma = volume.mean(), volume.std()
    normalized = (volume - mu) / (sigma + 1e-8)
    return np.clip(normalized, -3, 3)

def preprocess_histology(patch_rgb):
    """Normalizacja wybarwienia H&E (Macenko method)."""
    # Stain normalization redukuje zmienność między laboratoriami
    od = -np.log((patch_rgb.astype(float) + 1) / 256)
    return od
```

---

## 3. Architektury sieci neuronowych w CAD

### 3.1. ResNet (*Residual Networks*)

ResNet (He et al., 2015) wprowadził połączenia rezydualne (*skip connections*), rozwiązując problem zanikającego gradientu w głębokich sieciach.

```
x ──────────────────────────────┐
│                               │
▼                               │
Conv → BN → ReLU                │
│                               │ (shortcut/skip)
▼                               │
Conv → BN                       │
│                               │
└────────────── + ──────────────┘
                │
              ReLU
                │
              output
```

```python
import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return self.relu(out + residual)   # skip connection
```

### 3.2. DenseNet (*Densely Connected Networks*)

DenseNet (Huang et al., 2017) łączy każdą warstwę z wszystkimi kolejnymi, propagując cechy wieloskalowe.

**Zalety dla CAD**: efektywna propagacja gradientu, wieloskalowe reprezentacje cech, mniejsze ryzyko przeuczenia przy małych zbiorach.

### 3.3. U-Net dla segmentacji

U-Net (Ronneberger et al., 2015) jest architekturą encoder-decoder z połączeniami pomijającymi (*skip connections*). Jest standardem w segmentacji obrazów medycznych.

```python
class UNetBlock(nn.Module):
    """Podstawowy blok U-Net."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.conv(x)


class MiniUNet(nn.Module):
    """Uproszczona wersja U-Net do segmentacji obrazów medycznych."""
    def __init__(self, in_channels=1, out_channels=1, features=[32, 64, 128]):
        super().__init__()
        self.encoders = nn.ModuleList()
        self.pool = nn.MaxPool2d(2, 2)
        self.decoders = nn.ModuleList()
        self.upsamples = nn.ModuleList()

        ch = in_channels
        for feat in features:
            self.encoders.append(UNetBlock(ch, feat))
            ch = feat

        self.bottleneck = UNetBlock(features[-1], features[-1] * 2)

        for feat in reversed(features):
            self.upsamples.append(nn.ConvTranspose2d(feat * 2, feat, 2, stride=2))
            self.decoders.append(UNetBlock(feat * 2, feat))

        self.final_conv = nn.Conv2d(features[0], out_channels, 1)

    def forward(self, x):
        skip_connections = []
        for encoder in self.encoders:
            x = encoder(x)
            skip_connections.append(x)
            x = self.pool(x)

        x = self.bottleneck(x)
        skip_connections = skip_connections[::-1]

        for i, (upsample, decoder) in enumerate(zip(self.upsamples, self.decoders)):
            x = upsample(x)
            skip = skip_connections[i]
            if x.shape != skip.shape:
                x = nn.functional.interpolate(x, size=skip.shape[2:])
            x = torch.cat([skip, x], dim=1)
            x = decoder(x)

        return torch.sigmoid(self.final_conv(x))
```

### 3.4. Vision Transformers (ViT) w medycynie

Transformery wizyjne (Dosovitskiy et al., 2020) podzielają obraz na patche i przetwarzają je przez mechanizm self-attention.

```python
# Koncepcja patch embeddingu dla ViT w medycynie
class MedicalPatchEmbedding(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_channels=1, embed_dim=768):
        super().__init__()
        self.n_patches = (img_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_channels, embed_dim,
                              kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        x = self.proj(x)               # (B, embed_dim, H/P, W/P)
        x = x.flatten(2)               # (B, embed_dim, n_patches)
        return x.transpose(1, 2)       # (B, n_patches, embed_dim)
```

---

## 4. Kluczowe zastosowania kliniczne

### 4.1. Wykrywanie guzków płucnych (LUNA16)

LUNA16 (*LUng Nodule Analysis 2016*) był benchmarkiem dla CAD guzków płucnych w skanach CT. Zbierane są guzki od 3 mm średnicy.

Pipeline CAD dla guzków płucnych:
1. **Segmentacja tkanki płucnej** (U-Net lub region-growing)
2. **Kandydaci** (*candidate detection*): wykrywanie podejrzanych obszarów
3. **Fałszywe redukcja pozytywy** (*FP reduction*): klasyfikacja CNN
4. **Charakteryzacja** (*nodule characterization*): CADx - złośliwy/łagodny

### 4.2. Retinopatia cukrzycowa (Diabetic Retinopathy, DR)

Retinopatia cukrzycowa jest wiodącą przyczyną ślepoty wśród dorosłych. Skala ETDRS wyróżnia 5 stopni:

```
0: Brak DR
1: Łagodna NPDR (non-proliferative)
2: Umiarkowana NPDR
3: Ciężka NPDR
4: PDR (proliferative) - zagrożenie ślepotą
```

```python
# Przykład prostej klasyfikacji DR z PyTorch
import torch
import torch.nn as nn
from torchvision import models

class DRClassifier(nn.Module):
    """
    Klasyfikator retinopatii cukrzycowej oparty na ResNet50.
    Transfer learning z ImageNet.
    """
    def __init__(self, num_classes=5, pretrained=True):
        super().__init__()
        self.backbone = models.resnet50(pretrained=pretrained)
        # Zamień ostatnią warstwę FC
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    return total_loss / len(loader)
```

### 4.3. Detekcja raka w histopatologii

Cyfrowa patologia (*digital pathology*) operuje na skanach całych preparatów (*Whole Slide Images*, WSI) o rozmiarach 100 000 × 100 000 pikseli.

Podejście: **Multiple Instance Learning (MIL)**

1. WSI dzielony na tysiące patchy 256×256
2. Każdy patch kodowany przez CNN (encoder)
3. Agregacja embeddingów (attention-based MIL)
4. Predykcja na poziomie slajdu

### 4.4. Analiza skóry (Dermatoskopia)

Klasyfikacja zmian skórnych (Kaggle ISIC Challenge):

| Klasa | Opis |
|---|---|
| MEL | Czerniak (melanoma) |
| NV | Melanocytic nevus (znamię) |
| BCC | Rak podstawnokomórkowy |
| AK | Rogowacenie słoneczne |
| BKL | Łagodne zmiany keratotyczne |
| DF | Dermatofibroma |
| VASC | Zmiany naczyniowe |
| SCC | Rak płaskonabłonkowy |

---

## 5. Wyzwania w CAD

### 5.1. Nierównowaga klas (*Class Imbalance*)

W danych medycznych klasy patologiczne są zazwyczaj rzadkie (np. 1–5% przypadków to nowotwór).

```python
# Techniki radzenia sobie z nierównowagą klas

# 1. Ważenie klas w funkcji straty
import torch
import torch.nn as nn

class_counts = torch.tensor([950.0, 50.0])   # 950 zdrowych, 50 chorych
class_weights = 1.0 / class_counts
class_weights = class_weights / class_weights.sum()
criterion = nn.CrossEntropyLoss(weight=class_weights)

# 2. Focal Loss (Lin et al., 2017) - tłumi łatwe przykłady
class FocalLoss(nn.Module):
    def __init__(self, gamma=2.0, alpha=0.25):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha

    def forward(self, inputs, targets):
        bce_loss = nn.functional.binary_cross_entropy_with_logits(
            inputs, targets.float(), reduction='none'
        )
        probs = torch.sigmoid(inputs)
        pt = torch.where(targets == 1, probs, 1 - probs)
        focal_weight = self.alpha * (1 - pt) ** self.gamma
        return (focal_weight * bce_loss).mean()

# 3. SMOTE / augmentacja danych dla klasy mniejszościowej
def augment_minority_class(images, labels, target_ratio=0.3):
    """Prosta augmentacja przez losowe transformacje geometryczne."""
    minority_idx = (labels == 1).nonzero(as_tuple=True)[0]
    minority_images = images[minority_idx]
    augmented = []
    for img in minority_images:
        # Losowa rotacja, flip, jasność
        augmented.append(torch.flip(img, dims=[-1]))   # flip poziomy
    return torch.cat([images, torch.stack(augmented)]), \
           torch.cat([labels, torch.ones(len(augmented), dtype=labels.dtype)])
```

### 5.2. Ograniczone dane etykietowane

Dane medyczne wymagają kosztownej adnotacji przez ekspertów. Podejścia:

- **Transfer learning**: cechy z ImageNet lub innych dużych zbiorów
- **Self-supervised learning**: MAE, SimCLR na danych bez etykiet
- **Semi-supervised learning**: pseudo-labels dla danych bez etykiet
- **Few-shot learning**: klasyfikacja przy bardzo małej liczbie przykładów
- **Synthetic data augmentation**: GAN dla generowania syntetycznych obrazów

### 5.3. Interpretowalność (*Explainability*)

CAD jako narzędzie medyczne musi być interpretowalny. Kluczowe metody:

#### Grad-CAM (*Gradient-weighted Class Activation Mapping*)

```python
import torch
import torch.nn.functional as F
import numpy as np

class GradCAM:
    """
    Implementacja Grad-CAM dla wizualizacji aktywacji modelu CNN.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx=None):
        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = output.argmax(dim=1)

        self.model.zero_grad()
        one_hot = torch.zeros_like(output)
        one_hot[0, class_idx] = 1
        output.backward(gradient=one_hot, retain_graph=True)

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, input_tensor.shape[2:], mode='bilinear', align_corners=False)
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam
```

#### LIME (*Local Interpretable Model-agnostic Explanations*)

LIME perturbuje obraz wejściowy i uczy lokalnego modelu liniowego, identyfikując piksele kluczowe dla klasyfikacji.

---

## 6. Federated Learning dla prywatności

### 6.1. Problem centralnego uczenia

Centralizacja danych medycznych z wielu szpitali napotyka bariery:
- Przepisy o ochronie danych (RODO, HIPAA)
- Tajemnica lekarska
- Lokalizacja danych (*data sovereignty*)

### 6.2. Federated Learning

*Federated Learning* (McMahan et al., 2017) pozwala trenować modele bez przesyłania danych:

```python
# Koncepcja Federated Averaging (FedAvg)
class FederatedServer:
    def __init__(self, global_model):
        self.global_model = global_model

    def aggregate(self, client_weights, client_sizes):
        """Ważone uśrednienie wag z klientów (FedAvg)."""
        total_samples = sum(client_sizes)
        aggregated = {}
        for key in client_weights[0].keys():
            weighted_sum = sum(
                w[key] * (n / total_samples)
                for w, n in zip(client_weights, client_sizes)
            )
            aggregated[key] = weighted_sum
        self.global_model.load_state_dict(aggregated)
        return self.global_model


class FederatedClient:
    def __init__(self, local_model, local_data, hospital_id):
        self.model = local_model
        self.data = local_data   # dane NIGDY nie opuszczają szpitala
        self.id = hospital_id

    def train_local(self, global_weights, n_epochs=5, lr=0.001):
        """Lokalny trening na danych szpitala."""
        self.model.load_state_dict(global_weights)
        optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        for _ in range(n_epochs):
            for batch in self.data:
                # lokalny gradient descent
                pass
        return self.model.state_dict(), len(self.data)
```

Rozszerzenia: **Differential Privacy** (dodawanie szumu do gradientów), **Secure Aggregation** (kryptograficzne uśrednianie).

---

## 7. Metryki oceny systemów CAD

### 7.1. Podstawowe metryki

```python
import numpy as np
from sklearn import metrics

def compute_cad_metrics(y_true, y_pred_proba, threshold=0.5):
    """
    Oblicza kompletny zestaw metryk dla systemu CAD.
    y_true: ground truth (0/1)
    y_pred_proba: prawdopodobieństwa klasy pozytywnej
    """
    y_pred = (y_pred_proba >= threshold).astype(int)

    tn, fp, fn, tp = metrics.confusion_matrix(y_true, y_pred).ravel()

    sensitivity = tp / (tp + fn)   # recall, czułość
    specificity = tn / (tn + fp)   # swoistość
    ppv = tp / (tp + fp)           # precyzja, positive predictive value
    npv = tn / (tn + fn)           # negative predictive value
    accuracy = (tp + tn) / (tp + tn + fp + fn)
    f1 = 2 * tp / (2 * tp + fp + fn)

    auc_roc = metrics.roc_auc_score(y_true, y_pred_proba)
    auc_pr = metrics.average_precision_score(y_true, y_pred_proba)

    return {
        'Sensitivity (Recall)': sensitivity,
        'Specificity': specificity,
        'PPV (Precision)': ppv,
        'NPV': npv,
        'Accuracy': accuracy,
        'F1-Score': f1,
        'AUC-ROC': auc_roc,
        'AUC-PR': auc_pr,
    }
```

### 7.2. Metryki segmentacji

```python
def dice_coefficient(y_pred, y_true, smooth=1e-6):
    """
    Wskaźnik Dice'a / F1 dla segmentacji.
    Wartości bliskie 1.0 oznaczają doskonałą segmentację.
    """
    intersection = (y_pred * y_true).sum()
    return (2 * intersection + smooth) / (y_pred.sum() + y_true.sum() + smooth)

def iou_score(y_pred, y_true, smooth=1e-6):
    """Intersection over Union (Jaccard Index)."""
    intersection = (y_pred * y_true).sum()
    union = y_pred.sum() + y_true.sum() - intersection
    return (intersection + smooth) / (union + smooth)

def hausdorff_distance_95(pred_mask, true_mask):
    """95. percentyl odległości Hausdorffa - wrażliwy na błędy konturów."""
    from scipy.spatial.distance import directed_hausdorff
    pred_pts = np.argwhere(pred_mask)
    true_pts = np.argwhere(true_mask)
    if len(pred_pts) == 0 or len(true_pts) == 0:
        return float('inf')
    d1 = directed_hausdorff(pred_pts, true_pts)[0]
    d2 = directed_hausdorff(true_pts, pred_pts)[0]
    return max(d1, d2)
```

### 7.3. Krzywa FROC (*Free-Response ROC*)

Dla zadań detekcji (CADe) używa się krzywej FROC zamiast ROC:
- Oś X: średnia liczba fałszywych pozytywy na obraz
- Oś Y: czułość (sensitivity)

---

## 8. Aspekty regulacyjne

### 8.1. Klasyfikacja wyrobów medycznych

Systemy CAD jako oprogramowanie wyrobu medycznego (*Software as a Medical Device*, SaMD) podlegają regulacjom:

| Region | Prawo / Organ | Klasa ryzyka | Wymagany proces |
|---|---|---|---|
| USA | FDA / 21 CFR | Class II (większość CAD) | 510(k) Premarket Notification |
| UE | MDR 2017/745 | IIa / IIb | CE marking, ocena zgodności |
| UK (post-Brexit) | UKCA | Podobnie do MDR | UKCA marking |
| Kanada | Health Canada | Class II / III | Medical Device Licence |

### 8.2. Proces FDA 510(k)

Ścieżka 510(k) wymaga wykazania **istotnej równoważności** (*substantial equivalence*) z już dopuszczonym wyrobem. Kluczowe elementy zgłoszenia:

1. Opis wyrobu i przewidzianego zastosowania
2. Charakterystyka algorytmu (trening, walidacja, testowanie)
3. Dane wydajnościowe (reader study)
4. Analiza ryzyka
5. Cybersecurity considerations

### 8.3. Algorytmiczne zmiany po dopuszczeniu

FDA wyróżnia:
- **Locked algorithms**: nie zmieniają się po wdrożeniu → jednorazowa walidacja
- **Adaptive algorithms**: uczą się po wdrożeniu → wymagają dodatkowych mechanizmów nadzoru

---

## 9. Mobilne aplikacje CAD

### 9.1. Przegląd aplikacji

| Aplikacja | Zastosowanie | Platforma | Status regulacyjny |
|---|---|---|---|
| Ada Health | Diagnostyka ogólna (symptom checker) | iOS/Android | Medical device (EU) |
| SkinVision | Klasyfikacja zmian skórnych | iOS/Android | CE Class IIa |
| DermAssist (Google) | Detekcja chorób skóry | Android (pilot) | Research / limited |
| EyeArt | Skrining retinopatii na funduskopie | iOS | FDA cleared (2020) |
| Viz.ai | Detekcja udaru w CT | iOS | FDA cleared |
| Lunit INSIGHT | RTG klatki piersiowej | Cloud/mobile | FDA cleared, CE |

### 9.2. Architektura mobilnego CAD

```python
# Koncepcja mobilnego systemu CAD (TensorFlow Lite / Core ML)

class MobileCADSystem:
    """
    Architektura mobilnego systemu CAD.
    Inference na urządzeniu dla prywatności i szybkości.
    """
    def __init__(self, model_path, threshold=0.5):
        self.threshold = threshold
        # W praktyce: tflite.Interpreter lub coreml.MLModel
        self.model = self._load_model(model_path)

    def _load_model(self, path):
        """Wczytanie zoptymalizowanego modelu (int8 quantization)."""
        # import tflite_runtime.interpreter as tflite
        # interpreter = tflite.Interpreter(model_path=path)
        # interpreter.allocate_tensors()
        # return interpreter
        pass

    def preprocess_image(self, image_array):
        """Preprocessing obrazu zgodny z wymogami modelu."""
        import numpy as np
        img = np.array(image_array, dtype=np.float32)
        img = img / 255.0   # normalizacja [0, 1]
        img = (img - 0.485) / 0.229   # ImageNet stats
        img = np.expand_dims(img, axis=0)   # batch dimension
        return img

    def predict(self, image_array):
        """Inference i interpretacja wyników."""
        preprocessed = self.preprocess_image(image_array)
        # output = self.model.predict(preprocessed)
        output = {"probability": 0.72, "finding": "Podejrzana zmiana"}   # stub
        result = {
            "probability": output["probability"],
            "positive": output["probability"] >= self.threshold,
            "confidence": "high" if abs(output["probability"] - 0.5) > 0.3 else "low",
            "recommendation": self._get_recommendation(output["probability"])
        }
        return result

    def _get_recommendation(self, prob):
        if prob >= 0.8:
            return "Pilna konsultacja specjalistyczna"
        elif prob >= 0.5:
            return "Zalecana konsultacja w ciągu 2–4 tygodni"
        else:
            return "Rutynowa kontrola za 12 miesięcy"


# Optymalizacja modelu dla urządzeń mobilnych
def quantize_model_for_mobile(model, representative_dataset):
    """
    Post-training quantization (PTQ): float32 → int8
    Redukcja rozmiaru ~4x, przyspieszenie ~2-3x.
    """
    import tensorflow as tf
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8
    tflite_model = converter.convert()
    return tflite_model
```

### 9.3. Prywatność w mobilnym CAD

Przetwarzanie on-device minimalizuje ryzyko naruszenia prywatności:

- Dane nie opuszczają urządzenia
- Brak wymagań na połączenie z Internetem
- Zgodność z RODO bez konieczności anonimizacji

Kompromis: mniejszy model = niższa czułość / swoistość.

---

## 10. Fundament naukowy: przykład end-to-end

### 10.1. Pełny pipeline w Keras/TensorFlow

```python
import tensorflow as tf
from tensorflow import keras
import numpy as np

def create_binary_cad_model(input_shape=(224, 224, 3)):
    """
    Binary CAD model (np. zdrowy / chory).
    Transfer learning z MobileNetV3.
    """
    base = keras.applications.MobileNetV3Small(
        input_shape=input_shape,
        include_top=False,
        weights='imagenet'
    )
    base.trainable = False   # freeze backbone

    model = keras.Sequential([
        base,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(1, activation='sigmoid')
    ])
    return model


def compile_and_train(model, train_ds, val_ds, epochs=20):
    """Kompilacja z metrykami klinicznymi i trening."""
    model.compile(
        optimizer=keras.optimizers.Adam(1e-4),
        loss='binary_crossentropy',
        metrics=[
            keras.metrics.AUC(name='auc_roc', curve='ROC'),
            keras.metrics.AUC(name='auc_pr', curve='PR'),
            keras.metrics.Recall(name='sensitivity'),
            keras.metrics.Precision(name='ppv'),
        ]
    )

    callbacks = [
        keras.callbacks.EarlyStopping(monitor='val_auc_roc', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3),
    ]

    return model.fit(train_ds, validation_data=val_ds,
                     epochs=epochs, callbacks=callbacks)
```

---

## 11. Podsumowanie

CAD jest dynamicznie rozwijającą się dziedziną, w której głębokie uczenie osiągnęło poziom ekspercki lub go przekroczyło w wąskich zadaniach. Kluczowe wyzwania pozostają natury technicznej (brak danych, interpretowalność), regulacyjnej (walidacja kliniczna, FDA/CE) i etycznej (odpowiedzialność za błędy, bias algorytmiczny). Mobilne CAD democratyzują dostęp do diagnostyki, szczególnie w krajach o ograniczonym dostępie do specjalistów.

## Literatura

1. Doi, K. (2007). Computer-aided diagnosis in medical imaging. *European Journal of Radiology*, 61(2).
2. He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning. *CVPR*.
3. Ronneberger, O., Fischer, P., & Brox, T. (2015). U-Net. *MICCAI*.
4. Selvaraju, R. R. et al. (2017). Grad-CAM. *ICCV*.
5. McMahan, B. et al. (2017). Communication-efficient learning of deep networks from decentralized data. *AISTATS*.
6. Lin, T.-Y. et al. (2017). Focal loss for dense object detection. *ICCV*.
7. Litjens, G. et al. (2017). A survey on deep learning in medical image analysis. *Medical Image Analysis*, 42.
8. FDA (2021). Artificial Intelligence/Machine Learning-Based Software as a Medical Device Action Plan.
9. Huang, G. et al. (2017). Densely connected convolutional networks. *CVPR*.

## Powiązane artykuły

- [Obliczeniowe modelowanie poznania](computational-cognition.md)
- [Modele kognitywne](cognitive-models.md)
- [Robotyka kognitywna](cognitive-robotics.md)
- [Reprezentacja wiedzy](knowledge-representation.md)
- [Inteligentny agent](intelligent-agent.md)
- [Przetwarzanie obrazu AI](ai-image-processing.md)
- [Sieci neuronowe w mobile](neural-networks-mobile.md)
