import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export async function GET() {
  const securityPolicy = `# RegCompiler Vulnerability Disclosure Policy (RFC 9116)
Contact: mailto:security@regcompiler.app
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://www.regcompiler.app/.well-known/security.txt
Policy: https://www.regcompiler.app/terms
Acknowledgments: https://www.regcompiler.app/
`;

  return new NextResponse(securityPolicy, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
