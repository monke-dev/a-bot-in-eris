const cmd = require("../../cmd");

module.exports = class Help extends cmd{
    constructor(Bot){
        super(Bot, {
            name: "greyscale",
            alli: [],
            category: "ImageManipulation",
            usage: "greyscale [ user ]",
            bPerms: ["attachFiles"],
            mPerms: ["sendMessages"],
            cooldown: 5000,
            description: "Lay a greyscale filter over a image",
        });
    };


    async runCmd(msg, args, data) {

        let user = msg.mentions[0] || await msg.channel.guild.members.find(x => x.username.toLowerCase() == args.join(" ").toLowerCase()) || await this.bot.users.get(args[0]);
        let imgURl;
        if(user){
            imgURl = user.staticAvatarURL;
        }else{
            imgURl = await this.bot.getLastChannelImage(msg.channel);
        }

        if(!imgURl) return msg.channel.sendErrEmbed("I could not find an image in this channel")

        let Iserr = null
        let file = await this.bot.ImageManipulation.greyscale(imgURl).catch(err => {
            Iserr = err.message
        })
        if(Iserr != null) return msg.channel.sendErrEmbed(`${Iserr}\n[Support server](${this.bot.config.SupportServer})`)

        msg.channel.send("", {name: "Greyscale.png", file: file});

        
    };


}; 