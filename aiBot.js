
require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const mongo = new MongoClient(process.env.MONGODB_URI);
const relayURL = process.env.SHAPES_RELAY_URL;
const geminiKey = process.env.GEMINI_API_KEY;

client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
  const isMention = mentionRegex.test(message.content.trim());
  const isCommand = message.content.startsWith('!s ');
  const isReplyToBot = message.reference && message.mentions.repliedUser?.id === client.user.id;

  await mongo.connect();
  const db = mongo.db('shapeBot');
  const dedicatedCol = db.collection('dedicatedChannels');
  const dedicated = await dedicatedCol.findOne({ guildId: message.guildId });

  const isDedicatedChannel = dedicated?.channelId === message.channel.id;
  const isForced = isMention || isCommand || isReplyToBot || isDedicatedChannel;
  const isChance = process.env.ENABLE_PASSIVE_IA === 'true' && Math.random() < 0.1;
  if (!isForced && !isChance) return;

  await message.channel.sendTyping();

  const rawPrompt = message.content
    .replace(mentionRegex, '')
    .replace(/^!s /, '')
    .trim();

  const username = message.member?.nickname || message.author.username;
  const textPrompt = rawPrompt ? `User ${username} said: ${rawPrompt}` : null;

  const attachments = message.attachments;
  let imageUrl = null;
  let audioUrl = null;

  attachments.forEach(att => {
    const url = att.url.toLowerCase();
    if (url.match(/\.(jpg|jpeg|png|webp)$/)) imageUrl = att.url;
    if (url.match(/\.(mp3|wav|ogg)$/)) audioUrl = att.url;
  });

  let content = [];
  if (textPrompt) content.push({ type: 'text', text: textPrompt });
  if (audioUrl) content.push({ type: 'audio_url', audio_url: { url: audioUrl } });
  else if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } });

  let payload = {
    prompt: content.length === 1 && content[0].type === 'text' ? content[0].text : content,
    user_id: message.author.id,
    channel_id: message.channel.id
  };

  if (isChance) {
    try {
      const msgs = await message.channel.messages.fetch({ limit: 10 });
      const history = [...msgs.values()]
        .filter(msg => !msg.author.bot)
        .reverse()
        .map(msg => ({ user: msg.member?.nickname || msg.author.username, message: msg.content }));

      const topic = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [{ parts: [{ text: `Two users are chatting. Here are the messages:\n${JSON.stringify(history)}\nDescribe the topic directly.` }] }]
        },
        { params: { key: geminiKey } }
      );

      const description = topic.data.candidates?.[0]?.content?.parts?.[0]?.text || 'unknown';

      const decision = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [{ parts: [{ text: `Users are talking about ${description}. If it's appropriate for the bot to respond, say "true", otherwise say "false".` }] }]
        },
        { params: { key: geminiKey } }
      );

      if (decision.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() !== 'true') return;
      payload.prompt = JSON.stringify(history);
    } catch (e) {
      console.warn('Gemini error:', e.message);
      return;
    }
  }

  try {
    const { data } = await axios.post(relayURL, payload, { timeout: 30000 });
    let response = data.response;

    const callbacks = {
      deepthink: /<Deepthink:\s*(.*?)>/gi,
      image: /<imageGenerate:\s*(.*?)>/gi,
      codeSimple: /<codeSimple(?:\((.*?)\))?:\s*(.*?)>/gi
    };

    let matched = false;

    for (const [type, regex] of Object.entries(callbacks)) {
      let match;
      while ((match = regex.exec(response)) !== null) {
        matched = true;

        switch (type) {
          case "deepthink":
            const thought = `<raciocínio>: The user wants: ${match[1]}. What do you think should be done?`;
            const res = await axios.post(relayURL, {
              prompt: thought,
              user_id: message.author.id,
              channel_id: message.channel.id
            });
            response = res.data.response;
            break;

          case "image":
            const img = await axios.get(`https://lexica.art/api/v1/search?q=${encodeURIComponent(match[1])}`);
            if (!img.data.images || !img.data.images.length) {
              return await message.reply('❌ No image found.');
            }
            return await message.reply({ files: [img.data.images[0].src] });

          case "codeSimple":
            const ext = match[1] || 'txt';
            const prompt = match[2];
            const code = await axios.post(relayURL, {
              prompt: `<raciocínio>: Generate a code for this task. Only return the code.

${prompt}`,
              user_id: 'code-simple',
              channel_id: 'code-channel'
            });

            const extracted = code.data.response.match(/```(?:\w*\n)?([\s\S]*?)```/);
            const finalCode = extracted ? extracted[1] : code.data.response.trim();
            const buffer = Buffer.from(finalCode, 'utf-8');
            const file = new AttachmentBuilder(buffer, { name: `code.${ext}` });

            return await message.reply({ files: [file] });
        }
      }
    }

    if (!matched) {
      await message.reply(response);
    }

  } catch (err) {
    console.error('[Relay Error]', err.message);
    await message.reply('❌ Failed to reach AI service.');
  }
});

client.login(process.env.DISCORD_TOKEN);
