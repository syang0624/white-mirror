import pandas as pd
import openai
import random
import time

# Load original data
df = pd.read_csv("mentalmanip_detailed.csv")

# Target total
TARGET = 10000
CURRENT = len(df)
NEEDED = TARGET - CURRENT

# OpenAI API key setup
openai.api_key = "sk-..."  # 🔐 Replace with your key or load from env

# Function to call OpenAI to generate synthetic text
def generate_llm_text(prompt, model="gpt-3.5-turbo"):
    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that paraphrases text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=150
        )
        return response.choices[0].message["content"].strip()
    except Exception as e:
        print(f"Error: {e}")
        return None

# Sample and augment
augmented_rows = []

for _ in range(NEEDED):
    row = df.sample(1).iloc[0].copy()
    
    if 'text' in df.columns:
        original = row['text']
        prompt = f"Paraphrase the following sentence while preserving its meaning:\n\"{original}\""
        new_text = generate_llm_text(prompt)
        row['text'] = new_text if new_text else original
    
    augmented_rows.append(row)
    time.sleep(1)  # to avoid hitting rate limits (adjust as needed)

# Combine original + synthetic
aug_df = pd.DataFrame(augmented_rows)
full_df = pd.concat([df, aug_df], ignore_index=True).sample(frac=1).reset_index(drop=True)

# Save to file
full_df.to_csv("mentalmanip_10000_llm.csv", index=False)
