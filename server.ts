import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Octokit } from "octokit";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "coderabbit-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    },
  })
);

// GitHub OAuth Config
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// API Routes
app.get("/api/auth/url", (req, res) => {
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo,user`;
  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      (req.session as any).githubToken = data.access_token;
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } else {
      res.status(400).send("Failed to get access token");
    }
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/user", async (req, res) => {
  const token = (req.session as any).githubToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/api/repos", async (req, res) => {
  const token = (req.session as any).githubToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 10,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch repos" });
  }
});

app.get("/api/repos/:owner/:repo/pulls", async (req, res) => {
  const token = (req.session as any).githubToken;
  const { owner, repo } = req.params;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "open",
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pull requests" });
  }
});

app.get("/api/repos/:owner/:repo/pulls/:pull_number/reviews", async (req, res) => {
  const token = (req.session as any).githubToken;
  const { owner, repo, pull_number } = req.params;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const octokit = new Octokit({ auth: token });
    
    // Fetch review comments (these usually contain the suggestions)
    const { data: comments } = await octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: parseInt(pull_number),
    });

    // Filter for CodeRabbit comments (simulated by checking body or user)
    // In a real scenario, we'd look for "coderabbitai[bot]"
    const codeRabbitComments = comments.filter(c => 
      c.user?.login.includes("coderabbit") || c.body.includes("CodeRabbit")
    );

    res.json(codeRabbitComments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
