import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const FALLBACK_FRAMEWORKS = [
  {
    id: "ee14550d-5e14-47ab-9b77-857bec7f852c",
    name: "Digital Operational Resilience Act",
    acronym: "DORA",
    jurisdiction: "EU",
    source_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554",
    is_fetchable: true,
    description: "Rules for the protection, detection, containment, recovery and repairing capabilities against ICT-related incidents."
  },
  {
    id: "2e37d9c4-481c-4e4d-b3fe-4ccd8fd3b802",
    name: "EU Artificial Intelligence Act",
    acronym: "EU AI Act",
    jurisdiction: "EU",
    source_url: "https://artificialintelligenceact.eu/the-act/",
    is_fetchable: false,
    description: "Requires custom upload. World's first comprehensive AI law."
  },
  {
    id: "f360ba76-d69c-402e-98d9-ad110e08cdea",
    name: "General Data Protection Regulation",
    acronym: "GDPR",
    jurisdiction: "EU",
    source_url: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
    is_fetchable: true,
    description: "The toughest privacy and security law in the world."
  },
  {
    id: "74add263-5fc1-44e2-b026-ff96b029f13e",
    name: "Health Insurance Portability and Accountability Act",
    acronym: "HIPAA",
    jurisdiction: "US",
    source_url: "https://www.hhs.gov/hipaa/index.html",
    is_fetchable: false,
    description: "Requires custom upload. Federal law that required the creation of national standards to protect sensitive patient health information."
  },
  {
    id: "7b622f1c-af38-4403-9820-b1e97f8b62bb",
    name: "ISO/IEC 27001",
    acronym: "ISO 27001",
    jurisdiction: "Global",
    source_url: "https://www.iso.org/standard/27001",
    is_fetchable: false,
    description: "Requires licensed custom upload. International standard for information security management."
  },
  {
    id: "0f65d5a9-d092-4824-a9e9-c77bb2bb0fb2",
    name: "Payment Card Industry Data Security Standard",
    acronym: "PCI DSS",
    jurisdiction: "Global",
    source_url: "https://www.pcisecuritystandards.org/",
    is_fetchable: false,
    description: "Requires custom upload. Information security standard for organizations that handle branded credit cards."
  },
  {
    id: "19ccb85c-08ad-4deb-b420-bcbeb09ce7a9",
    name: "Service Organization Control 2",
    acronym: "SOC 2",
    jurisdiction: "Global",
    source_url: "https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome",
    is_fetchable: false,
    description: "Requires custom upload. Voluntary compliance standard for service organizations."
  }
];

function getCandidateUrls(): string[] {
  const pubUrl = process.env.NEXT_PUBLIC_API_URL;
  const isProd = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const urls: string[] = [];

  if (process.env.INTERNAL_API_URL) {
    urls.push(`${process.env.INTERNAL_API_URL.replace(/\/+$/, '')}/regulations/frameworks`);
  }
  if (pubUrl && !pubUrl.includes('127.0.0.1') && !pubUrl.includes('localhost')) {
    urls.push(`${pubUrl.replace(/\/+$/, '')}/regulations/frameworks`);
  }
  urls.push('https://regulation-compiler.onrender.com/api/v1/regulations/frameworks');
  const localUrl = `${(pubUrl || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '')}/regulations/frameworks`;
  if (!isProd) {
    urls.unshift(localUrl);
  } else {
    urls.push(localUrl);
  }
  return Array.from(new Set(urls));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  const candidateUrls = getCandidateUrls();
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(8000),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json(data, {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
              'Access-Control-Allow-Origin': '*',
            }
          });
        }
      }
    } catch {
      // Backend asleep, timed out, or waking up - continue to next or fallback
    }
  }

  // Graceful canonical fallback guarantees UI never breaks with "Failed to fetch"
  return NextResponse.json(FALLBACK_FRAMEWORKS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Fallback-Catalog': 'true',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
