const djs = require('discord.js')
const fs = require("fs/promises")
const dotenv = require('dotenv')

// load token data
dotenv.config()

if(!process.env.TOKEN) {
    console.error("no token found in .env\nplease yell at moonbarc\nthanks")
    process.exit(1)
}

const bot = new djs.Client()

let waiting = []
let phrases = ["gib cookie"]

async function loadPhrases() {
    try {
        phrases = JSON.parse(await fs.readFile(__dirname + "/phrases.json"))
    }catch(e) {
        console.error("Failed to parse phrases! D:")
    }
}

bot.on("message",async (m) => {
    if(m.author.bot) return;
    if(waiting.includes(m.author.id)) return;
    var mc = m.content.toLowerCase().replace(/\!/g,"").replace(/\./g,"").replace(/\?/g,"").replace(/i'm/g,"im")
    if(phrases.includes(mc)) {
        if(m.channel.id == "813865037239156736") {
            const errm = await m.reply("that's already a phrase.")
            setTimeout(() => {
                try {
                    errm.delete()
                    m.delete()
                }catch(e) {
                    console.warn("no permission to delete message or something went oopsie")
                }
            },3000)
            return;
        }
        m.channel.send("Take a cookie! :)")
        m.channel.send("🍪")
        waiting.push(m.author.id)
        setTimeout(() => {
            waiting = waiting.filter(e => e !== m.author.id);
        },2000)
        return
    }
    if(m.content.toLowerCase() == "🍪reload" || m.content.toLowerCase() == "🍪 reload") {
        if(m.author.id != "285810061672972290") return;
        loadPhrases().then(() => {
            m.channel.send("[🍪] Reload successful! :D")
        })
        return
    }
})

process.on("SIGINT",async () => {
    await bot.user.setStatus("dnd")
    process.exit(0)
})

bot.login(process.env.TOKEN).then(() => {
    console.log("Bot logged in!")
    loadPhrases()
})