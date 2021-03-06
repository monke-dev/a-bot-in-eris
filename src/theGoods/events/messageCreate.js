const data = {};
const prettyMs = require("pretty-ms")
const mongo = require("mongoose");
module.exports = class{
    constructor(bot){
        this.bot = bot;
        this.cooldown = this.bot.cooldown
    }

    async handleCooldown(id, cmd, msg){
        let coolDown = await this.cooldown.get(`${id}_${cmd.cmd.name}`);
        if(coolDown){
            return msg.channel.sendErrEmbed(`You are in cooldown still, Time left: ${prettyMs(cmd.cmd.cooldown - (Date.now() - coolDown) )}`)
        }else{
            this.cooldown.set(`${id}_${cmd.cmd.name}`, Date.now());
            setTimeout(() => {
                this.cooldown.delete(`${id}_${cmd.cmd.name}`)
            }, cmd.cmd.cooldown);
        }
    }

    async runEvent(msg){



        if(msg.author.bot || !msg.channel.guild) return;

        data.server = await this.bot.getGuildData(msg.channel.id);
        data.otherData = await this.bot.getOtherData();

        if(data.otherData.blackList.users.includes(msg.author.id) && msg.author.id != this.bot.config.owner || data.otherData.blackList.guilds.includes(msg.channel.guild.id) && msg.author.id != this.bot.config.owner) return;


        if(!msg.content.startsWith(data.server.config.prefix)) return;

        let userCmd = msg.content.toLowerCase().split(" ")[0].slice(data.server.config.prefix.length);
        let args = msg.content.slice(userCmd.length + 2).split(" ")

        let cmdFile = await this.bot.cmds.get(userCmd) || this.bot.alli.get(userCmd)
        if(!cmdFile) return;

        if(cmdFile.cmd.category == "Owner" && msg.author.id != this.bot.config.owner) return msg.channel.sendErrEmbed("This is a owner only command")

        let userPerms = msg.channel.permissionsOf(msg.author.id);
        let botPerms = msg.channel.permissionsOf(this.bot.user.id);

        if(!botPerms.has("embedLinks")){
            try{
                let dmChannel = await msg.author.getDMChannel();
                return dmChannel.sendErrEmbed(`I do not have **embedLinks** permission in **${msg.channel.guild.name}**, Please give me this permission or tell someone to`)
            }catch(err){
                this.bot.logger.yellow(err)
            }
        }

        let neededPerms = [];
        cmdFile.cmd.mPerms.forEach(perm => {
            if(!userPerms.has(perm)) neededPerms.push(perm)
        })
        if(!neededPerms.length == 0)return msg.channel.sendErrEmbed(`Your are missing permissions to do this: \`${neededPerms.join("`, `")}\``)

        let needPermsBot = [];
        
        cmdFile.cmd.bPerms.forEach(perm => {
            if(!botPerms.has(perm)) needPermsBot.push(perm)
        })
        if(!needPermsBot.length == 0) return msg.channel.sendErrEmbed(`I am missing permissions to do this: \`${needPermsBot.join("`, `")}\``)
        

        let inCooldown = await this.handleCooldown(msg.author.id, cmdFile, msg);
        if(inCooldown) return;

    

        try{
            cmdFile.runCmd(msg, args, data)

            let userData = await this.bot.getUserData(msg.author.id);
            userData.cmdsUsed += 1;

            let botData = await this.bot.getOtherData();
            botData.totalCmdsUsed += 1;

            userData.save();
            botData.save();
        }catch(err){
            this.bot.logger.red(err)
        }
    }
}