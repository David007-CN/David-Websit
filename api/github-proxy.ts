import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { owner, repo, path: filePath, ref } = req.query;

  if (!owner || !repo || !filePath) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref || 'main'}`;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'David-Design-Portfolio-Vercel'
    };

    let token = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || '';
    token = token.trim();

    if (token) {
      // Remove 'token ' or 'Bearer ' prefix if the user pasted it in Vercel
      token = token.replace(/^(Bearer|token)\s+/i, '');
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[Proxy] Fetching: ${githubUrl} (Token present: ${!!token})`);
    const response = await fetch(githubUrl, { headers });

    // Important: Forward the status code and error messages
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      console.error(`[Proxy] GitHub API Error: ${response.status}`, errorData);
      return res.status(response.status).json({
        ...errorData,
        proxySource: 'Vercel Function',
        tokenConfigured: !!token
      });
    }

    const data = await response.json();
    
    // Set caching headers for Vercel (CDNs)
    // 1 hour fresh, 24 hours stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('GitHub Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from GitHub' });
  }
}
