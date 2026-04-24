import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for GitHub Proxy
  app.get('/api/github-proxy', async (req, res) => {
    const { owner, repo, path: filePath, ref } = req.query;
    
    if (!owner || !repo || !filePath) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref || 'main'}`;
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'David-Design-Portfolio'
      };

      let token = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : null;

      if (token) {
        // Remove "Bearer " or "token " if the user manually added it to the string
        token = token.replace(/^(Bearer|token)\s+/i, '');
        
        // GitHub recommends Bearer for both classical and fine-grained tokens now
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`GitHub Proxy: Requesting ${owner}/${repo}/${filePath} with token [${token.substring(0, 4)}...]`);
      } else {
        console.warn(`GitHub Proxy: No GITHUB_TOKEN found. Using unauthenticated request for ${filePath}`);
      }

      const response = await fetch(githubUrl, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error(`GitHub API Error (${response.status}) on ${filePath}:`, errorData);
        
        // Return 403 specifically so the frontend can show the rate limit warning
        return res.status(response.status).json({
          ...errorData,
          proxyMessage: response.status === 403 ? 'GitHub API Rate Limit' : 'GitHub API Error',
          debugInfo: {
            tokenUsed: !!token,
            tokenPrefix: token ? token.substring(0, 4) + '...' : null,
            envKeys: Object.keys(process.env).filter(key => key.includes('GITHUB'))
          }
        });
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('GitHub Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch from GitHub' });
    }
  });

  // 诊断接口：检查 Token 是否存在及是否有效
  app.get('/api/github-status', async (req, res) => {
    const rawToken = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : '';
    const hasToken = rawToken !== '';
    
    let validation = {
      valid: false,
      message: 'No token configured',
      scopes: [],
      rateLimit: null
    };

    if (hasToken) {
      try {
        const token = rawToken.replace(/^(Bearer|token)\s+/i, '');
        const verifyResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'David-Portfolio-Validator'
          }
        });

        const rateLimit = verifyResponse.headers.get('x-ratelimit-remaining');
        const scopes = verifyResponse.headers.get('x-oauth-scopes');

        if (verifyResponse.ok) {
          validation = {
            valid: true,
            message: 'Token is valid and active',
            scopes: scopes ? scopes.split(', ') : [],
            rateLimit: rateLimit ? parseInt(rateLimit) : null
          };
        } else {
          const err = await verifyResponse.json().catch(() => ({}));
          validation = {
            valid: false,
            message: `Invalid token: ${verifyResponse.status} ${err.message || ''}`,
            scopes: [],
            rateLimit: null
          };
        }
      } catch (e) {
        validation = {
          valid: false,
          message: `Network error during validation: ${e.message}`,
          scopes: [],
          rateLimit: null
        };
      }
    }

    res.json({ 
      tokenConfigured: hasToken,
      tokenPrefix: hasToken ? rawToken.substring(0, 4) + '...' : 'none',
      validation,
      envKeys: Object.keys(process.env).filter(key => key.includes('GITHUB'))
    });
  });

  // API Route for Contact Form
  app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    // Configure Nodemailer
    // Note: User needs to provide these in .env
    const transporter = nodemailer.createTransport({
      service: '163', // Or use host/port for other services
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This should be the SMTP authorization code
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'pdw0336@163.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Message: ${message || 'No message provided'}
      `,
    };

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials not configured');
      }
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email. Please check server logs.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
