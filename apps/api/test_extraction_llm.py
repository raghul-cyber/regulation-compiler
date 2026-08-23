import os
import sys
from dotenv import load_dotenv

# Load from root .env
load_dotenv("../../.env")
load_dotenv("../.env")
load_dotenv(".env")

from openai import OpenAI
import json

api_key = os.getenv("OPENAI_API_KEY")
print(f"API Key found: {api_key is not None}")

client = OpenAI(api_key=api_key)
try:
    print("Testing LLM...")
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a test bot. Return a JSON with {\"status\": \"ok\"}"},
            {"role": "user", "content": "Hello"}
        ],
        response_format={ "type": "json_object" }
    )
    print("Response:", response.choices[0].message.content)
except Exception as e:
    print("Error:", str(e))
