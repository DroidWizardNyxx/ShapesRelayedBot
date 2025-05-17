# Shapes AI Discord Bot (Standalone)

This is a standalone Discord bot script powered by the [Shapes API](https://shapes.inc), with support for text, image, audio, and reasoning callbacks via an external relay system.

The bot connects to the relay hosted at:  
**[https://github.com/DroidWizardNyxx/ShapesRelay](https://github.com/DroidWizardNyxx/ShapesRelay)**

---

## ⚠️ Important Notes

- **Do NOT include your `.env` file in the GitHub repository.**  
  Instead, create your environment variables directly in the hosting platform (e.g., Render, Wispbyte, Railway, etc.)

- This project is for **educational purposes only** and is **not affiliated with Shapes Inc. or Discord**.
- Use an **ALT Discord account** when registering the bot in case of future detection by Discord.

---

## ✅ Features

- Multimodal input support:
  - Text
  - Image recognition
  - Audio transcription
- Gemini-powered conversation logic (decides whether the bot should respond in passive mode)
- Shape-based AI responses using a secure relay
- Smart tool callbacks:
  - `<imageGenerate: prompt>` → Generates image from Lexica API
  - `<codeSimple(ext): prompt>` → Returns code file in desired extension
  - `<Deepthink: question>` → Asks the bot to reflect on what it should do

---

## ⚙️ Requirements

- Node.js 18 or higher
- A Discord bot token
- A hosted [Relay](https://github.com/DroidWizardNyxx/ShapesRelay)
- A Shapes API key + shape username
- Gemini API key (for conversation reasoning)
- MongoDB URI (e.g., MongoDB Atlas or a free Render instance)

---

## 📁 Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/shapes-bot
cd shapes-bot
npm install
```

### 2. Create a `.env` file locally (or use your host's dashboard):

```env
DISCORD_TOKEN=your-bot-token
SHAPES_RELAY_URL=https://your-relay-host/api/shape
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=your-mongodb-uri
ENABLE_PASSIVE_IA=true
```

> ⚠️ Again: Never upload your `.env` file to GitHub. Keep this data secure on your hosting provider.

---

## ▶️ Running the Bot

Start the bot locally:

```bash
node aiBot.js
```

Or configure it as a **web service or background worker** on platforms like:
- [Render](https://render.com/)
- [Wispbyte](https://wispbyte.com/)
- [Railway](https://railway.app/)
- [Glitch](https://glitch.com/)

---

## 🚀 Hosting Notes

For platforms like **Render** or **Wispbyte**, make sure:
- Your `Start Command` is set to:
  ```bash
  node aiBot.js
  ```
- The bot is set as a **background worker** (no need for HTTP port)
- Environment variables are defined in the host’s UI

---

## 🤝 Acknowledgments

- [Shapes Inc.](https://shapes.inc)
- [OpenAI-compatible API developers]
- All contributors to [ShapesRelay](https://github.com/DroidWizardNyxx/ShapesRelay)

---

## ❌ Disclaimer

This bot is not endorsed by or affiliated with Discord or Shapes Inc.  
It is provided for learning and experimentation only.  
You are fully responsible for how you host and operate this bot.
