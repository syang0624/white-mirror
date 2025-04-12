import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

class ManipulativeMessageClassifier:
    def __init__(self):
        self.binary_classifier = None
        self.technique_classifier = None
        self.technique_labels = None
        self.vulnerability_labels = None
        
    def load_data(self, file_path):
        """Load and preprocess the dataset."""
        # Load the data
        df = pd.read_csv(file_path)
        
        # Extract dialogues
        X = df['dialogue'].values
        
        # Create binary manipulation labels (majority vote)
        y_binary = []
        for i in range(len(X)):
            votes = [
                df.loc[i, 'manipulative_1'],
                df.loc[i, 'manipulative_2'],
                df.loc[i, 'manipulative_3']
            ]
            y_binary.append(1 if sum(votes) >= 2 else 0)
        
        # Extract techniques and create multi-label encoding
        all_techniques = set()
        techniques_per_dialogue = []
        
        for i in range(len(X)):
            dialogue_techniques = set()
            
            # Combine techniques from all annotators
            for annotator in [1, 2, 3]:
                col = f'technique_{annotator}'
                if col in df.columns and pd.notna(df.loc[i, col]) and df.loc[i, f'manipulative_{annotator}'] == 1:
                    techniques = str(df.loc[i, col]).split(',')
                    techniques = [t.strip() for t in techniques if t.strip()]
                    dialogue_techniques.update(techniques)
                    all_techniques.update(techniques)
            
            techniques_per_dialogue.append(list(dialogue_techniques))
        
        # Sort techniques to ensure consistent order
        self.technique_labels = sorted(list(all_techniques))
        
        # Create multi-label encoding for techniques
        y_techniques = np.zeros((len(X), len(self.technique_labels)))
        for i, techniques in enumerate(techniques_per_dialogue):
            for technique in techniques:
                if technique in self.technique_labels:
                    y_techniques[i, self.technique_labels.index(technique)] = 1
        
        # Extract vulnerabilities and create multi-label encoding
        all_vulnerabilities = set()
        vulnerabilities_per_dialogue = []
        
        for i in range(len(X)):
            dialogue_vulnerabilities = set()
            
            # Combine vulnerabilities from all annotators
            for annotator in [1, 2, 3]:
                col = f'vulnerability_{annotator}'
                if col in df.columns and pd.notna(df.loc[i, col]) and df.loc[i, f'manipulative_{annotator}'] == 1:
                    vulnerabilities = str(df.loc[i, col]).split(',')
                    vulnerabilities = [v.strip() for v in vulnerabilities if v.strip()]
                    dialogue_vulnerabilities.update(vulnerabilities)
                    all_vulnerabilities.update(vulnerabilities)
            
            vulnerabilities_per_dialogue.append(list(dialogue_vulnerabilities))
        
        # Sort vulnerabilities to ensure consistent order
        self.vulnerability_labels = sorted(list(all_vulnerabilities))
        
        # Create multi-label encoding for vulnerabilities
        y_vulnerabilities = np.zeros((len(X), len(self.vulnerability_labels)))
        for i, vulnerabilities in enumerate(vulnerabilities_per_dialogue):
            for vulnerability in vulnerabilities:
                if vulnerability in self.vulnerability_labels:
                    y_vulnerabilities[i, self.vulnerability_labels.index(vulnerability)] = 1
        
        return X, y_binary, y_techniques, y_vulnerabilities
    
    def train(self, file_path):
        """Train the classifiers."""
        X, y_binary, y_techniques, y_vulnerabilities = self.load_data(file_path)
        
        # Split the data
        X_train, X_test, y_binary_train, y_binary_test, y_techniques_train, y_techniques_test, y_vulnerabilities_train, y_vulnerabilities_test = train_test_split(
            X, y_binary, y_techniques, y_vulnerabilities, test_size=0.2, random_state=42
        )
        
        # Create and train the binary classifier
        self.binary_classifier = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
        ])
        self.binary_classifier.fit(X_train, y_binary_train)
        
        # Evaluate binary classifier
        y_binary_pred = self.binary_classifier.predict(X_test)
        binary_accuracy = accuracy_score(y_binary_test, y_binary_pred)
        print(f"Binary Classifier Accuracy: {binary_accuracy:.4f}")
        print("Binary Classification Report:")
        print(classification_report(y_binary_test, y_binary_pred))
        
        # Create and train the technique classifier
        self.technique_classifier = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('clf', MultiOutputClassifier(LogisticRegression(max_iter=1000, class_weight='balanced')))
        ])
        self.technique_classifier.fit(X_train, y_techniques_train)
        
        # Evaluate technique classifier
        y_techniques_pred = self.technique_classifier.predict(X_test)
        technique_accuracy = np.mean([(y_techniques_test[i] == y_techniques_pred[i]).all() for i in range(len(y_techniques_test))])
        print(f"Technique Classifier Exact Match Accuracy: {technique_accuracy:.4f}")
        
        # Create and train the vulnerability classifier
        self.vulnerability_classifier = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('clf', MultiOutputClassifier(LogisticRegression(max_iter=1000, class_weight='balanced')))
        ])
        self.vulnerability_classifier.fit(X_train, y_vulnerabilities_train)
        
        return {
            'binary_accuracy': binary_accuracy,
            'technique_accuracy': technique_accuracy
        }
    
    def predict(self, message):
        """Predict if a message is manipulative and identify techniques."""
        if not self.binary_classifier or not self.technique_classifier:
            raise ValueError("Model not trained. Call train() first.")
        
        # Predict if the message is manipulative
        is_manipulative = self.binary_classifier.predict([message])[0]
        
        result = {
            "is_manipulative": bool(is_manipulative),
            "techniques": [],
            "vulnerabilities": []
        }
        
        # If manipulative, identify techniques and vulnerabilities
        if is_manipulative:
            technique_preds = self.technique_classifier.predict([message])[0]
            vulnerability_preds = self.vulnerability_classifier.predict([message])[0]
            
            # Extract predicted techniques
            for i, pred in enumerate(technique_preds):
                if pred > 0:
                    result["techniques"].append(self.technique_labels[i])
            
            # Extract predicted vulnerabilities
            for i, pred in enumerate(vulnerability_preds):
                if pred > 0:
                    result["vulnerabilities"].append(self.vulnerability_labels[i])
        
        return result
    
    def save_model(self, file_path):
        """Save the trained model to a file."""
        model_data = {
            'binary_classifier': self.binary_classifier,
            'technique_classifier': self.technique_classifier,
            'vulnerability_classifier': self.vulnerability_classifier,
            'technique_labels': self.technique_labels,
            'vulnerability_labels': self.vulnerability_labels
        }
        joblib.dump(model_data, file_path)
    
    def load_model(self, file_path):
        """Load a trained model from a file."""
        model_data = joblib.load(file_path)
        self.binary_classifier = model_data['binary_classifier']
        self.technique_classifier = model_data['technique_classifier']
        self.vulnerability_classifier = model_data['vulnerability_classifier']
        self.technique_labels = model_data['technique_labels']
        self.vulnerability_labels = model_data['vulnerability_labels']


# Example usage
if __name__ == "__main__":
    # Path to your dataset
    dataset_path = "data/mentalmanip_detailed_expanded.csv"
    
    # Initialize and train the classifier
    classifier = ManipulativeMessageClassifier()
    
    # Train the model
    print("Training the model...")
    metrics = classifier.train(dataset_path)
    print(f"Training complete. Binary accuracy: {metrics['binary_accuracy']:.4f}")
    
    # Save the model
    # classifier.save_model("manipulative_classifier.joblib")
    # print("Model saved to 'manipulative_classifier.joblib'")
    classifier.save_model("manipulative_classifier.pkl")
    print("Model saved to 'manipulative_classifier.pkl'")
    
    # Example predictions
    test_messages = [
        "I need your help with something important right now. If you don't help me, I'll lose everything.",
        "Would you like to meet for coffee tomorrow to discuss the project?",
        "You should trust me on this investment. Everyone else is making money, and you'll be left out if you don't act now."
    ]
    
    print("\nTesting the model with example messages:")
    for message in test_messages:
        result = classifier.predict(message)
        print(f"\nMessage: '{message}'")
        print(f"Is manipulative: {result['is_manipulative']}")
        if result['is_manipulative']:
            print(f"Techniques: {', '.join(result['techniques'])}")
            print(f"Vulnerabilities: {', '.join(result['vulnerabilities'])}")