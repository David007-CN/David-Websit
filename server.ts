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
  // This helps bypass CORS and provides a place to add a GITHUB_TOKEN for higher rate limits
  app.get('/api/github-proxy', async (req, res) => {
    const { owner, repo, path: filePath, ref } = req.query;
    
    if (!owner || !repo || !filePath) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref || 'main'}`;
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NodeJS-Express-App'
      };

      // If user provides a TOKEN in .env, we use it to boost limit to 5000/hr
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(githubUrl, { headers });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('GitHub Proxy Error:', error);
      res.status(500).json({ error: 'Failed to fetch from GitHub' });
    }
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
