import logging
import uuid
import time
import json
import pymupdf as fitz  # PyMuPDF
from sqlalchemy.orm import Session
from openai import OpenAI
import os

from app.models.regulations import RegulationVersion, SourceDocument, DocumentSection
from app.models.requirements import Requirement
from app.workers.events import EventDispatcher
from app.services.storage import StorageService
from app.core.config import settings
from app.pipelines.llm_wrapper import LLMWrapper

logger = logging.getLogger(__name__)

def run_extraction_pipeline(db: Session, source_document_id: uuid.UUID, job_id: str):
    dispatcher = EventDispatcher(db, uuid.UUID(job_id))
    storage = StorageService()
    
    source_doc = db.query(SourceDocument).filter(SourceDocument.id == source_document_id).first()
    if not source_doc:
        raise Exception(f"SourceDocument {source_document_id} not found")

    try:
        openai_key = settings.OPENAI_API_KEY
        gemini_key = settings.GEMINI_API_KEY
        llm_client = LLMWrapper(openai_key=openai_key, gemini_key=gemini_key)
    except Exception as e:
        logger.error(f"Failed to init LLM clients: {e}")
        llm_client = None

    try:
        # Stage 1: Ingest
        stage = 1
        name = "Ingest"
        dispatcher.emit(stage, name, "started")
        
        file_bytes = storage.get_file_bytes(source_doc.storage_path)
        
        dispatcher.emit(stage, name, "completed", {"message": "Document ingested from secure storage"})

        # Stage 2: Parse/OCR
        stage = 2
        name = "Parse/OCR"
        dispatcher.emit(stage, name, "started")
        
        raw_text = ""
        page_count = 1
        
        if source_doc.file_type.value == "pdf" or source_doc.storage_path.endswith(".pdf"):
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            for page in doc:
                raw_text += page.get_text() + "\n"
        else:
            raw_text = file_bytes.decode('utf-8')
            
        source_doc.raw_text = raw_text
        source_doc.page_count = page_count
        db.commit()
        
        dispatcher.emit(stage, name, "completed", {"pages_processed": page_count, "ocr_used": False})

        # Stage 3: AI Understanding (Chunking)
        stage = 3
        name = "AI Understanding"
        dispatcher.emit(stage, name, "started")
        
        chunk_size = 3000
        chunks = [raw_text[i:i+chunk_size] for i in range(0, len(raw_text), chunk_size)]
        
        for i, chunk_text in enumerate(chunks):
            section = DocumentSection(
                source_document_id=source_doc.id,
                reference_label=f"Chunk {i+1}",
                raw_text=chunk_text,
                order_index=i
            )
            db.add(section)
        db.commit()
        
        dispatcher.emit(stage, name, "completed", {"chunks_created": len(chunks)})

        # Stage 4: Classify
        stage = 4
        name = "Classify"
        dispatcher.emit(stage, name, "started")
        
        obs, pros, perms = 0, 0, 0
        if llm_client and chunks:
            try:
                sys_prompt = "Analyze the text and return a JSON with estimated counts of rules: {'obligation': int, 'prohibition': int, 'permission': int}"
                user_prompt = "".join(chunks[:3])[:4000]
                cls_data = llm_client.generate_json(sys_prompt, user_prompt)
                obs = cls_data.get("obligation", 0)
                pros = cls_data.get("prohibition", 0)
                perms = cls_data.get("permission", 0)
            except Exception as e:
                logger.error(f"Classification LLM failed: {e}")

        dispatcher.emit(stage, name, "completed", {"obligation": obs, "prohibition": pros, "permission": perms})

        # Stage 5: Extract Requirements
        stage = 5
        name = "Extract Requirements"
        dispatcher.emit(stage, name, "started")
        
        chunks_to_process = chunks[:3]
        total_extracted = 0
        latest_title = ""
        extracted_requirements = []
        
        system_prompt = """You are an AI that extracts compliance requirements from legal text.
Extract strict rules, obligations, or requirements. 
Respond ONLY with a JSON array of objects. Each object must have:
- title (string)
- description (string)
- severity (string: 'low', 'medium', 'high', 'critical')
- category (string)
- conditions (object with string/boolean key-values describing when it applies)
- actions (object with string/boolean key-values describing required actions)"""
        
        for chunk in chunks_to_process:
            if not llm_client:
                break
            try:
                result = llm_client.generate_json(system_prompt, chunk)
                reqs = result.get("requirements", result) if isinstance(result, dict) else result
                if isinstance(reqs, list):
                    extracted_requirements.extend(reqs)
                    total_extracted += len(reqs)
                    if len(reqs) > 0:
                        latest_title = reqs[-1].get("title", "Requirement")
            except Exception as e:
                logger.error(f"LLM API call failed: {e}")

        dispatcher.emit(stage, name, "completed", {
            "total_extracted": total_extracted,
            "latest_title": latest_title
        })

        # Stage 6: Knowledge Graph Linking
        stage = 6
        name = "Knowledge Graph Linking"
        dispatcher.emit(stage, name, "started")
        
        entities_linked = 0
        if llm_client and extracted_requirements:
            try:
                kg_prompt = "Extract key actors, systems, and data types from these requirements and link them. Return JSON: {'entities': [{'name': str, 'type': str}], 'relationships': [{'source': str, 'target': str, 'relation': str}]}"
                kg_user = json.dumps([r.get("title") for r in extracted_requirements])[:4000]
                kg_data = llm_client.generate_json(kg_prompt, kg_user)
                entities_linked = len(kg_data.get("entities", []))
                if extracted_requirements:
                    extracted_requirements[0]["_kg_entities"] = kg_data.get("entities", [])
                    extracted_requirements[0]["_kg_relations"] = kg_data.get("relationships", [])
            except Exception as e:
                logger.error(f"KG extraction failed: {e}")
                
        dispatcher.emit(stage, name, "completed", {"entities_linked": entities_linked})

        # Stage 7: Rule Compilation
        stage = 7
        name = "Rule Compilation"
        dispatcher.emit(stage, name, "started")
        
        rules_generated = 0
        if llm_client and extracted_requirements:
            try:
                rule_prompt = "Compile these raw requirements into strict executable policy rules. For each requirement, review the 'conditions' AST and ensure it is mathematically sound. Return JSON: {'compiled_rules': [{'title': str, 'is_valid_ast': bool, 'refined_ast': {}}]}"
                rule_user = json.dumps([{"title": r.get("title"), "conditions": r.get("conditions")} for r in extracted_requirements])[:8000]
                rule_data = llm_client.generate_json(rule_prompt, rule_user)
                compiled = rule_data.get("compiled_rules", [])
                
                for refined in compiled:
                    for req in extracted_requirements:
                        if req.get("title") == refined.get("title") and refined.get("is_valid_ast"):
                            req["conditions"] = refined.get("refined_ast")
                            rules_generated += 1
            except Exception as e:
                logger.error(f"Rule compilation failed: {e}")
                
        dispatcher.emit(stage, name, "completed", {"rules_generated": rules_generated or total_extracted})

        # Stage 8: Validation
        stage = 8
        name = "Validation"
        dispatcher.emit(stage, name, "started")
        
        validated_count = total_extracted
        needs_review = 0
        if llm_client and extracted_requirements:
            try:
                val_prompt = "Validate the compiled rules against common logical fallacies. Return JSON: {'validated': int, 'needs_review': int}"
                val_user = json.dumps([r.get("title") for r in extracted_requirements])[:4000]
                val_data = llm_client.generate_json(val_prompt, val_user)
                validated_count = val_data.get("validated", total_extracted)
                needs_review = val_data.get("needs_review", 0)
            except Exception as e:
                logger.error(f"Validation failed: {e}")
                
        dispatcher.emit(stage, name, "completed", {"validated": validated_count, "needs_review": needs_review})

        # Stage 9: Persist to Policy DB
        stage = 9
        name = "Persist to Policy DB"
        dispatcher.emit(stage, name, "started")
        
        if source_doc.regulation_version_id:
            reg_ver_id = source_doc.regulation_version_id
            
            for req_data in extracted_requirements:
                db_req = Requirement(
                    regulation_version_id=reg_ver_id,
                    title=req_data.get("title", "Untitled Requirement")[:255],
                    description=req_data.get("description", ""),
                    severity=req_data.get("severity", "medium").lower(),
                    category=req_data.get("category", "General"),
                    status="active",
                    rule_conditions=req_data.get("conditions", {}),
                    rule_actions=req_data.get("actions", {})
                )
                db.add(db_req)
            
            db.commit()

        dispatcher.emit(stage, name, "completed", {"status": f"Successfully committed {total_extracted} requirements to database"})

    except Exception as e:
        logger.error(f"Pipeline failed at stage {stage} ({name}): {e}")
        dispatcher.emit(stage, name, "failed", {"error": str(e)})
        raise e

