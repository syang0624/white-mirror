from app.service.classification.classifier import ManipulativeMessageClassifier
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "service" / "classification" / "manipulative_classifier.pkl"

classifier = ManipulativeMessageClassifier()
classifier.load_model(str(MODEL_PATH))

if __name__ == "__main__":
    message = "You don't have a choice. Do it now, or there will be consequences."
    result = classifier.predict(message)
    print(result)