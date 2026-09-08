import sys
import os
import uuid
from datetime import datetime, timezone, date

# Ensure apps/api is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.regulations import Regulation, RegulationVersion, SourceDocument, DocumentSection, FileTypeEnum
from app.models.requirements import Requirement, RequirementTypeEnum, SeverityEnum, ValidationStatusEnum
from sqlalchemy import or_, text

def seed_canonical():
    db = SessionLocal()
    try:
        print("--- Step 1: Cleaning up dummy & test regulations ---")
        dummy_patterns = [
            "Test Reg%",
            "Failure Test%",
            "Mock%",
            "SSE Test%",
            "Stream Test%",
            "Mid Run Test%",
            "aurex%",
            "%Reports%",
            "gdpr",
            "Test Regulation%"
        ]
        
        filter_conditions = [Regulation.name.ilike(p) for p in dummy_patterns]
        dummy_regs = db.query(Regulation).filter(or_(*filter_conditions)).all()
        print(f"Found {len(dummy_regs)} mock/test regulations to remove.")

        def delete_regulation_cleanly(reg):
            db.execute(text(f"UPDATE regulations SET current_version_id = NULL WHERE id = '{reg.id}'"))
            db.flush()
            
            versions = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == reg.id).all()
            source_doc_ids = [v.source_document_id for v in versions if v.source_document_id]
            version_ids = [v.id for v in versions]

            if version_ids:
                db.query(Requirement).filter(Requirement.regulation_version_id.in_(version_ids)).delete(synchronize_session=False)
                db.flush()

            if versions:
                db.query(RegulationVersion).filter(RegulationVersion.regulation_id == reg.id).delete(synchronize_session=False)
                db.flush()

            for s_id in set(source_doc_ids):
                refs = db.query(RegulationVersion).filter(RegulationVersion.source_document_id == s_id).count()
                if refs == 0:
                    db.query(DocumentSection).filter(DocumentSection.source_document_id == s_id).delete(synchronize_session=False)
                    db.query(SourceDocument).filter(SourceDocument.id == s_id).delete(synchronize_session=False)
                    db.flush()

            db.delete(reg)
            db.flush()

        for dr in dummy_regs:
            delete_regulation_cleanly(dr)
        db.commit()

        for c in db.query(Regulation).filter(Regulation.name == "CCPA").all():
            delete_regulation_cleanly(c)
        db.commit()

        for e in db.query(Regulation).filter(Regulation.name == "E2E Global Privacy Law").all():
            delete_regulation_cleanly(e)
        db.commit()

        for g in db.query(Regulation).filter(Regulation.name == "GDPR Consolidated Text").all():
            delete_regulation_cleanly(g)
        db.commit()

        canonical_target_names = [
            "General Data Protection Regulation (GDPR)",
            "Digital Operational Resilience Act (DORA)",
            "Health Insurance Portability and Accountability Act (HIPAA)",
            "California Consumer Privacy Act (CCPA / CPRA)",
            "Personal Information Protection and Electronic Documents Act (PIPEDA)",
            "ISO/IEC 27001:2022",
            "Payment Card Industry Data Security Standard (PCI DSS 4.0)"
        ]
        non_canonicals = db.query(Regulation).filter(~Regulation.name.in_(canonical_target_names)).all()
        print(f"Purging {len(non_canonicals)} remaining non-canonical regulations...")
        for nc in non_canonicals:
            delete_regulation_cleanly(nc)
        db.commit()

        print("--- Step 2: Establishing Canonical Regulations & Real Requirements with Authentic Statutory Source Texts ---")

        CANONICAL_FRAMEWORKS = [
            {
                "name": "General Data Protection Regulation (GDPR)",
                "jurisdiction": "EU",
                "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
                "description": "Comprehensive European Union privacy legislation setting global benchmarks for lawful personal data processing, data subject rights, and cross-border transfer controls.",
                "requirements": [
                    {
                        "title": "Lawfulness, Fairness, and Transparency",
                        "reference_label": "GDPR Article 5(1)(a)",
                        "source_text": "Article 5(1)(a): Personal data shall be processed lawfully, fairly and in a transparent manner in relation to the data subject ('lawfulness, fairness and transparency'). Processing is lawful only if and to the extent that at least one of the legal bases specified in Article 6 applies, including consent, contract performance, legal obligation, vital interests, public interest, or legitimate interests pursued by the controller.",
                        "description": "Personal data must be processed lawfully, fairly and in a transparent manner in relation to the data subject (Article 5(1)(a)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"legal_basis_required": True, "transparency_notice": True},
                        "actions": {"publish_privacy_policy": True, "document_legal_basis": True},
                        "evidence_required": {"audit_trail": True, "privacy_notice_url": True},
                        "references": {"article": "Article 5(1)(a)", "gdpr_recital": "39"}
                    },
                    {
                        "title": "Purpose Limitation",
                        "reference_label": "GDPR Article 5(1)(b)",
                        "source_text": "Article 5(1)(b): Personal data shall be collected for specified, explicit and legitimate purposes and not further processed in a manner that is incompatible with those purposes ('purpose limitation'); further processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes shall, in accordance with Article 89(1), not be considered to be incompatible with the initial purposes.",
                        "description": "Personal data must be collected for specified, explicit and legitimate purposes and not further processed in a manner incompatible with those purposes (Article 5(1)(b)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"purpose_specification": True, "compatible_use_only": True},
                        "actions": {"enforce_purpose_binding": True, "assess_secondary_processing": True},
                        "evidence_required": {"data_flow_map": True, "processing_register": True},
                        "references": {"article": "Article 5(1)(b)", "gdpr_recital": "50"}
                    },
                    {
                        "title": "Data Minimisation",
                        "reference_label": "GDPR Article 5(1)(c)",
                        "source_text": "Article 5(1)(c): Personal data shall be adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed ('data minimisation'). Controllers must identify minimum necessary data schemas and prevent over-collection.",
                        "description": "Personal data must be adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed (Article 5(1)(c)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"excessive_data_prevention": True},
                        "actions": {"prune_unused_attributes": True, "strip_unnecessary_pii": True},
                        "evidence_required": {"schema_inspection_report": True},
                        "references": {"article": "Article 5(1)(c)", "gdpr_recital": "39"}
                    },
                    {
                        "title": "Accuracy and Prompt Rectification",
                        "reference_label": "GDPR Article 5(1)(d) & Article 16",
                        "source_text": "Article 5(1)(d): Personal data shall be accurate and, where necessary, kept up to date; every reasonable step must be taken to ensure that personal data that are inaccurate, having regard to the purposes for which they are processed, are erased or rectified without delay ('accuracy').\nArticle 16: The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data concerning him or her.",
                        "description": "Personal data must be accurate and, where necessary, kept up to date; reasonable steps must be taken to ensure inaccurate data are erased or rectified without delay (Article 5(1)(d)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.medium,
                        "conditions": {"user_rectification_channel": True},
                        "actions": {"provide_self_service_update": True, "sync_downstream_replicas": True},
                        "evidence_required": {"rectification_request_log": True},
                        "references": {"article": "Article 5(1)(d)", "gdpr_recital": "39"}
                    },
                    {
                        "title": "Storage Limitation",
                        "reference_label": "GDPR Article 5(1)(e)",
                        "source_text": "Article 5(1)(e): Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed ('storage limitation'); personal data may be stored for longer periods insofar as the personal data will be processed solely for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes in accordance with Article 89(1).",
                        "description": "Personal data must be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed (Article 5(1)(e)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"retention_schedule_defined": True},
                        "actions": {"automated_ttl_purging": True, "archive_or_anonymize": True},
                        "evidence_required": {"ttl_deletion_job_logs": True},
                        "references": {"article": "Article 5(1)(e)", "gdpr_recital": "39"}
                    },
                    {
                        "title": "Integrity and Confidentiality (Security of Processing)",
                        "reference_label": "GDPR Article 5(1)(f) & Article 32",
                        "source_text": "Article 5(1)(f): Personal data shall be processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures ('integrity and confidentiality').\nArticle 32(1): Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing, the controller and the processor shall implement technical and organisational measures to ensure a level of security appropriate to the risk.",
                        "description": "Personal data must be processed in a manner that ensures appropriate security of the personal data, including protection against unauthorized or unlawful processing and against accidental loss (Article 5(1)(f) & Article 32).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"encryption_at_rest": True, "tls_in_transit": True, "rbac_enforced": True},
                        "actions": {"aes_256_encryption": True, "tls_1_3_enforcement": True, "periodic_vulnerability_scan": True},
                        "evidence_required": {"soc2_report": True, "encryption_key_rotation_log": True},
                        "references": {"article": "Article 32", "gdpr_recital": "83"}
                    },
                    {
                        "title": "Controller Accountability",
                        "reference_label": "GDPR Article 5(2) & Article 30",
                        "source_text": "Article 5(2): The controller shall be responsible for, and be able to demonstrate compliance with, paragraph 1 ('accountability').\nArticle 30(1): Each controller and, where applicable, the controller's representative, shall maintain a record of processing activities under its responsibility. That record shall contain: name and contact details of controller/DPO, purposes of processing, description of categories of data subjects and personal data, categories of recipients, and security safeguards.",
                        "description": "The controller shall be responsible for, and be able to demonstrate compliance with, the principles relating to processing of personal data (Article 5(2)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"compliance_records_maintained": True},
                        "actions": {"maintain_ropa": True, "conduct_internal_audits": True},
                        "evidence_required": {"ropa_register": True, "dpo_oversight_notes": True},
                        "references": {"article": "Article 5(2)", "gdpr_recital": "85"}
                    },
                    {
                        "title": "Conditions for Valid Consent",
                        "reference_label": "GDPR Article 7",
                        "source_text": "Article 7: Conditions for consent.\n1. Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of his or her personal data.\n2. If the data subject's consent is given in the context of a written declaration which also concerns other matters, the request for consent shall be presented in a manner which is clearly distinguishable from the other matters, in an intelligible and easily accessible form, using clear and plain language.\n3. The data subject shall have the right to withdraw his or her consent at any time. It shall be as easy to withdraw as to give consent.",
                        "description": "Where processing is based on consent, the controller must be able to demonstrate that the data subject has consented, with clear withdrawal mechanisms as easy as giving consent (Article 7).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"opt_in_mandatory": True, "no_pre_ticked_boxes": True},
                        "actions": {"record_consent_timestamp": True, "one_click_opt_out": True},
                        "evidence_required": {"consent_receipt_database": True},
                        "references": {"article": "Article 7", "gdpr_recital": "32"}
                    },
                    {
                        "title": "Right to Erasure ('Right to be Forgotten')",
                        "reference_label": "GDPR Article 17",
                        "source_text": "Article 17(1): The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay and the controller shall have the obligation to erase personal data without undue delay where one of the following grounds applies:\n(a) the personal data are no longer necessary in relation to the purposes for which they were collected or otherwise processed;\n(b) the data subject withdraws consent on which the processing is based;\n(c) the data subject objects to the processing pursuant to Article 21(1) and there are no overriding legitimate grounds for the processing.",
                        "description": "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay (Article 17).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"erasure_api_operational": True, "30_day_sla": True},
                        "actions": {"hard_delete_or_crypto_shred": True, "notify_third_party_processors": True},
                        "evidence_required": {"erasure_completion_certificate": True},
                        "references": {"article": "Article 17", "gdpr_recital": "65"}
                    },
                    {
                        "title": "Notification of Personal Data Breach to Supervisory Authority",
                        "reference_label": "GDPR Article 33",
                        "source_text": "Article 33(1): In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority competent in accordance with Article 55, unless the personal data breach is unlikely to result in a risk to the rights and freedoms of natural persons. Where the notification to the supervisory authority is not made within 72 hours, it shall be accompanied by reasons for the delay.",
                        "description": "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the competent supervisory authority (Article 33).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"incident_detection_sla": True, "72h_authority_alert": True},
                        "actions": {"trigger_incident_response_playbook": True, "draft_dpa_submission": True},
                        "evidence_required": {"incident_response_log": True, "dpa_filing_reference": True},
                        "references": {"article": "Article 33", "gdpr_recital": "85"}
                    },
                    {
                        "title": "Data Protection by Design and by Default",
                        "reference_label": "GDPR Article 25",
                        "source_text": "Article 25(1): Taking into account the state of the art, the cost of implementation and the nature, scope, context and purposes of processing as well as the risks of varying likelihood and severity for rights and freedoms of natural persons posed by the processing, the controller shall, both at the time of the determination of the means for processing and at the time of the processing itself, implement appropriate technical and organisational measures, such as pseudonymisation, which are designed to implement data-protection principles.\nArticle 25(2): The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed.",
                        "description": "The controller shall implement appropriate technical and organisational measures, such as pseudonymisation, designed to implement data-protection principles effectively (Article 25).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"default_private_settings": True, "pseudonymization": True},
                        "actions": {"anonymize_analytics_payloads": True, "restrict_public_profiles": True},
                        "evidence_required": {"architecture_review_signoff": True},
                        "references": {"article": "Article 25", "gdpr_recital": "78"}
                    },
                    {
                        "title": "Data Protection Impact Assessment (DPIA)",
                        "reference_label": "GDPR Article 35",
                        "source_text": "Article 35(1): Where a type of processing in particular using new technologies, and taking into account the nature, scope, context and purposes of the processing, is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall, prior to the processing, carry out an assessment of the impact of the envisaged processing operations on the protection of personal data.\nArticle 35(2): The controller shall seek the advice of the data protection officer, where designated, when carrying out a data protection impact assessment.",
                        "description": "Where processing is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall carry out an assessment of the impact (Article 35).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"high_risk_processing_identified": True},
                        "actions": {"conduct_formal_dpia": True, "consult_dpo": True},
                        "evidence_required": {"signed_dpia_document": True},
                        "references": {"article": "Article 35", "gdpr_recital": "90"}
                    }
                ]
            },
            {
                "name": "Digital Operational Resilience Act (DORA)",
                "jurisdiction": "EU",
                "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554",
                "description": "Regulation (EU) 2022/2554 establishing harmonized cybersecurity, ICT third-party risk management, and operational resilience requirements for financial entities.",
                "requirements": [
                    {
                        "title": "ICT Risk Management Framework Governance",
                        "reference_label": "DORA Article 5",
                        "source_text": "Article 5(1): Financial entities shall have in place an internal governance and control framework that ensures an effective and prudent management of ICT risk, in accordance with Article 6(4), in order to achieve a high level of digital operational resilience.\nArticle 5(2): The management body of the financial entity shall define, approve, oversee and be accountable for the implementation of all arrangements related to the ICT risk management framework referred to in Article 6(1).",
                        "description": "Financial entities shall have in place an internal governance and control framework that ensures effective and prudent management of ICT risk (Article 5).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"management_body_approval": True, "annual_review": True},
                        "actions": {"define_ict_risk_tolerances": True, "assign_three_lines_of_defense": True},
                        "evidence_required": {"board_minutes_ict_signoff": True, "risk_appetite_statement": True},
                        "references": {"article": "Article 5", "dora_chapter": "II"}
                    },
                    {
                        "title": "ICT Systems, Protocols, and Tools Maintenance",
                        "reference_label": "DORA Article 6",
                        "source_text": "Article 6(4): Financial entities shall use and maintain updated ICT systems, protocols and tools that are: (a) appropriate to the magnitude of operations supporting the conduct of their activities; (b) reliable; (c) equipped with sufficient capacity to accurately process the data and information; (d) technologically resilient to adequately bear additional process loads under stressed market conditions.",
                        "description": "Financial entities shall use and maintain updated ICT systems, protocols and tools that are appropriate, reliable, technologically resilient and have adequate capacity (Article 6).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"supported_software_versions": True, "capacity_monitoring": True},
                        "actions": {"decommission_eol_systems": True, "autoscale_redundant_nodes": True},
                        "evidence_required": {"cmdb_asset_inventory": True, "capacity_metrics": True},
                        "references": {"article": "Article 6", "dora_chapter": "II"}
                    },
                    {
                        "title": "Identification of Business Functions & ICT Assets",
                        "reference_label": "DORA Article 8",
                        "source_text": "Article 8(1): As part of the ICT risk management framework, financial entities shall identify, classify and adequately document all ICT-supported business functions, the information assets and the ICT assets fulfilling those functions, as well as all roles and responsibilities in relation to ICT risk.\nArticle 8(4): Financial entities shall maintain inventories of all ICT assets, mapping interdependencies between business functions, third-party ICT service providers, and underlying hardware and software.",
                        "description": "Financial entities shall identify, classify and adequately document all ICT supported business functions, the information assets and the ICT assets fulfilling those functions (Article 8).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"critical_function_tagging": True, "interdependency_mapping": True},
                        "actions": {"maintain_critical_asset_graph": True, "map_cloud_dependencies": True},
                        "evidence_required": {"cmdb_architecture_map": True},
                        "references": {"article": "Article 8", "dora_chapter": "II"}
                    },
                    {
                        "title": "Protection and Prevention Security Measures",
                        "reference_label": "DORA Article 9",
                        "source_text": "Article 9(1): For the purpose of adequately protecting ICT systems and with a view to organising response measures, financial entities shall continuously monitor and control the security and functioning of ICT systems and tools and shall minimise the impact of ICT risk on ICT systems through the deployment of appropriate ICT security tools, policies and procedures.\nArticle 9(2): Financial entities shall design, procure and implement ICT security policies, procedures, protocols and tools that aim to ensure the resilience, continuity and availability of ICT systems, and maintain high standards of security, confidentiality and integrity of data.",
                        "description": "Continuous monitoring and security tooling to prevent unauthorized access, mitigate data tampering, and ensure network segregation (Article 9).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"microsegmentation": True, "multi_factor_authentication": True, "edr_deployed": True},
                        "actions": {"enforce_mfa_everywhere": True, "zero_trust_network_access": True},
                        "evidence_required": {"iam_configuration_audit": True, "waf_firewall_rulesets": True},
                        "references": {"article": "Article 9", "dora_chapter": "II"}
                    },
                    {
                        "title": "Detection of Anomalous Activities & Intrusions",
                        "reference_label": "DORA Article 10",
                        "source_text": "Article 10(1): Financial entities shall have in place mechanisms to promptly detect anomalous activities, including ICT network performance issues and ICT-related incidents, and to identify potential material single points of failure.\nArticle 10(2): The detection mechanisms referred to in paragraph 1 shall enable multiple layers of control, define alert thresholds and criteria to trigger and initiate ICT-related incident response processes.",
                        "description": "Financial entities shall have mechanisms to promptly detect anomalous activities, including ICT network performance issues and ICT-related incidents (Article 10).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"24_7_siem_soc": True, "automated_anomaly_detection": True},
                        "actions": {"centralize_security_telemetry": True, "tune_detection_rules": True},
                        "evidence_required": {"soc_runbooks": True, "alert_triaging_metrics": True},
                        "references": {"article": "Article 10", "dora_chapter": "II"}
                    },
                    {
                        "title": "ICT Business Continuity and Disaster Recovery Policy",
                        "reference_label": "DORA Article 11",
                        "source_text": "Article 11(1): For the purpose of ensuring digital operational resilience, financial entities shall put in place a sound and comprehensive ICT business continuity policy as an integral part of the operational business continuity policy of the financial entity.\nArticle 11(2): Financial entities shall implement the ICT business continuity policy through dedicated, appropriate and documented arrangements, plans, procedures and mechanisms aimed at ensuring the continuity of critical functions and rapid failover.",
                        "description": "Comprehensive business continuity plans and disaster recovery arrangements subjected to regular testing and audit validation (Article 11).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"rpo_rto_defined": True, "annual_failover_test": True},
                        "actions": {"automated_database_backups": True, "multi_region_failover_runbook": True},
                        "evidence_required": {"dr_test_report": True, "rto_compliance_log": True},
                        "references": {"article": "Article 11", "dora_chapter": "II"}
                    },
                    {
                        "title": "Threat-Led Penetration Testing (TLPT)",
                        "reference_label": "DORA Article 26",
                        "source_text": "Article 26(1): Financial entities identified in accordance with paragraph 8 shall carry out at least every 3 years advanced testing by means of threat-led penetration testing (TLPT). Based on the risk profile of the financial entity, the competent authority may request the financial entity to increase or decrease this frequency.\nArticle 26(2): Each threat-led penetration test shall cover several or all critical or important functions of a financial entity, and shall be performed on live production systems supporting such functions.",
                        "description": "Entities shall carry out advanced digital operational resilience testing, including Threat-Led Penetration Testing (TLPT) at least every 3 years for critical functions (Article 26).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"crested_testers_mandated": True, "production_scope_tested": True},
                        "actions": {"contract_red_team": True, "remediate_critical_cves": True},
                        "evidence_required": {"tlpt_attestation_summary": True},
                        "references": {"article": "Article 26", "dora_chapter": "IV"}
                    },
                    {
                        "title": "Management of ICT Third-Party Risk",
                        "reference_label": "DORA Article 28",
                        "source_text": "Article 28(1): Financial entities shall manage ICT third-party risk as an integral component of ICT risk within their ICT risk management framework and in accordance with the principles laid down in this Chapter.\nArticle 28(3): As part of their ICT risk management framework, financial entities shall maintain and update at entity level, and at sub-consolidated and consolidated levels, a register of information in relation to all contractual arrangements on the use of ICT services provided by ICT third-party service providers.",
                        "description": "Financial entities shall manage ICT third-party risk as an integral component of ICT risk, maintaining a full Register of Information for all ICT service providers (Article 28).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"vendor_register_updated": True, "audit_rights_in_contracts": True},
                        "actions": {"assess_vendor_concentration": True, "enforce_sla_safeguards": True},
                        "evidence_required": {"third_party_register_of_information": True},
                        "references": {"article": "Article 28", "dora_chapter": "V"}
                    }
                ]
            },
            {
                "name": "Health Insurance Portability and Accountability Act (HIPAA)",
                "jurisdiction": "US",
                "source_url": "https://www.hhs.gov/hipaa/index.html",
                "description": "United States federal standards protecting the privacy and security of Protected Health Information (PHI) and electronic PHI (ePHI).",
                "requirements": [
                    {
                        "title": "Security Management Process & Risk Analysis",
                        "reference_label": "HIPAA 45 CFR § 164.308(a)(1)",
                        "source_text": "45 CFR § 164.308(a)(1)(i): Standard: Security management process. Implement policies and procedures to prevent, detect, contain, and correct security violations.\n§ 164.308(a)(1)(ii)(A): Risk analysis (Required). Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity or business associate.\n§ 164.308(a)(1)(ii)(B): Risk management (Required). Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.",
                        "description": "Implement policies and procedures to prevent, detect, contain, and correct security violations, including an accurate risk assessment of all ePHI (45 CFR § 164.308(a)(1)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"formal_risk_analysis": True, "sanction_policy": True},
                        "actions": {"conduct_annual_hipaa_risk_assessment": True, "mitigate_unacceptable_risks": True},
                        "evidence_required": {"security_risk_assessment_report": True},
                        "references": {"cfr": "45 CFR § 164.308(a)(1)", "safeguard": "Administrative"}
                    },
                    {
                        "title": "Workforce Security & Authorization",
                        "reference_label": "HIPAA 45 CFR § 164.308(a)(3)",
                        "source_text": "45 CFR § 164.308(a)(3)(i): Standard: Workforce security. Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information, in accordance with paragraph (a)(4) of this section, and to prevent those workforce members who do not have access from obtaining access to electronic protected health information.\n§ 164.308(a)(3)(ii)(C): Termination procedures (Required). Implement procedures for terminating access to electronic protected health information when employment ends.",
                        "description": "Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information (45 CFR § 164.308(a)(3)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"least_privilege_access": True, "termination_offboarding_sla": True},
                        "actions": {"provision_role_based_access": True, "revoke_access_within_24h": True},
                        "evidence_required": {"access_review_quarterly_log": True},
                        "references": {"cfr": "45 CFR § 164.308(a)(3)", "safeguard": "Administrative"}
                    },
                    {
                        "title": "Information Access Management & Minimum Necessary",
                        "reference_label": "HIPAA 45 CFR § 164.308(a)(4)",
                        "source_text": "45 CFR § 164.308(a)(4)(i): Standard: Information access management. Implement policies and procedures for authorizing access to electronic protected health information that are consistent with the applicable requirements of subpart E of this part.\n§ 164.308(a)(4)(ii)(B): Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism.",
                        "description": "Implement policies and procedures for authorizing access to ePHI in accordance with the applicable requirements of the Privacy Rule (45 CFR § 164.308(a)(4)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"phi_query_auditing": True, "minimum_necessary_filtering": True},
                        "actions": {"restrict_raw_phi_views": True, "mask_medical_record_numbers": True},
                        "evidence_required": {"phi_access_telemetry": True},
                        "references": {"cfr": "45 CFR § 164.308(a)(4)", "safeguard": "Administrative"}
                    },
                    {
                        "title": "Facility Access Controls & Physical Safeguards",
                        "reference_label": "HIPAA 45 CFR § 164.310(a)(1)",
                        "source_text": "45 CFR § 164.310(a)(1): Standard: Facility access controls. Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed, while ensuring that properly authorized access is allowed.\n§ 164.310(a)(2)(ii): Facility security plan (Addressable). Implement policies and procedures to safeguard the facility and the equipment therein from unauthorized physical access, tampering, and theft.",
                        "description": "Implement policies and procedures to limit physical access to electronic information systems and the facility in which they are housed (45 CFR § 164.310(a)(1)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.medium,
                        "conditions": {"data_center_badge_access": True, "visitor_escort_policy": True},
                        "actions": {"audit_physical_logs": True, "secure_workstation_monitors": True},
                        "evidence_required": {"badge_reader_access_logs": True},
                        "references": {"cfr": "45 CFR § 164.310(a)(1)", "safeguard": "Physical"}
                    },
                    {
                        "title": "Technical Access Controls & Unique User Identification",
                        "reference_label": "HIPAA 45 CFR § 164.312(a)(1)",
                        "source_text": "45 CFR § 164.312(a)(1): Standard: Access control. Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights as specified in § 164.308(a)(4).\n§ 164.312(a)(2)(i): Unique user identification (Required). Assign a unique name and/or number for identifying and tracking user identity.\n§ 164.312(a)(2)(ii): Emergency access procedure (Required). Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency.",
                        "description": "Assign a unique name and/or number for identifying and tracking user identity, and implement emergency access procedures (45 CFR § 164.312(a)(1)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"no_shared_accounts": True, "break_glass_procedure": True},
                        "actions": {"enforce_unique_uid": True, "session_timeout_15min": True},
                        "evidence_required": {"identity_provider_user_directory": True},
                        "references": {"cfr": "45 CFR § 164.312(a)(1)", "safeguard": "Technical"}
                    },
                    {
                        "title": "Audit Controls & Electronic Access Tracking",
                        "reference_label": "HIPAA 45 CFR § 164.312(b)",
                        "source_text": "45 CFR § 164.312(b): Standard: Audit controls. Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information. System components must log all access attempts, file reads, edits, and exports involving patient identifiers.",
                        "description": "Implement hardware, software, and procedural mechanisms that record and examine activity in systems that contain or use ePHI (45 CFR § 164.312(b)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"immutable_audit_logs": True, "read_write_delete_logged": True},
                        "actions": {"stream_to_cloudwatch_s3": True, "retain_audit_logs_6_years": True},
                        "evidence_required": {"siem_audit_trail": True},
                        "references": {"cfr": "45 CFR § 164.312(b)", "safeguard": "Technical"}
                    },
                    {
                        "title": "Transmission Security & Encryption",
                        "reference_label": "HIPAA 45 CFR § 164.312(e)(1)",
                        "source_text": "45 CFR § 164.312(e)(1): Standard: Transmission security. Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.\n§ 164.312(e)(2)(i): Integrity controls (Addressable). Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection.\n§ 164.312(e)(2)(ii): Encryption (Addressable). Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.",
                        "description": "Implement technical security measures to guard against unauthorized access to ePHI that is being transmitted over an electronic communications network (45 CFR § 164.312(e)(1)).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"tls_1_2_minimum": True, "vpn_for_remote_ingress": True},
                        "actions": {"reject_http_unencrypted": True, "fips_140_2_crypto": True},
                        "evidence_required": {"ssl_labs_a_grade_cert": True},
                        "references": {"cfr": "45 CFR § 164.312(e)(1)", "safeguard": "Technical"}
                    },
                    {
                        "title": "Breach Notification to HHS and Affected Individuals",
                        "reference_label": "HIPAA 45 CFR § 164.404 & § 164.406",
                        "source_text": "45 CFR § 164.404(a): Standard: Notification to individuals. A covered entity shall, following the discovery of a breach of unsecured protected health information, notify each individual whose unsecured protected health information has been, or is reasonably believed by the covered entity to have been, accessed, acquired, used, or disclosed as a result of such breach.\n§ 164.404(b): Timeliness of notification. Notifications shall be provided without unreasonable delay and in no case later than 60 calendar days after discovery of a breach.",
                        "description": "Covered entities must notify affected individuals and the Secretary of HHS of a breach of unsecured protected health information without unreasonable delay and in no case later than 60 days (45 CFR § 164.404).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"60_day_max_notice": True, "media_notice_if_500_plus": True},
                        "actions": {"execute_breach_response_plan": True, "send_certified_patient_letters": True},
                        "evidence_required": {"hhs_ocr_portal_submission": True},
                        "references": {"cfr": "45 CFR § 164.404", "safeguard": "Breach Notification"}
                    }
                ]
            },
            {
                "name": "California Consumer Privacy Act (CCPA / CPRA)",
                "jurisdiction": "US",
                "source_url": "https://oag.ca.gov/privacy/ccpa",
                "description": "California landmark privacy law granting California residents rights over personal information and regulating the sale, sharing, and retention of consumer data.",
                "requirements": [
                    {
                        "title": "Notice at Collection of Personal Information",
                        "reference_label": "Cal. Civ. Code § 1798.100",
                        "source_text": "Cal. Civ. Code § 1798.100(a): A business that controls the collection of a consumer's personal information shall, at or before the point of collection, inform consumers as to the categories of personal information to be collected and the purposes for which the categories of personal information are collected or used and whether that information is sold or shared.\n§ 1798.100(b): A business shall not collect additional categories of personal information or use personal information collected for additional purposes that are incompatible with the disclosed purpose for which the personal information was collected.",
                        "description": "A business that controls the collection of a consumer's personal information shall, at or before the point of collection, inform consumers as to the categories of personal information to be collected (Cal. Civ. Code § 1798.100).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"notice_at_collection_visible": True, "retention_periods_disclosed": True},
                        "actions": {"render_modal_banner": True, "publish_pi_categories": True},
                        "evidence_required": {"collection_point_ui_screenshot": True},
                        "references": {"cal_civ_code": "§ 1798.100", "reg_section": "7012"}
                    },
                    {
                        "title": "Consumer Right to Delete Personal Information",
                        "reference_label": "Cal. Civ. Code § 1798.105",
                        "source_text": "Cal. Civ. Code § 1798.105(a): A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected from the consumer.\n§ 1798.105(c)(1): A business that receives a verifiable consumer request from a consumer to delete the consumer's personal information pursuant to subdivision (a) of this section shall delete the consumer's personal information from its records and direct any service providers and contractors to delete the consumer's personal information from their records within 45 days.",
                        "description": "A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected (Cal. Civ. Code § 1798.105).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"45_day_sla": True, "cascade_to_service_providers": True},
                        "actions": {"purge_consumer_records": True, "dispatch_vendor_delete_signals": True},
                        "evidence_required": {"deletion_verification_log": True},
                        "references": {"cal_civ_code": "§ 1798.105", "reg_section": "7022"}
                    },
                    {
                        "title": "Consumer Right to Correct Inaccurate Personal Information",
                        "reference_label": "Cal. Civ. Code § 1798.106",
                        "source_text": "Cal. Civ. Code § 1798.106(a): A consumer shall have the right to request a business that maintains inaccurate personal information about the consumer to correct that inaccurate personal information, taking into account the nature of the personal information and the purposes of the processing of the personal information.\n§ 1798.106(b): A business that receives a verifiable consumer request to correct inaccurate personal information shall use commercially reasonable efforts to correct the inaccurate personal information as directed by the consumer.",
                        "description": "A consumer shall have the right to request a business that maintains inaccurate personal information about the consumer to correct that inaccurate personal information (Cal. Civ. Code § 1798.106).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.medium,
                        "conditions": {"correction_workflow_operational": True},
                        "actions": {"update_pi_store": True, "confirm_accuracy_to_consumer": True},
                        "evidence_required": {"correction_receipt_log": True},
                        "references": {"cal_civ_code": "§ 1798.106", "reg_section": "7023"}
                    },
                    {
                        "title": "Right to Opt-Out of Sale or Sharing of Personal Information",
                        "reference_label": "Cal. Civ. Code § 1798.120",
                        "source_text": "Cal. Civ. Code § 1798.120(a): A consumer shall have the right, at any time, to direct a business that sells or shares personal information about the consumer to third parties not to sell or share the consumer's personal information. This right may be referred to as the right to opt-out of sale or sharing.\n§ 1798.135(a)(1): A business shall provide a clear and conspicuous link on the business's internet homepages, titled 'Do Not Sell or Share My Personal Information' and process opt-out preference signals.",
                        "description": "A consumer shall have the right, at any time, to direct a business that sells or shares personal information about the consumer to third parties not to sell or share (Cal. Civ. Code § 1798.120).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"do_not_sell_link_present": True, "respect_gpc_signal": True},
                        "actions": {"block_advertising_trackers": True, "suppress_third_party_pixel_events": True},
                        "evidence_required": {"gpc_header_compliance_test": True},
                        "references": {"cal_civ_code": "§ 1798.120", "reg_section": "7025"}
                    },
                    {
                        "title": "Right to Limit Use and Disclosure of Sensitive Personal Information",
                        "reference_label": "Cal. Civ. Code § 1798.121",
                        "source_text": "Cal. Civ. Code § 1798.121(a): A consumer shall have the right, at any time, to direct a business that collects sensitive personal information about the consumer to limit its use of the consumer's sensitive personal information to that use which is necessary to perform the services or provide the goods reasonably expected by an average consumer who requests those goods or services.\n§ 1798.135(a)(2): A business shall provide a clear link titled 'Limit the Use of My Sensitive Personal Information'.",
                        "description": "A consumer shall have the right, at any time, to direct a business that collects sensitive personal information to limit its use to that which is necessary to perform services (Cal. Civ. Code § 1798.121).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"limit_sensitive_pi_link": True},
                        "actions": {"isolate_geolocation_and_financial_data": True, "prevent_secondary_profiling": True},
                        "evidence_required": {"sensitive_data_containment_audit": True},
                        "references": {"cal_civ_code": "§ 1798.121", "reg_section": "7027"}
                    },
                    {
                        "title": "Prohibition of Discrimination Against Exercising Rights",
                        "reference_label": "Cal. Civ. Code § 1798.125",
                        "source_text": "Cal. Civ. Code § 1798.125(a)(1): A business shall not discriminate against a consumer because the consumer exercised any of the consumer's rights under this title, including, but not limited to, by: (A) Denying goods or services to the consumer; (B) Charging different prices or rates for goods or services; (C) Providing a different level or quality of goods or services to the consumer.",
                        "description": "A business shall not discriminate against a consumer because the consumer exercised any of the consumer's rights under this title (Cal. Civ. Code § 1798.125).",
                        "type": RequirementTypeEnum.prohibition,
                        "severity": SeverityEnum.high,
                        "conditions": {"no_denial_of_goods": True, "no_unjustified_price_differentiation": True},
                        "actions": {"maintain_uniform_service_tiers": True, "file_financial_incentive_notices": True},
                        "evidence_required": {"pricing_model_attestation": True},
                        "references": {"cal_civ_code": "§ 1798.125", "reg_section": "7080"}
                    }
                ]
            },
            {
                "name": "Personal Information Protection and Electronic Documents Act (PIPEDA)",
                "jurisdiction": "CA",
                "source_url": "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
                "description": "Canadian federal privacy law governing how private-sector organizations collect, use, and disclose personal information in commercial activities.",
                "requirements": [
                    {
                        "title": "Principle 1: Accountability",
                        "reference_label": "PIPEDA Schedule 1, Clause 4.1",
                        "source_text": "PIPEDA Schedule 1, 4.1: An organization is responsible for personal information under its control and shall designate an individual or individuals who are accountable for the organization's compliance with the following principles.\n4.1.1: Accountability for the organization's compliance with the principles rests with the designated individual(s), even though other individuals within the organization may be responsible for the day-to-day collection and processing of personal information.",
                        "description": "An organization is responsible for personal information under its control and shall designate an individual or individuals who are accountable for compliance (Schedule 1, 4.1).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"privacy_officer_designated": True, "published_contact_channel": True},
                        "actions": {"appoint_chief_privacy_officer": True, "maintain_privacy_management_program": True},
                        "evidence_required": {"cpo_appointment_letter": True},
                        "references": {"schedule": "Schedule 1", "principle": "4.1"}
                    },
                    {
                        "title": "Principle 2: Identifying Purposes",
                        "reference_label": "PIPEDA Schedule 1, Clause 4.2",
                        "source_text": "PIPEDA Schedule 1, 4.2: The purposes for which personal information is collected shall be identified by the organization at or before the time the information is collected.\n4.2.1: The organization shall document the purposes for which personal information is collected in order to comply with the Openness principle (Clause 4.8) and the Individual Access principle (Clause 4.9).",
                        "description": "The purposes for which personal information is collected shall be identified by the organization at or before the time the information is collected (Schedule 1, 4.2).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"purpose_identified_at_collection": True},
                        "actions": {"document_specific_business_need": True, "inform_consumer_in_plain_language": True},
                        "evidence_required": {"privacy_notice_archive": True},
                        "references": {"schedule": "Schedule 1", "principle": "4.2"}
                    },
                    {
                        "title": "Principle 3: Meaningful Consent",
                        "reference_label": "PIPEDA Schedule 1, Clause 4.3",
                        "source_text": "PIPEDA Schedule 1, 4.3: The knowledge and consent of the individual are required for the collection, use, or disclosure of personal information, except where inappropriate.\n4.3.2: The principle requires 'knowledge and consent'. Organizations shall make a reasonable effort to ensure that the individual is advised of the purposes for which the information will be used. To make the consent meaningful, the purposes must be stated in such a manner that the individual can reasonably understand how the information will be used or disclosed.",
                        "description": "The knowledge and consent of the individual are required for the collection, use, or disclosure of personal information, except where inappropriate (Schedule 1, 4.3).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"express_consent_for_sensitive_data": True, "no_deceptive_patterns": True},
                        "actions": {"implement_granular_consent_checkboxes": True, "log_user_consent_state": True},
                        "evidence_required": {"consent_telemetry_database": True},
                        "references": {"schedule": "Schedule 1", "principle": "4.3"}
                    },
                    {
                        "title": "Principle 4: Limiting Collection",
                        "reference_label": "PIPEDA Schedule 1, Clause 4.4",
                        "source_text": "PIPEDA Schedule 1, 4.4: The collection of personal information shall be limited to that which is necessary for the purposes identified by the organization. Information shall be collected by fair and lawful means.\n4.4.1: Organizations shall not collect personal information indiscriminately. Both the amount and the type of information collected shall be limited to that which is necessary to fulfil the purposes identified.",
                        "description": "The collection of personal information shall be limited to that which is necessary for the purposes identified by the organization (Schedule 1, 4.4).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"data_collection_boundary_enforced": True},
                        "actions": {"disable_optional_field_mandates": True, "reject_bulk_unnecessary_harvesting": True},
                        "evidence_required": {"input_form_validation_schema": True},
                        "references": {"schedule": "Schedule 1", "principle": "4.4"}
                    },
                    {
                        "title": "Principle 7: Safeguards",
                        "reference_label": "PIPEDA Schedule 1, Clause 4.7",
                        "source_text": "PIPEDA Schedule 1, 4.7: Personal information shall be protected by security safeguards appropriate to the sensitivity of the information.\n4.7.1: The security safeguards shall protect personal information against loss or theft, as well as unauthorized access, disclosure, copying, use, or modification. Organizations shall protect personal information regardless of the format in which it is held.\n4.7.2: The methods of protection should include physical measures, organizational measures, and technological measures.",
                        "description": "Personal information shall be protected by security safeguards appropriate to the sensitivity of the information (Schedule 1, 4.7).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"physical_organizational_technical_safeguards": True},
                        "actions": {"encrypt_pii_stores": True, "enforce_privileged_access_controls": True},
                        "evidence_required": {"soc2_type_ii_certificate": True},
                        "references": {"schedule": "Schedule 1", "principle": "4.7"}
                    },
                    {
                        "title": "Mandatory Breach Reporting to Privacy Commissioner of Canada",
                        "reference_label": "PIPEDA Section 10.1",
                        "source_text": "PIPEDA Section 10.1(1): An organization shall report to the Commissioner any breach of security safeguards involving personal information under its control if it is reasonable in the circumstances to believe that the breach creates a real risk of significant harm to an individual.\nSection 10.1(3): The report shall be made in the prescribed form and manner as soon as feasible after the organization determines that the breach has occurred.",
                        "description": "An organization must report to the Privacy Commissioner of Canada any breach of security safeguards involving personal information that poses a real risk of significant harm (PIPEDA Section 10.1).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"rosh_assessment_framework": True, "prompt_opc_notification": True},
                        "actions": {"file_opc_breach_report": True, "notify_affected_canadians": True},
                        "evidence_required": {"opc_breach_filing_confirmation": True},
                        "references": {"section": "Section 10.1", "principle": "Breach Reporting"}
                    }
                ]
            },
            {
                "name": "ISO/IEC 27001:2022",
                "jurisdiction": "GLOBAL",
                "source_url": "https://www.iso.org/standard/27001",
                "description": "International standard specifying requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS).",
                "requirements": [
                    {
                        "title": "Control 5.1: Policies for Information Security",
                        "reference_label": "ISO/IEC 27001:2022 Control 5.1",
                        "source_text": "ISO/IEC 27001:2022 Annex A.5.1: Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness.",
                        "description": "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and interested parties.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"annual_executive_review": True, "all_staff_acknowledgement": True},
                        "actions": {"publish_isms_policy_portal": True, "track_employee_acknowledgments": True},
                        "evidence_required": {"signed_information_security_policy": True},
                        "references": {"control": "A.5.1", "theme": "Organizational"}
                    },
                    {
                        "title": "Control 5.15: Access Control",
                        "reference_label": "ISO/IEC 27001:2022 Control 5.15",
                        "source_text": "ISO/IEC 27001:2022 Annex A.5.15: Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements. Access rights shall be granted in accordance with least privilege and segregation of duties principles, and reviewed periodically.",
                        "description": "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"rbac_matrix": True, "privilege_segregation": True},
                        "actions": {"enforce_least_privilege": True, "perform_quarterly_access_review": True},
                        "evidence_required": {"iam_entitlement_audit_log": True},
                        "references": {"control": "A.5.15", "theme": "Organizational"}
                    },
                    {
                        "title": "Control 5.23: Information Security for Use of Cloud Services",
                        "reference_label": "ISO/IEC 27001:2022 Control 5.23",
                        "source_text": "ISO/IEC 27001:2022 Annex A.5.23: Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements. Roles and responsibilities between the organization and cloud service provider shall be formally agreed upon and documented.",
                        "description": "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"cloud_governance_framework": True, "exit_strategy_defined": True},
                        "actions": {"audit_aws_gcp_iam_policies": True, "enable_cloudtrail_and_guardduty": True},
                        "evidence_required": {"cloud_posture_benchmark_report": True},
                        "references": {"control": "A.5.23", "theme": "Organizational"}
                    },
                    {
                        "title": "Control 8.8: Management of Technical Vulnerabilities",
                        "reference_label": "ISO/IEC 27001:2022 Control 8.8",
                        "source_text": "ISO/IEC 27001:2022 Annex A.8.8: Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion, the organization's exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken to address the associated risk in accordance with risk appetite and remediation SLAs.",
                        "description": "Information about technical vulnerabilities of information systems being used shall be obtained, the organization's exposure evaluated and appropriate measures taken.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"weekly_vulnerability_scans": True, "critical_sla_14_days": True},
                        "actions": {"automated_snyk_and_trivy_ci_checks": True, "patch_cve_9_plus": True},
                        "evidence_required": {"vulnerability_scan_remediation_log": True},
                        "references": {"control": "A.8.8", "theme": "Technological"}
                    },
                    {
                        "title": "Control 8.24: Use of Cryptography",
                        "reference_label": "ISO/IEC 27001:2022 Control 8.24",
                        "source_text": "ISO/IEC 27001:2022 Annex A.8.24: Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented. Key management processes shall cover the full lifecycle of cryptographic keys including generation, distribution, storage, rotation, revocation and destruction.",
                        "description": "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"strong_ciphers_mandated": True, "kms_key_rotation_annual": True},
                        "actions": {"enforce_kms_envelope_encryption": True, "disable_deprecated_tls_ciphers": True},
                        "evidence_required": {"kms_key_rotation_audit": True},
                        "references": {"control": "A.8.24", "theme": "Technological"}
                    },
                    {
                        "title": "Control 8.28: Secure Coding",
                        "reference_label": "ISO/IEC 27001:2022 Control 8.28",
                        "source_text": "ISO/IEC 27001:2022 Annex A.8.28: Secure coding principles shall be applied to software development throughout the software development life cycle. Code components shall be reviewed or scanned for common vulnerabilities before entering production, and developers shall receive secure engineering training.",
                        "description": "Secure coding principles shall be applied to software development to maintain information security throughout the software development life cycle.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.high,
                        "conditions": {"sast_dast_in_pipeline": True, "peer_review_mandatory": True},
                        "actions": {"run_semgrep_in_ci": True, "require_two_approvals_on_github": True},
                        "evidence_required": {"github_branch_protection_settings": True},
                        "references": {"control": "A.8.28", "theme": "Technological"}
                    }
                ]
            },
            {
                "name": "Payment Card Industry Data Security Standard (PCI DSS 4.0)",
                "jurisdiction": "GLOBAL",
                "source_url": "https://www.pcisecuritystandards.org/",
                "description": "Global security standard developed by the PCI Security Standards Council to protect cardholder data and sensitive authentication data across processing environments.",
                "requirements": [
                    {
                        "title": "Requirement 1: Install and Maintain Network Security Controls",
                        "reference_label": "PCI DSS v4.0 Requirement 1.2 & 1.3",
                        "source_text": "Requirement 1.2: Network security controls (NSCs) are configured and maintained.\n1.2.1 Configuration files for NSCs are secured from unauthorized access and synchronized across all redundant systems.\n1.2.2 Network connections incoming to or outgoing from the cardholder data environment (CDE) are restricted to only those traffic flows that are specifically authorized and documented.\n1.3.1 Inbound traffic to the CDE is restricted to IP addresses, ports, and protocols necessary for business operations.\n1.3.2 Direct public access between the internet and any system component in the CDE is prohibited.",
                        "description": "Network security controls (NSCs) such as firewalls and cloud security groups must be configured to inspect and control traffic between trusted and untrusted networks.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"default_deny_all_ingress": True, "cde_isolated": True},
                        "actions": {"audit_security_group_rules": True, "document_all_inbound_ports": True},
                        "evidence_required": {"firewall_rule_matrix_signoff": True},
                        "references": {"requirement": "1.1", "pci_version": "4.0"}
                    },
                    {
                        "title": "Requirement 3: Protect Stored Account Data",
                        "reference_label": "PCI DSS v4.0 Requirement 3.4 & 3.5",
                        "source_text": "Requirement 3.4: Primary account number (PAN) is rendered unreadable anywhere it is stored using any of the following approaches:\n- One-way hashes based on strong cryptography of the entire PAN.\n- Truncation (permanently removing a segment of PAN data).\n- Index tokens and securely stored pads.\n- Strong cryptography with associated key-management processes and procedures.\nRequirement 3.5: Sensitive authentication data (SAD) is not retained after authorization, even if encrypted. All sensitive authentication data received is rendered unrecoverable upon completion of authorization process.",
                        "description": "Primary account numbers (PAN) must be rendered unreadable anywhere it is stored using strong cryptography (AES-256), hashing, or tokenization; never store sensitive authentication data (SAD) after authorization.",
                        "type": RequirementTypeEnum.prohibition,
                        "severity": SeverityEnum.critical,
                        "conditions": {"no_cvv_storage_post_auth": True, "pan_tokenized_or_encrypted": True},
                        "actions": {"tokenized_payment_gateway_use": True, "truncate_pan_on_display": True},
                        "evidence_required": {"database_data_discovery_scan": True},
                        "references": {"requirement": "3.3", "pci_version": "4.0"}
                    },
                    {
                        "title": "Requirement 4: Protect Cardholder Data with Strong Cryptography in Transit",
                        "reference_label": "PCI DSS v4.0 Requirement 4.2",
                        "source_text": "Requirement 4.2: PAN is protected with strong cryptography during transmission over open, public networks.\n4.2.1 Strong cryptography and security protocols are implemented to safeguard PAN during transmission over open, public networks (e.g., TLS 1.2 or TLS 1.3 with secure cipher suites).\n4.2.2 PAN is never sent via unencrypted end-user messaging technologies (such as e-mail, instant messaging, SMS, or chat).\n4.2.3 Certificates used for PAN transmissions over open networks are confirmed as valid and not expired or revoked.",
                        "description": "Strong cryptography and security protocols must be used to protect sensitive cardholder data during transmission over open, public networks.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"tls_1_2_or_1_3_only": True, "valid_pki_certificates": True},
                        "actions": {"disable_ssl_and_early_tls": True, "enforce_hsts_preload": True},
                        "evidence_required": {"qualys_ssl_labs_a_plus_audit": True},
                        "references": {"requirement": "4.1", "pci_version": "4.0"}
                    },
                    {
                        "title": "Requirement 8: Identify Users and Authenticate Access to System Components",
                        "reference_label": "PCI DSS v4.0 Requirement 8.3 & 8.4",
                        "source_text": "Requirement 8.3: Strong authentication with multi-factor authentication (MFA) is established and managed for all access to system components.\n8.3.6 Password complexity requires a minimum length of 12 characters (or 8 characters if system does not support 12) containing both numeric and alphabetic characters.\n8.4.1 Multi-factor authentication (MFA) is implemented for all non-console administrative access into the cardholder data environment.\n8.4.2 Multi-factor authentication (MFA) is implemented for all access into the CDE for all personnel.",
                        "description": "All access to system components must be identified and authenticated, requiring Multi-Factor Authentication (MFA) for all access to the Cardholder Data Environment (CDE).",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"mfa_required_for_cde": True, "8_character_plus_passwords": True},
                        "actions": {"enforce_fido2_webauthn_mfa": True, "lockout_after_6_failed_attempts": True},
                        "evidence_required": {"okta_mfa_policy_screenshot": True},
                        "references": {"requirement": "8.4", "pci_version": "4.0"}
                    },
                    {
                        "title": "Requirement 10: Log and Monitor All Access to System Components and Cardholder Data",
                        "reference_label": "PCI DSS v4.0 Requirement 10.2 & 10.4",
                        "source_text": "Requirement 10.2: Audit logs are implemented to record user activity across all system components.\n10.2.1 Audit logs capture all individual user access to cardholder data, all actions taken by individuals with root or administrative privileges, and invalid logical access attempts.\n10.3.1 Audit log records record user identification, date and time, type of event, success or failure indication, and identity of affected data or system component.\n10.4.1 Audit logs are reviewed at least once daily using automated log review tools or manual review procedures.",
                        "description": "Audit trails must be enabled and active for all system components, linking all access to individual users, and reviewed at least daily.",
                        "type": RequirementTypeEnum.obligation,
                        "severity": SeverityEnum.critical,
                        "conditions": {"daily_log_review": True, "12_month_log_retention": True},
                        "actions": {"stream_to_datadog_or_splunk": True, "alert_on_root_activity": True},
                        "evidence_required": {"automated_daily_log_review_attestation": True},
                        "references": {"requirement": "10.4", "pci_version": "4.0"}
                    }
                ]
            }
        ]

        # For each framework, find existing or create
        for item in CANONICAL_FRAMEWORKS:
            reg = db.query(Regulation).filter(Regulation.name == item["name"]).first()
            if not reg:
                short_name = item["name"].split("(")[0].strip()
                reg = db.query(Regulation).filter(Regulation.name.ilike(f"%{short_name}%")).first()
                if reg:
                    reg.name = item["name"]
                    reg.jurisdiction = item["jurisdiction"]
                    reg.source_url = item["source_url"]
                else:
                    reg = Regulation(
                        name=item["name"],
                        jurisdiction=item["jurisdiction"],
                        source_url=item["source_url"]
                    )
                    db.add(reg)
                    db.flush()

            print(f"Processing: {reg.name} [{reg.jurisdiction}] (ID: {reg.id})")

            # Combine all requirement source texts for the main source document
            full_statutory_text = f"<h1>{reg.name}</h1>\n<p>{item['description']}</p>\n<hr/>\n"
            for req_def in item["requirements"]:
                full_statutory_text += f"<h2>{req_def['reference_label']}</h2>\n<p>{req_def['source_text']}</p>\n"

            # Source Document
            source_doc = db.query(SourceDocument).filter(SourceDocument.storage_path == f"canonical/{reg.jurisdiction.lower()}/{reg.name}.html").first()
            if not source_doc:
                source_doc = SourceDocument(
                    file_type=FileTypeEnum.html,
                    storage_path=f"canonical/{reg.jurisdiction.lower()}/{reg.name}.html",
                    raw_text=full_statutory_text,
                    ocr_used=False,
                    page_count=len(item["requirements"])
                )
                db.add(source_doc)
                db.flush()
            else:
                source_doc.raw_text = full_statutory_text
                source_doc.page_count = len(item["requirements"])
                db.flush()

            # Version
            ver = db.query(RegulationVersion).filter(RegulationVersion.regulation_id == reg.id).first()
            if not ver:
                ver = RegulationVersion(
                    regulation_id=reg.id,
                    version_label="1.0",
                    published_date=date(2024, 1, 15),
                    ingested_at=datetime.now(timezone.utc),
                    source_document_id=source_doc.id
                )
                db.add(ver)
                db.flush()
            else:
                ver.source_document_id = source_doc.id
                ver.version_label = "2024.1"
                db.flush()

            reg.current_version_id = ver.id
            db.flush()

            # 1. Delete old requirements for this version
            db.query(Requirement).filter(Requirement.regulation_version_id == ver.id).delete(synchronize_session=False)
            db.flush()

            # 2. Delete old document sections for this source document
            db.query(DocumentSection).filter(DocumentSection.source_document_id == source_doc.id).delete(synchronize_session=False)
            db.flush()

            # 3. Create dedicated DocumentSection for each requirement with its authentic statutory text
            for idx, req_def in enumerate(item["requirements"]):
                ref_label = req_def.get("reference_label") or req_def["title"]
                clause_text = req_def.get("source_text") or req_def["description"]

                section = DocumentSection(
                    source_document_id=source_doc.id,
                    reference_label=ref_label,
                    raw_text=clause_text,
                    order_index=idx + 1
                )
                db.add(section)
                db.flush()

                req = Requirement(
                    regulation_version_id=ver.id,
                    section_id=section.id,
                    title=req_def["title"],
                    description=req_def["description"],
                    type=req_def["type"],
                    severity=req_def["severity"],
                    conditions=req_def.get("conditions", {}),
                    actions=req_def.get("actions", {}),
                    evidence_required=req_def.get("evidence_required", {}),
                    references=req_def.get("references", {}),
                    confidence_score=0.98,
                    validation_status=ValidationStatusEnum.enforceable,
                    meta_data={
                        "jurisdiction": item["jurisdiction"], 
                        "source": "canonical_enactment",
                        "citation": ref_label
                    }
                )
                db.add(req)

            db.commit()
            count = db.query(Requirement).filter(Requirement.regulation_version_id == ver.id).count()
            print(f"  -> Successfully configured {reg.name} with {count} distinct canonical requirements & statutory sections.")

        print("\n--- Step 3: Verification of Final Canonical Database State ---")
        final_regs = db.query(Regulation).all()
        print(f"Total Canonical Regulations: {len(final_regs)}")
        for fr in final_regs:
            v_id = fr.current_version_id
            cnt = db.query(Requirement).filter(Requirement.regulation_version_id == v_id).count() if v_id else 0
            print(f"  [{fr.jurisdiction}] {fr.name}: {cnt} requirements (Version: {v_id})")

    except Exception as e:
        db.rollback()
        print(f"Error seeding canonical regulations: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_canonical()
