import os
import json
import logging
from openai import OpenAI
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class LLMWrapper:
    def __init__(self, openai_key=None, gemini_key=None):
        self.openai_client = None
        self.gemini_client = None
        
        if openai_key:
            try:
                self.openai_client = OpenAI(api_key=openai_key)
            except Exception as e:
                logger.error(f"Failed to init OpenAI: {e}")
                
        if gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=gemini_key)
            except Exception as e:
                logger.error(f"Failed to init Gemini: {e}")

    def generate_json(self, system_prompt, user_prompt):
        last_error = None
        if self.openai_client:
            try:
                res = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={ "type": "json_object" }
                )
                return json.loads(res.choices[0].message.content)
            except Exception as e:
                last_error = e
                logger.error(f"OpenAI failed: {e}. Falling back to Gemini if available.")
                
        if self.gemini_client:
            try:
                res = self.gemini_client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=[system_prompt + "\n\n" + user_prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    )
                )
                return json.loads(res.text)
            except Exception as e:
                last_error = e
                logger.error(f"Gemini failed: {e}")
                
        raise Exception(f"No valid LLM client or quota available. Please check OPENAI_API_KEY or GEMINI_API_KEY. Last error: {last_error}")
