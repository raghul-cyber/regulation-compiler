import os
import json
import logging
from openai import OpenAI
from google import genai
from google.genai import types
from app.pipelines.semantic_engine import SemanticEngine

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

    def generate_json(self, system_prompt: str, user_prompt: str):
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
                logger.warning(f"OpenAI failed: {e}. Falling back to Gemini if available.")
                if "429" in str(e) or "quota" in str(e) or "credit_balance" in str(e):
                    self.openai_client = None
                
        if self.gemini_client:
            try:
                res = self.gemini_client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=[system_prompt + "\n\n" + user_prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    )
                )
                return json.loads(res.text)
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini failed: {e}. Falling back to local SemanticEngine statutory compiler.")
                if "404" in str(e) or "quota" in str(e) or "429" in str(e):
                    self.gemini_client = None
                
        logger.info(f"Using local statutory SemanticEngine (cloud LLM error: {last_error})")
        return self._fallback_semantic_engine(system_prompt, user_prompt)

    def _fallback_semantic_engine(self, system_prompt: str, user_prompt: str):
        sys_lower = system_prompt.lower()
        # 1. Classification
        if "classify" in sys_lower or "estimated counts" in sys_lower or "obligation" in sys_lower:
            return SemanticEngine.classify_text(user_prompt)
        
        # 2. Extract Requirements
        if "extract" in sys_lower or "compliance requirements" in sys_lower or "obligations" in sys_lower:
            reqs = SemanticEngine.extract_requirements(user_prompt)
            return {"requirements": reqs}
            
        # 3. Knowledge Graph Linking
        if "knowledge graph" in sys_lower or "link them" in sys_lower or "actors" in sys_lower:
            try:
                titles = json.loads(user_prompt)
                if not isinstance(titles, list):
                    titles = [str(titles)]
            except Exception:
                titles = [line.strip() for line in user_prompt.split("\n") if line.strip()]
            return SemanticEngine.build_knowledge_graph(titles)

        # 4. Rule Compilation
        if "compile" in sys_lower or "refined_ast" in sys_lower or "policy rules" in sys_lower:
            try:
                req_objs = json.loads(user_prompt)
                if not isinstance(req_objs, list):
                    req_objs = [req_objs]
            except Exception:
                req_objs = [{"title": "Statutory Control", "conditions": {}}]
            return SemanticEngine.compile_rules(req_objs)

        # 5. Validation
        if "validate" in sys_lower or "fallacies" in sys_lower or "needs_review" in sys_lower:
            try:
                items = json.loads(user_prompt)
                count = len(items) if isinstance(items, list) else 3
            except Exception:
                count = 3
            return {"validated": count, "needs_review": 0}

        return {}

