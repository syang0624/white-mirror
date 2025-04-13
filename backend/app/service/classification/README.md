# Manipulative Message Classifier

A Python-based machine learning pipeline for detecting manipulative language in dialogue. This model not only identifies whether a message is manipulative, but also classifies the techniques used and the psychological vulnerabilities being targeted.

---

## 🔧 Technical Overview

### 🧠 Model Architecture

The classifier includes **three separate models**:

1. **Binary Manipulation Classifier**  
   Predicts whether a message is manipulative (`0` or `1`) using:

    - `TfidfVectorizer` for text preprocessing
    - `LogisticRegression` with `class_weight='balanced'` for handling imbalance

2. **Multi-label Technique Classifier**  
   Predicts one or more manipulation techniques if the message is manipulative:

    - Uses the same `TfidfVectorizer`
    - Wrapped with `MultiOutputClassifier(LogisticRegression)` for multi-label support

3. **Multi-label Vulnerability Classifier**  
   Identifies psychological vulnerabilities exploited in the message:
    - Same pipeline and approach as the technique classifier

All models are built using **scikit-learn pipelines**, enabling streamlined vectorization, training, and prediction.

### 🏗️ How It Works

#### 1. **Preprocessing & Label Aggregation**

-   Annotated data contains individual labels from 3 annotators.
-   A binary label is computed via **majority vote**.
-   Techniques and vulnerabilities are **combined and deduplicated** per message.
-   Both techniques and vulnerabilities are **multi-label encoded**.

#### 2. **TF-IDF Vectorization**

-   Input text is tokenized using n-grams (1-grams and 2-grams).
-   The top 5000 features are retained for model input.

#### 3. **Classification**

-   Each model is trained using the TF-IDF features.
-   For multi-label classification, predictions are made per label and thresholded (implicitly by logistic regression).

---

## ⚙️ Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/manipulative-message-classifier.git
cd manipulative-message-classifier
```

### 2. Install Dependencies

#### Option A: Using `requirements.txt`

```bash
pip install -r requirements.txt
```

#### Option B: Manually

```bash
pip install pandas numpy scikit-learn
```

---

## 🏁 Training

### Dataset Format

The CSV file should include the following columns for each of the 3 annotators:

| dialogue | manipulative_1 | technique_1 | vulnerability_1 | ... |
| -------- | -------------- | ----------- | --------------- | --- |

### Train the Classifier

```bash
python main.py
```

Example from within `main.py`:

```python
classifier = ManipulativeMessageClassifier()
classifier.train("data/mentalmanip_detailed_expanded.csv")
classifier.save_model("manipulative_classifier.pkl")
```

Training prints accuracy for:

-   Binary classification (`accuracy_score`, `classification_report`)
-   Technique classifier (`exact match accuracy`)
-   Vulnerability classifier is trained but currently not evaluated in detail.

---

## 🔍 Inference / Prediction

### Load Model and Predict

```python
classifier = ManipulativeMessageClassifier()
classifier.load_model("manipulative_classifier.pkl")

message = "If you don't help me, I'll lose everything."
prediction = classifier.predict(message)

print(prediction)
```

### Example Output

```json
{
    "is_manipulative": true,
    "techniques": ["Guilt Tripping", "Fear Appeal"],
    "vulnerabilities": ["Fear of Loss"]
}
```

---

## 📦 Model Persistence

### Save Trained Model

```python
classifier.save_model("manipulative_classifier.pkl")
```

### Load Model

```python
classifier.load_model("manipulative_classifier.pkl")
```

Saved model includes:

-   Trained pipelines (binary, technique, vulnerability)
-   Label lists (for inverse mapping)

Uses `pkl` for efficient serialization of large objects.

---

## 📈 Evaluation

Metrics during training:

-   **Binary Classifier**
    -   Accuracy
    -   Precision, Recall, F1 (per class)
-   **Technique Classifier**
    -   Exact match accuracy (i.e., full multi-label match)
-   **Vulnerability Classifier**
    -   Currently trained but not evaluated — extendable via `classification_report` or `hamming_loss`.

---

## 🔒 Limitations & Future Work

-   Assumes balanced classes are handled by `class_weight='balanced'`.
-   Assumes messages are in English and pre-cleaned.
-   Vulnerability classifier evaluation can be extended.
-   Consider upgrading to transformer-based models (e.g. BERT) for better performance on subtle cues.

---

## 📝 License

This project is licensed under the MIT License.  
Feel free to use, modify, and contribute!

---

Would you like me to generate a sample dataset and `requirements.txt` to go along with this as well?
