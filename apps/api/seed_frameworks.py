import os
import sys

from app.db.session import SessionLocal
from app.models.regulations import FrameworkCatalog

def seed_frameworks():
    db = SessionLocal()
    try:
        frameworks = [
            {
                "name": "General Data Protection Regulation",
                "acronym": "GDPR",
                "jurisdiction": "EU",
                "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
                "is_fetchable": True,
                "description": "The toughest privacy and security law in the world."
            },
            {
                "name": "Digital Operational Resilience Act",
                "acronym": "DORA",
                "jurisdiction": "EU",
                "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554",
                "is_fetchable": True,
                "description": "Rules for the protection, detection, containment, recovery and repairing capabilities against ICT-related incidents."
            },
            {
                "name": "Health Insurance Portability and Accountability Act",
                "acronym": "HIPAA",
                "jurisdiction": "US",
                "source_url": "https://www.hhs.gov/hipaa/index.html",
                "is_fetchable": False,
                "description": "Requires custom upload. Federal law that required the creation of national standards to protect sensitive patient health information."
            },
            {
                "name": "EU Artificial Intelligence Act",
                "acronym": "EU AI Act",
                "jurisdiction": "EU",
                "source_url": "https://artificialintelligenceact.eu/the-act/",
                "is_fetchable": False,
                "description": "Requires custom upload. World's first comprehensive AI law."
            },
            {
                "name": "Service Organization Control 2",
                "acronym": "SOC 2",
                "jurisdiction": "Global",
                "source_url": "https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome",
                "is_fetchable": False,
                "description": "Requires custom upload. Voluntary compliance standard for service organizations."
            },
            {
                "name": "ISO/IEC 27001",
                "acronym": "ISO 27001",
                "jurisdiction": "Global",
                "source_url": "https://www.iso.org/standard/27001",
                "is_fetchable": False,
                "description": "Requires licensed custom upload. International standard for information security management."
            },
            {
                "name": "Payment Card Industry Data Security Standard",
                "acronym": "PCI DSS",
                "jurisdiction": "Global",
                "source_url": "https://www.pcisecuritystandards.org/",
                "is_fetchable": False,
                "description": "Requires custom upload. Information security standard for organizations that handle branded credit cards."
            }
        ]

        for f in frameworks:
            existing = db.query(FrameworkCatalog).filter(FrameworkCatalog.acronym == f["acronym"]).first()
            if not existing:
                new_f = FrameworkCatalog(**f)
                db.add(new_f)
            else:
                for k, v in f.items():
                    setattr(existing, k, v)
        db.commit()
        print("Frameworks seeded successfully.")
    except Exception as e:
        print(f"Error seeding frameworks: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_frameworks()
