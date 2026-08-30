# Portfolio Backend API

A lightweight, fast Express.js backend designed to serve a personal full-stack developer portfolio and securely handle incoming contact form submissions. Currently configured with local JSON file storage for quick deployment, with an architecture prepared for an upcoming MongoDB migration.

## 🚀 Features

* **Static File Serving:** Automatically and efficiently serves the HTML, CSS, and JavaScript portfolio files from the `/public` directory.
* **Form Handling & Validation:** Receives contact form submissions via a `/api/contact` POST route and ensures no empty messages are processed.
* **Local Data Storage:** Saves all incoming messages permanently to a local `messages.json` file using Node.js's native `fs` module.
* **Message Dashboard Route:** Includes a GET route (`/api/messages`) to easily view all received messages as a JSON array in the browser.

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Development Tools:** VS Code

## 📂 Project Structure

```text
my-portfolio/
├── public/               # Frontend assets
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── mading.jpg
│   └── resume.pdf
├── config/                # (Upcoming) Database configuration
├── models/                # (Upcoming) Mongoose schemas
├── messages.json           # Local database for contact form
├── index.js                # Main Express server entry point
├── package.json             # Project dependencies and scripts
└── README.md                # Project documentation
```

## ▶️ How to run it

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   For local development, with auto-restart on file changes:

   ```bash
   npm run dev
   ```

   For a plain run (e.g. on a host/production):

   ```bash
   npm start
   ```

3. **Open the portfolio**

   Visit `http://localhost:3000` — Express serves `public/index.html` and its assets directly.

4. **Test the contact form**

   Fill in the form on the site (or `POST` to `/api/contact` directly with a JSON body of `{ "name", "email", "message" }`). Successful submissions are appended to `messages.json`.

5. **View submitted messages**

   Visit `http://localhost:3000/api/messages` to see every stored submission as a JSON array.

## 🔜 Roadmap

* Migrate `messages.json` to MongoDB via Mongoose (`config/` + `models/` are already scaffolded for this).
* Add basic auth to `/api/messages` before any real deployment.
* Add rate limiting to `/api/contact` to prevent spam submissions.
