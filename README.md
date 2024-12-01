# 🍉 TurboWarp 🗡

TurboWarp is a flexible, real-time Code.org emulator that runs in your browser. It's designed to be fast, lightweight, and easy to use.


# Build Guide

> ## Table of Contents
- [Overview](#overview) a brief summary of what the engine is
- [Publishing](#publishing) instructions on how to add a project into [WatermelonKatana](https://watermelonkatana.com)
- [Applab](#applab) goes over the Do's and Don'ts of Applab and what to expect when you publish an Applab project.
- [Gamelab](#gamelab) goes over the Do's and Don'ts of Gamelab and what to expect when you publish an Gamelab project.
- [FAQ](#faq) runs over some commonly asked questions I don't care to answer anymore.

>## Overview

This guide will mainly focus on any project that you have made and wish to run in Turbowarp. You also acknowledge that this compiler is not perfect! Any issues pertaining to specific icons or URL paths may break and may require project modification/porting to allow it to run on this platform for the compiler that is being served to you.

The main upside of this engine is that it allows **most of the ES5 capabilities** and all of the ES6 ones to be free from the interpreter slowdown. We also supply a TTS alternative since CDO does not provide the Azure key if your program uses any form of that. Additionally, we handle the storage for projects on our side as well as compiling libraries not in the source code. CDO has not provided a way to easily support database sharing; however, there is a way of transferring the data manually to WatermelonKatana if you wish later on in the guide. Last but not least is our scaler to make the projects more presentable when running them.

>## Publishing

Our first step toward seeing how compatible your project is with the interpreter is to publish your project!

To do this, you must first make an [Account](https://watermelonkatana.com/register). If you already have one, feel free to [Sign In](https://watermelonkatana.com/login) to continue.

Great job! Now there should be a [Publish](https://watermelonkatana.com/publish) button on the homepage, which will guide you there, or you can follow the link provided if unsure. From there, you can start filling out the information to start publishing your first project. It should be filled out in the following format:

**Name**
- The name of your project. You can shorten or name it however you'd like, so long as it complies with our [Guidelines]()

**Link**
- The full link to your code.org project. **PLEASE DO NOT PUT JUST THE ID!** `https://studio.code.org/projects/<type>/<id>`

**Description**
- Optional, very useful for stating any controls or any lost games that you can credit the original author with *(unforunately some have not left any credit; try to look for it if possible.)* 

**Thumbnail**
- Optional: WatermelonKatana will try to use your project thumbnail from Code.org by default; however, you are free to make a custom thumbnail to make your project more appealing rather than just having it be a frame of gameplay.

**Project Data**
- Optional: This will only appear when publishing CDO games to allow users to populate storage from previous games if necessary. Specific games like [Geometry Dash](https://watermelonkatana.com/project/66c3fdab4f7e70aac89f4659) which stores its level data inside of the project. This may be one of many such cases to allow your project to run without hiccups.
To do this in the easiest way possible, I have automated the data exfiltration process. If this does not apply to you, feel free to [Skip](#skipped-data-export) this step.

1. Navigate to your code.org project.
2. Copy this code below into the inspect console and then hit `Enter.`
```js
const link = location.href.match(new RegExp(`(?<=(applab|gamelab)/)[^/]+|^[^/]+(?!/)$`));
const id = link[0];
const path = `/datablock_storage/${id}/`;
const storage = { keys: {}, tables: {} };

(async function Main(type) {
    switch (type) {
        case "applab":
            await getTables();
        case "gamelab":
            await getKeyValues();
            const anchor = document.createElement("a");
            anchor.href = URL.createObjectURL(new Blob([JSON.stringify(storage)], {type: "text/json"}));
            anchor.download = `${type}_${id}_storage.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.removeChild(anchor);
            break;
        default:
            throw "storage medium not supported";
    }
})(link[1])


async function getKeyValues() {
    try {
        storage.keys = (await (await fetch(path + "get_key_values")).json());
        for(let k in storage.keys) {
            storage.keys[k] = JSON.stringify(storage.keys[k])
        }
    } catch (err) {
        throw "unable to complete request: " + err;
    }
}

async function getTables() {
    let tableNames = (await (await fetch(path + "get_table_names")).json());
    for (let name of tableNames) {
        try {
            storage.tables[name] = (await (await fetch(path + "read_records?table_name=" + name)).json());
        } catch (err) {
            throw `unable to append table "${name}" with code: ${err}`
        }
    }
}
```
3. You should receive a JSON file from the download client; make sure it is in .json and that there have not been any formatting errors. It must be `<= 10 MB` in size.
4. Copy and Paste the exported data into the project into the **Project Data** section.
5. If you want to add or fix any data later, don't worry. You'll be able to modify this data later if necessary. **(I am not responsible for helping you fix the json files if you so choose to manually edit them!)**

<span id="skipped-data-export"><b> Tags (separate with comma) </b></span>

- You must have at least 3 tags minimum to be able to publish your project. Why you may ask? That's simple; since there are many projects already on our site, many users may just search for a specific category or tag they enjoyed from a previous game. Being concise and descriptive will help you reach a wider audience of players more effectively.

**Mature**
- If your game has any type of profanity/nudity sexually explicit content that would be offensive to younger audiences, we kindly ask you to mark this box. Failing to comply may have the project restricted manually or will be completely pulled if not marked correctly.

**Hidden**
- Testing your games before making them live for everyone else to see is important! This box here is here for private testing if you don't want others to see it until you're ready to showcase it.

And with that, you're now ready to publish! Below will be quirks and specifics about the modified game engines, basically the Dos and Don'ts of using the engine without the CDO interpreter.

>## **Applab**

### **Do's**

- allows es6
- supports most datablock_storage requests
- has all CDO implemented methods for Applab runtime environment
- has pollyfilled array method arguments for ES5
- has dynamic upscaler & allows for custom HTML scaling for fullscreen applications

### **Don'ts**

- don't use baseURI directly (it will return different data).
- don't use relative paths <br>
`/v3/assets/<id>/<asset>`  ❌ <br>
`https://studio.code.org/v3/assets/<id>/<asset>` ✅
- don't set any global variables that may interfere with the windowed runtime environments.
- don't override EXPORT_OPTIONS. It's the environment uptime keeper.

>## **Gamelab**

### **Do's**

- allows es6
- supports set & get keyvalues
- has all CDO implemented methods for the GameLab runtime environment.
- has pollyfilled array method arguments for ES5
- has an upscaler that runs the game on a bigger screen
- emulates relative paths for assets

### **Don'ts**

- don't set any global variables that may interfere with the windowed runtime environments.
- don't override this list of runtime variables.
    - p5
    - p5Inst
    - \_FCONFIG\_

Setting any of these variables to a different value can and will break your program. To avoid this, remove any global declarations of these variables in your program.

>## **FAQ**

Q: Why can't I run my projects from Code.org's export option?
- A: <br> Well, it hasn't been maintained for years; major work had to be done to get this up and running.

Q: Why can't we use code.org's storage base instead of this separate one?
- A:
    - It violates code.org's TOS in their robots.txt for scraping & updating data.
    - It requires much more effort trying to manage a scraper over my own storage and call base.
    - It is more stable, and I should not have to change it for a while without stuff breaking.
    - I'm lazy af (▀̿Ĺ̯▀̿ ̿)

However, if they had stayed on Firebase and didn't migrate, managing crossplay storage would be viable but too bad.

Q: My project has weird font issues when it comes to icons?
- A: <br> Before, no icons would appear, so it's better than nothing! As to the reason, I'm unsure myself, as all the font & font paths are included in the CSS directory I had to make for Applab. So perhaps someone more knowledgeable can try to fix it, but it only happens on like 1 project that kind of does generate the icons after a few reloads; it's pretty much a non-issue at the moment.

Q: Why can't I change the TTS voice gender?
- A: <br> the TTS standin that is currently being used does not support this; it is still passed through the request if you want to run your own implementation of the service at some point. It's barely ever used, so I don't plan on upgrading the module that runs it anytime soon.

Q: Why can't you emulate it 100%?
- A: <br> It would defeat the purpose of trying to make projects faster. See Code.org uses an interpreter for their projects, which allows for a few things to be done that can't be accomplished within my environment, but their program runs several times slower since I am running the project without any interpreters. Much of the P5 library & the respective Applab & Gamelab APIs have been modified significantly for this purpose.