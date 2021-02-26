const djs = require('discord.js')
const fs = require("fs").promises
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
let config = {}
let commands = []
let emojis = []

async function loadPhrases() {
    try {
        phrases = JSON.parse(await fs.readFile(__dirname + "/phrases.json"))
    }catch(e) {
        console.error("Failed to parse phrases! D:")
    }
    try {
        emojis = JSON.parse(await fs.readFile(__dirname + "/emojis.json"))
    }catch(e) {
        console.error("Failed to parse emojis! D:")
    }
    try {
        config = JSON.parse(await fs.readFile(__dirname + "/config.json"))
    }catch(e) {
        console.error("Failed to parse config! D:")
    }
    try {
        commands = JSON.parse(await fs.readFile(__dirname + "/commands.json"))
    }catch(e) {
        console.error("Failed to parse commands! D:")
    }
    try {
        waiting = JSON.parse(await fs.readFile(__dirname + "/blacklisted.json"))
    }catch(e) {
        console.error("Failed to parse blacklisted people! D:")
    }
}

bot.on("message",async (m) => {
    if(m.author.bot) return;
    if(m.content.toLowerCase().startsWith("🍪unblacklist") || m.content.toLowerCase().startsWith("🍪 unblacklist")) {
        if(!config.admins.includes(m.author.id)) return;
        waiting.push(m.content.split(">")[1])
        var current = await fs.readFile(__dirname + "/blacklisted.json")
        var arr = JSON.parse(current)
        arr = arr.filter(e => e != m.content.split(">")[1])
        await fs.writeFile(__dirname + "/blacklisted.json",JSON.stringify(arr))
        waiting = waiting.filter(e => e != m.author.id)
        m.channel.send("[🍪] Unblacklist successful! :D")
        return
    }
    if(waiting.includes(m.author.id)) return;
    var mc = m.content.toLowerCase().replace(/\!/g,"").replace(/\./g,"").replace(/\?/g,"").replace(/i'm/g,"im")
    if(phrases.includes(mc)) {
        if(m.channel.id == config.phraseSuggestChannel) {
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
        m.channel.send(config.message)
        m.channel.send("🍪")
        waiting.push(m.author.id)
        setTimeout(() => {
            waiting = waiting.filter(e => e !== m.author.id);
        },4000)
        return
    }
    if(m.content.toLowerCase() == "🍪reload" || m.content.toLowerCase() == "🍪 reload") {
        if(!config.admins.includes(m.author.id)) return;
        loadPhrases().then(() => {
            m.channel.send("[🍪] Reload successful! :D")
        })
        return
    }
    if(m.content.toLowerCase() == "🍪register" || m.content.toLowerCase() == "🍪 register") {
        if(!config.admins.includes(m.author.id)) return;
        for(var c of commands) {
            await bot.api.applications(bot.user.id).guilds(m.guild.id).commands.post({data: c})
        }
        console.log(await bot.api.applications(bot.user.id).guilds(m.guild.id).commands.get())
        m.channel.send("[🍪] Added commands! :D")
        return
    }
    if(m.content.toLowerCase().startsWith("🍪blacklist") || m.content.toLowerCase().startsWith("🍪 blacklist")) {
        if(!config.admins.includes(m.author.id)) return;
        waiting.push(m.content.split(">")[1])
        var current = await fs.readFile(__dirname + "/blacklisted.json")
        var arr = JSON.parse(current)
        arr.push(m.content.split(">")[1])
        await fs.writeFile(__dirname + "/blacklisted.json",JSON.stringify(arr))
        m.channel.send("[🍪] Success :(")
        return
    }
    if(m.content.toLowerCase().startsWith("🍪delc") || m.content.toLowerCase().startsWith("🍪 delc")) {
        if(!config.admins.includes(m.author.id)) return;
        await bot.api.applications(bot.user.id).guilds(m.guild.id).commands(m.content.split(">")[1]).delete()
        m.channel.send("[🍪] Successfully deleted command! :/")
        return
    }
    if(m.channel.id == config.emojiSuggestChannel) {
        await m.react("✅")
        m.react("🔻")
        return
    }
    if(m.channel.id == config.phraseSuggestChannel) {
        await m.react("✅")
        m.react("🔻")
        return
    }
})

bot.ws.on('INTERACTION_CREATE', async interaction => {
    if(waiting.includes(interaction.member.user.id)) return;
    waiting.push(interaction.member.user.id)
    setTimeout(() => {
        waiting = waiting.filter(e => e !== interaction.member.user.id)
    },5000)
    if(!interaction?.data?.options || !interaction?.data?.options?.length) {
        await bot.api.interactions(interaction.id, interaction.token).callback.post({data: 
            {
                type: 3,
                data: {
                    content: `Here's your cookie, <@${interaction.member.user.id}>!`
                }
            }
        })
        bot.channels.cache.get(interaction.channel_id).send("🍪")
        return;
    }
    // do stuff and respond here
    await bot.api.interactions(interaction.id, interaction.token).callback.post({data: 
        {
            type: 3,
            data: {
                content: interaction.data?.options[1]?.value ? `<@${interaction.data.options[0].value}>, someone gave you a cookie!` : `<@${interaction.data.options[0].value}>, you got a cookie from <@${interaction.member.user.id}>!` 
            }
        }
    })
    bot.channels.cache.get(interaction.channel_id).send("🍪")
})

process.on("SIGINT",async () => {
    await bot.user.setStatus("dnd")
    process.exit(0)
})

bot.login(process.env.TOKEN).then(() => {
    console.log("Bot logged in!")
    loadPhrases()
})