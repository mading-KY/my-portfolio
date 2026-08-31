# Mading Majok — Portfolio Website

A full-stack portfolio website with an admin dashboard, SQLite database, and email notifications.

---

## ✨ Features

- 🎨 **Modern Design** — GitHub dark theme with red accent
- ⚙️ **3D Animated Gear Background** — Rotating gear in the hero section
- 📝 **Admin Dashboard** — Edit profile, upload photo, and view contact messages
- 📧 **Email Notifications** — Receive emails for every contact form submission
- 💾 **SQLite Database** — Store messages and profile data locally
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile
- 🔒 **Basic Auth Protection** — Secure admin dashboard with login

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (better-sqlite3) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Auth** | Basic Auth (Admin Dashboard) |
| **File Upload** | Multer (Profile Photo) |

---

## 📁 Project Structure
├── index.js # Main Express server
├── package.json # Dependencies and scripts
├── .env # Environment variables (git-ignored)
├── portfolio.db # SQLite database (auto-generated)
├── public/
│ ├── index.html # Portfolio homepage
│ ├── style.css # Portfolio styles
│ ├── script.js # Portfolio scripts
│ ├── gear.png # 3D gear background image
│ ├── mading.jpg # Profile photo
│ ├── resume.pdf # Downloadable CV
│ └── uploads/ # Uploaded profile photos
├── admin/
│ ├── admin.html # Admin dashboard HTML
│ ├── admin.js # Admin dashboard scripts
│ └── admin.css # Admin dashboard styles
├── db/
│ ├── database.js # SQLite setup
│ ├── messages.js # Message operations
│ └── profile.js # Profile operations
└── mailer.js # Email notifications

text

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mading-KY/portfolio.git
cd portfolio
2. Install dependencies
bash
npm install
3. Configure environment variables
Copy .env.example to .env and fill in your credentials:

bash
cp .env.example .env
Edit .env:

env
PORT=3000


# Admin Dashboard credentials
ADMIN_USER=
ADMIN_PASS=

# Gmail SMTP for email notifications
EMAIL_USER=
EMAIL_PASS=
EMAIL_TO=

# regarding auth, email, use .env.

4. Start the server
bash
npm start
5. Access the site
Portfolio: http://localhost:3000

Admin Dashboard: http://localhost:3000/admin

🔐 Admin Dashboard
The admin dashboard is protected with Basic Auth.

How to Access:
Navigate to http://localhost:3000/admin

Enter your ADMIN_USER and ADMIN_PASS from .env

You can now:

Edit Profile — Update name, role, and bio

Upload Photo — Change your profile picture

View Messages — See all contact form submissions

📡 API Endpoints
Method	Endpoint	Description	Auth Required
GET	/api/profile	Get profile data	No
PUT	/api/profile	Update profile	Yes
POST	/api/profile/photo	Upload profile photo	Yes
POST	/api/contact	Submit contact form	No
GET	/api/messages	Get all messages	Yes
GET	/api/health	Health check	No
📧 Email Notifications
When someone submits the contact form:

Message is saved to the SQLite database

Email notification is sent to EMAIL_TO address

Gmail Setup:
Enable 2-Step Verification on your Google Account

Generate an App Password: myaccount.google.com/apppasswords

Use the 16-character password as EMAIL_PASS in .env

# NOTE: IT'S NOT YET DEPLOYED.

🚢 Deployment
Deploy to Render (Free)
Push code to GitHub

Create a new Web Service on Render

Connect your GitHub repo

Set environment variables in Render dashboard

Deploy!

Deploy to Heroku
bash
heroku create
heroku config:set ADMIN_USER=your-username
heroku config:set ADMIN_PASS=your-password
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
heroku config:set EMAIL_TO=your-email@gmail.com
git push heroku main
📜 License
MIT License — see LICENSE for details.

👤 Author
Mading Majok

GitHub: @mading-KY

LinkedIn: Mading Majok

Email: madingmajok484@gmail.com

🎉 Acknowledgements
Built with ❤️ by Mading Majok

Inspired by GitHub's dark theme

Powered by Express.js, SQLite, and Nodemailer