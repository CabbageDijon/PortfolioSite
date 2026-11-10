// Journal posts published from the private admin page.
// GET  /api/journal           -> list of published posts (no body)
// GET  /api/journal/:slug     -> one post incl. markdown body
// POST /api/journal/publish   -> create a post (needs JOURNAL_PUBLISH_PASSWORD)
const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_DIR = process.env.JOURNAL_DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "journal-posts.json");

function readPosts() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writePosts(posts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(posts, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Keep category slugs aligned with the static journal.html posts.
const CATEGORY_SLUGS = { "personal projects": "personal", "web development": "webdev" };

function passwordOk(provided) {
  const expected = process.env.JOURNAL_PUBLISH_PASSWORD || "";
  if (!expected || typeof provided !== "string") return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

router.get("/", function (_req, res) {
  const list = readPosts()
    .map(function (p) {
      const copy = Object.assign({}, p);
      delete copy.content;
      return copy;
    })
    .sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  res.set("Cache-Control", "no-store");
  res.json(list);
});

router.get("/:slug", function (req, res) {
  const post = readPosts().find(function (p) {
    return p.slug === req.params.slug;
  });
  if (!post) return res.status(404).json({ error: "Post not found." });
  res.set("Cache-Control", "no-store");
  res.json(post);
});

const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

router.post("/publish", publishLimiter, function (req, res) {
  if (!process.env.JOURNAL_PUBLISH_PASSWORD) {
    return res.status(503).json({ error: "Publishing is not configured (JOURNAL_PUBLISH_PASSWORD is unset)." });
  }
  const b = req.body || {};
  if (!passwordOk(b.password)) return res.status(401).json({ error: "Wrong password." });

  const title = String(b.title || "").trim().slice(0, 140);
  const kicker = String(b.category || "").trim().slice(0, 40);
  const excerpt = String(b.excerpt || "").trim().slice(0, 300);
  const content = String(b.content || "");
  if (!title) return res.status(400).json({ error: "Title is required." });
  if (!kicker) return res.status(400).json({ error: "Category is required." });
  if (content.trim().length < 20) return res.status(400).json({ error: "Content is too short." });

  const tags = (Array.isArray(b.tags) ? b.tags : String(b.tags || "").split(","))
    .map(function (t) { return String(t).trim().slice(0, 24); })
    .filter(Boolean)
    .slice(0, 6);

  const slug = slugify(b.slug || title);
  if (!slug) return res.status(400).json({ error: "Could not build a slug from the title." });

  const posts = readPosts();
  if (posts.some(function (p) { return p.slug === slug; })) {
    return res.status(409).json({ error: "A post with slug '" + slug + "' already exists." });
  }

  const words = content.trim().split(/\s+/).length;
  const post = {
    slug: slug,
    title: title,
    kicker: kicker,
    category: CATEGORY_SLUGS[kicker.toLowerCase()] || slugify(kicker) || "other",
    date: new Date().toISOString().slice(0, 10),
    excerpt: excerpt || content.replace(/[#*_`>\[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, 160),
    tags: tags,
    words: words,
    href: "/articles/post?slug=" + slug,
    content: content,
  };
  posts.push(post);
  try {
    writePosts(posts);
  } catch (err) {
    console.error("Journal write error:", err);
    return res.status(500).json({ error: "Could not save the post." });
  }
  res.json({ success: true, slug: slug, href: post.href });
});

module.exports = router;
