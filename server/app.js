import cors from "cors";
import express from "express";
import { issueToken, verifyToken } from "./auth-core.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tzphvhninjlgdnwpukey.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cGh2aG5pbmpsZ2Rud3B1a2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjg1MTUsImV4cCI6MjEwNjY0NDUxNX0.iK2SsYDnOu44m9mSrP59BXU5VHYiGulgG1zYUxquNRM",
);

export function createApp(store) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  async function requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Sign in required.' })
      }
  
      const token = authHeader.split(' ')[1]
      const { data, error } = await supabase.auth.getUser(token)
  
      if (error || !data.user) {
        return res.status(401).json({ error: 'Sign in required.' })
      }
  
      req.user = data.user
      next()
    } catch (err) {
      res.status(401).json({ error: 'Authentication failed.' })
    }
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "hearthbound",
      db:
        process.env.DATABASE_URL &&
        process.env.DATABASE_URL.includes("postgres")
          ? "postgres"
          : process.env.DATABASE_URL &&
              process.env.DATABASE_URL.includes("sqlite")
            ? "sqlite"
            : "unknown",
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName } = req.body || {};

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required." });
      }

      const cleanUsername = username.trim();
      const email = `${cleanUsername.toLowerCase()}@hearthbound.local`;

      // 1. Sign up the user (since email confirmation is off, Supabase immediately returns a session)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName?.trim() || cleanUsername,
            username: cleanUsername,
          },
        },
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      const authUser = authData.user;
      const session = authData.session;

      if (!authUser) {
        return res.status(400).json({ error: "User registration failed." });
      }

      // 2. Insert into your custom profiles table
      const { error: profileError } = await supabase.from("users").insert({
        id: authUser.id,
        username: cleanUsername,
        display_name: displayName?.trim() || cleanUsername,
        password_hash: password,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        // Optional: Handle profile creation error if needed
        console.error("Failed to create user profile:", profileError.message);
      }

      // 3. Format response matching your frontend's expected structure[cite: 1, 2, 3]
      const user = {
        id: authUser.id,
        username: cleanUsername,
        displayName: displayName?.trim() || cleanUsername,
      };

      // Since confirmation is off, session.access_token is readily available
      const token = session ? session.access_token : await issueToken(user);

      res.status(201).json({ user, token });
    } catch (err) {
      res
        .status(err.status || 500)
        .json({ error: err.message || "Register failed." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password are required." });
      }

      const cleanUsername = username.trim();
      // Map username back to the internal email format used during register
      const email = `${cleanUsername.toLowerCase()}@hearthbound.local`;

      // Authenticate with Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user || !authData.session) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      const authUser = authData.user;

      // Fetch the corresponding profile data if you use a profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      const user = {
        id: authUser.id,
        username: profile?.username || cleanUsername,
        displayName: profile?.display_name || cleanUsername,
      };

      // Return Supabase access token
      const token = authData.session.access_token;

      res.json({ user, token });
    } catch (err) {
      res
        .status(err.status || 500)
        .json({ error: err.message || "Login failed." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Sign in required." });
      }

      const token = authHeader.split(" ")[1];

      // Verify token and fetch user directly from Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        return res.status(401).json({ error: "Sign in required." });
      }

      const authUser = authData.user;

      // Fetch matching user profile details
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      const user = {
        id: authUser.id,
        username:
          profile?.username || authUser.user_metadata?.username || "user",
        displayName:
          profile?.display_name ||
          authUser.user_metadata?.display_name ||
          "User",
      };

      res.json({ user });
    } catch (err) {
      res
        .status(err.status || 500)
        .json({ error: err.message || "Auth failed." });
    }
  });

  // GET /api/characters - Retrieve all characters for the authenticated user
app.get('/api/characters', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const { data: rows, error } = await supabase
      .from('characters')
      .select('id, user_id, name, data, updated_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Reconstruct full character objects from data column + top level columns
    const characters = (rows || []).map((row) => ({
      ...(row.data || {}),
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    res.json({ characters })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to load characters.' })
  }
})

// POST /api/characters - Save a new character
app.post('/api/characters', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const character = req.body?.character

    if (!character || typeof character !== 'object') {
      return res.status(400).json({ error: 'Character payload required.' })
    }

    const { id, name, createdAt, updatedAt, ...restData } = character
    const now = new Date().toISOString()

    console.log(restData)

    const { data: row, error } = await supabase
      .from('characters')
      .insert({
        id: id,
        user_id: userId,
        name: name || 'Unnamed Character',
        data: restData,
        created_at: createdAt || now,
        updated_at: updatedAt || now,
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const savedCharacter = {
      ...(row.data || {}),
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    res.status(201).json({ character: savedCharacter })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to save character.' })
  }
})

// PUT /api/characters/:id - Update an existing character
app.put('/api/characters/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const characterId = req.params.id
    const character = req.body?.character

    if (!character || typeof character !== 'object') {
      return res.status(400).json({ error: 'Character payload required.' })
    }

    const { id, name, createdAt, updatedAt, ...restData } = character
    const now = new Date().toISOString()

    const { data: row, error } = await supabase
      .from('characters')
      .update({
        name: name,
        data: restData,
        updated_at: now,
      })
      .eq('id', characterId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !row) {
      return res.status(404).json({ error: 'Character not found or update failed.' })
    }

    const savedCharacter = {
      ...(row.data || {}),
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    res.json({ character: savedCharacter })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update character.' })
  }
})

// DELETE /api/characters/:id - Delete a character
app.delete('/api/characters/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const characterId = req.params.id

    const { data, error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('user_id', userId)
      .select()

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Character not found.' })
    }

    res.status(204).end()
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to delete character.' })
  }
})

  return app;
}
