import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// User storage setup
const USERS_FILE = path.join(process.cwd(), "users.json");

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) {
    return [];
  }
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// Lazy-loaded OpenAI client to prevent crashes if key is initially missing
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required to use the AI assistant. " +
        "Please provide your API key in the configuration."
      );
    }
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Authentication endpoints
app.post("/api/auth/signup", (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }
    const users = readUsers();
    if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }
    const newUser = {
      id: "user_" + Date.now(),
      email: email.toLowerCase(),
      password, // Plaintext/simple hashed representation for platform context
      name,
      role: role || "student",
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during sign-up." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const users = readUsers();
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during login." });
  }
});

app.post("/api/auth/google", (req, res) => {
  try {
    const { email, name, role } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required." });
    }
    const users = readUsers();
    let user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      user = {
        id: "user_" + Date.now(),
        email: email.toLowerCase(),
        password: "google_oauth_token",
        name,
        role: role || "student",
        createdAt: new Date().toISOString()
      };
      users.push(user);
      writeUsers(users);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during Google authentication." });
  }
});

// OpenAI Solve/Explain Endpoint
app.post("/api/ai/solve", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemInstruction = `You are an expert STEM teacher and AI Co-pilot on an interactive whiteboard.
Solve the problem or explain the scientific/mathematical concept provided by the user.
Use clear step-by-step explanations, and provide standard LaTeX expressions for any formulas.
Format your output cleanly in Markdown. Keep your explanations concise, precise, and highly educational.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt + (context ? `\n\nContext of current canvas elements:\n${JSON.stringify(context)}` : "") }
      ],
      temperature: 0.2,
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred with OpenAI assistant." });
  }
});

// OpenAI Draw Helper Endpoint (Generates canvas structures from user prompts!)
app.post("/api/ai/draw", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemInstruction = `You are a STEM whiteboard designer. Convert the user's drawing request into a structured list of whiteboard elements.
The canvas coordinates are typically centered around (x: 400, y: 300) with a range of x [100 to 700] and y [100 to 500].
Supported element types to output:
1. "shape": representing a geometric drawing.
   - shapeType can be "line", "arrow" (for vectors/axes/force lines), "rect", "circle", or "hexagon" (for benzene rings).
   - x, y: coordinate numbers. For lines/arrows, this is the start coordinate.
   - width, height: dimensions. For lines/arrows, this is the end coordinate (x2 as width, y2 as height).
   - label: text to display near or on the shape (optional).
   - strokeColor: hex color (e.g., "#003fb1" for primary blue, "#006a61" for teal, "#474a4c" for grey, or "#ba1a1a" for error).
2. "sticky": representing a sticky note.
   - x, y: coordinates.
   - width: default 150, height: default 150.
   - content: text content inside.
   - color: "yellow" | "pink" | "cyan" | "green".
3. "text": representing normal text or a LaTeX formula.
   - x, y: coordinates.
   - content: text or LaTeX math formula like "\\int_{a}^{b} f(x) dx". Include LaTeX symbols like \\theta, \\pi, \\int, \\frac.
   - isFormula: boolean (true if it should render as a mathematical formula, false for normal text label).
   - strokeColor: hex color.

Generate a list of elements that represent the requested concept beautifully.`;

    const responseSchema = {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A short, descriptive board title representing what is drawn (e.g., 'XY Coordinate Grid' or 'Benzene Ring Structure')"
        },
        elements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                description: "Must be 'shape', 'sticky', or 'text'"
              },
              shapeType: {
                type: "string",
                description: "Required if type is 'shape'. Can be 'line', 'arrow', 'rect', 'circle', 'hexagon'."
              },
              x: {
                type: "number",
                description: "X position or starting X coordinate"
              },
              y: {
                type: "number",
                description: "Y position or starting Y coordinate"
              },
              width: {
                type: "number",
                description: "Width, radius for circle, or ending X coordinate for line/arrow"
              },
              height: {
                type: "number",
                description: "Height or ending Y coordinate for line/arrow"
              },
              content: {
                type: "string",
                description: "Required for 'sticky' or 'text'. Contains text content or LaTeX formula"
              },
              color: {
                type: "string",
                description: "Required if type is 'sticky'. Can be 'yellow', 'pink', 'cyan', 'green'"
              },
              label: {
                type: "string",
                description: "Optional label to draw beside or in the shape"
              },
              isFormula: {
                type: "boolean",
                description: "True if text is a math formula, false otherwise"
              },
              strokeColor: {
                type: "string",
                description: "Hex stroke color. Recommended: '#003fb1', '#006a61', '#474a4c', '#ba1a1a'"
              }
            },
            required: ["type", "x", "y"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "elements"],
      additionalProperties: false
    };

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "whiteboard_elements",
          strict: true,
          schema: responseSchema
        }
      },
      temperature: 0.1,
    });

    const outputText = response.choices[0].message.content;
    if (!outputText) {
      throw new Error("No response from OpenAI model.");
    }

    res.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error("OpenAI Draw Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred with OpenAI assistant." });
  }
});

// Vite / static asset loading and server start wrapped in async to support CJS esbuild
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

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

