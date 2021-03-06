require("dotenv").config();

const eris = require("eris");
const logger = require("../helpers/logger");
const ImageManipulation = require("../helpers/ImageManipulation")

const Schems = require("./Mongo/SchemsExports");
const fetch = require("node-fetch");


module.exports = class Bot extends eris.Client{
    constructor(token, options){
        super(token, options);
        
        this.cmds = new Map(); //Bot commds
        this.alli = new Map(); //Bot alias(es)
        this.unLoadedCmds = new Map(); //unloaded cmds
        this.cooldown = new Map(); // command cooldown

        this.logger = new logger(this, process.env.logWebHookId, process.env.logWebhookToken); //Logs
        this.config = require("../../config.json"); //Config
        this.colors = require("../../colors"); //Colors
        this.ImageManipulation = new ImageManipulation({defaultImageFormat: "png"})

        this.snipes = new Map();

    
    };

    loadCmd(cmdPath){ //Loads a command

        try{
            const file = new (require(cmdPath))(this);
            this.cmds.set(file.cmd.name, file);
            file.cmd.alli.forEach(alli => {
                this.alli.set(alli, file);
            });
            this.logger.green(`Loaded command: ${file.cmd.name}`);
        }catch(err){
            this.logger.yellow(`Can not load command @ ${cmdPath}, ${err}`);
        }

    };

    async unLoadCmd(cmdName){
        let cmd = await this.cmds.get(cmdName);
        if(!cmd) return null;
        try{
            this.cmds.delete(cmd.cmd.name);

            this.unLoadedCmds.set(cmd.cmd.name, cmd)
            cmd.cmd.alli.forEach(alli => {
                this.alli.delete(alli);

                this.unLoadedCmds.set(alli, cmd)
            })
        }catch(err){
            return err;
        }

        return cmd.cmd;
    }

    loadEvent(eventPath, bot){ //Loads a event
        try{
            let eventFile = new (require(eventPath))(this);
            let eventName = eventPath.split("/")[2].split(".")[0];
            //bot.on(eventName, (...args) => eventFile.runEvent(...args));
            this.on(eventName, (...args) => eventFile.runEvent(...args));
            this.logger.lightGreen(`Event loaded: ${eventName}`);
        }catch(err){
            this.logger.yellow(`Can not load command @ ${eventPath}, ${err}`);
        }
    }

    async getPrefix(guildID){
        let data = await Schems.guild.findOne({id: guildID})
        if(!data){
            await new Schems.guild({id: guildID}).save();
            data = await Schems.guild.findOne({id: guildID});
        }
        return data.config.prefix;
    }

    async getGuildData(guildID){ //Gets a guilds data from mongo
        let data = await Schems.guild.findOne({id: guildID})
        if(!data){
            await new Schems.guild({id: guildID}).save();
            data = await Schems.guild.findOne({id: guildID});
        }
        return data;
    }

    async getUserData(userID){ //gets a users data from mongo
        let data = await Schems.user.findOne({id: userID});
        if(!data){
            await new Schems.user({id: userID}).save();
            data = await Schems.user.findOne({id: userID});
        }
        return data;
    }

    async getOtherData(id){
        let data = await Schems.otherData.findOne({id: id ? id : "otherData"});
        if(!data){
            await new Schems.otherData({id: id ? id : "otherData"}).save();
            data = await Schems.otherData.findOne({id: id ? id : "otherData"});
        }
        return data;
    }

    async getLastChannelImage(channel){
        let fetched = await channel.getMessages(50);
        let IMGurl = null;
        await fetched.forEach(msg =>{
            if(IMGurl != null) return;
            if(!msg.attachments[0]) return;
            if(msg.attachments[0].url.endsWith(".png") || msg.attachments[0].url.endsWith(".jpeg") || msg.attachments[0].url.endsWith(".jpg")) IMGurl = msg.attachments[0].url
        })
        return IMGurl;
    }

    async postBin(input){
        let info;
        await fetch("https://hasteb.in/documents", {
            method: "POST",
            body: input,
            headers: {
                "Content-Type": "text/plain"
            }
        }).then(res => res.json())
            .then(json => {
                info = json.key;
            });
        return info;
    }


    async downLoadVideo(url){
        let Fetched = await fetch(url);
        return Fetched.buffer();
    }

};