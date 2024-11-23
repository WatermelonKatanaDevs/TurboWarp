# 🍉 TurboWarp 🗡

TurboWarp is a flexible, real-time code.org emulator that runs in your browser. It's designed to be fast, lightweight, and easy to use.


# Build Guide

> ## Table Of Contents
- [Overview](#overview) a brief summary of what the engine is
- [Publishing](#publishing) instructions on how to add a project into [WatermelonKatana](https://watermelonkatana.com)
- [Applab](#applab) goes over the Do's and Don'ts of Applab and what to expect when you publish an Applab project
- [Gamelab](#gamelab) goes over the Do's and Don'ts of Gamelab and what to expect when you publish an Gamelab project
- [FAQ](#faq) runs over some commonly asked questions i don't care to answer anymore

>## Overview

This guide will mainly focus on any project that you have made and wish to run in Turbowarp and that you acknowledge that it will have issues weather it be with specific icons or URL paths not matching this interpreter is not 100% accurate and may require project modification/porting to allow it to run on this platform

>## Publishing

Our first step toward seeing how compatible your project is torward the interpreter is to publish your project!

To do this you must first make an [account](https://watermelonkatana.com/register). if you already have one feel free to [sign in](https://watermelonkatana.com/login) to continue.

Great job now there should be a [publish](https://watermelonkatana.com/publish) button on the homepage of which will guide you there or you can follow the link provided if unsure. from there you can start filling out the information to start publishing your first project it should be filled out in the following format

**Name**
- The name of your project. You can shorten or name it however you'd like so long as it complies with our [guidelines]()

**Link**
- The full link to your code.org project **DO NOT PUT JUST THE ID!** `https://studio.code.org/projects/<type>/<id>`

**Description**
- Optional, very useful for stating any controls or any lost games that you can credit the original author with *(unforunately some have not left any credit try to look for it if possible)* 

**Thumbnail**
- Optional, by default it will try to use your project thumbnail from code.org however you are free to make a custom thumbnail to make your project more appealing rather than just having it be a frame of gameplay

**Project Data**
- Optional, this will only appear when publising CDO games to allow users to populate storage from previous games if necessary specific games like [Geometry Dash](https://watermelonkatana.com/project/66c3fdab4f7e70aac89f4659) which stores it's level data inside of the project may be one of many such cases to allow your project to run without hiccups.
To do this in the easiest way possible I have automated the data exfiltration process if this does not apply to you feel free to [skip](#skipped-data-export) this step

1. Navigate to your code.org project
2. Copy this code below into the inspect console and then hit `Enter`
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
3. You should recive a json file from the download client make sure it is in .json and that there have not been any formatting errors it must be `<= 10mb` in size
4. Copy and Paste the exported data into the project into the **Project Data** section
5. if you want to add or fix any data later don't worry.You'll be able to modify this data later if necessary **(I am not responsible for helping you fix the json files if you so choose to manually edit them!)**

<div id="skipped-data-export"></div>
**Tags (separate with comma)**
- You must have at least 3 tags minimum to be able to publish your project. Why you may ask? That's simple, since there are many projects already on our site many users may just search for a specific category or tag they enjoyed from a previous game. Being concise and descriptive will help you reach a wider audience of players more effectively

**Mature**
- If your game has any type of profanity/nudity sexually explicit content that would be offensive to younger audiences we kindly ask you to mark this box. Failing to comply may have the project restricted manually or will be completely pulled if not marked correctly

**Hidden**
- Testing your games before making them live for everyone else to see is important! this box here is here for private testing if you don't want others to see it until your ready to showcase it.

And with that your now ready to Publish! Below will be quirks and specifics about the modified game engines basically the Do's and Don'ts of using the engine without the CDO interpreter

>## **Applab**

### **Do's**

- allows es6
- supports most datablock_storage requests
- has all CDO implemented methods for Applab runtime eviroment
- has pollyfilled array method arguments for es5
- has dynamic upscaler & allows for custom html scaling for fullscreen applications

### **Don'ts**

- don't use baseURI directly (it will return different data)
- don't use relative paths 
`/v3/assets/<id>/<asset>`  ❌
`https://studio.code.org/v3/assets/<id>/<asset>` ✅
- don't set any global varriables that may interfere with the windowed runtime enviroments
- don't override EXPORT_OPTIONS it's the enviroment uptime keeper

>## **Gamelab**

### **Do's**

- allows es6
- supports set & get keyvalues
- has all CDO implemented methods for Gamelab runtime eviroment
- has pollyfilled array method arguments for es5
- has upscaler that runs the game in a bigger screen
- emulates relative paths for assets

### **Don'ts**

- don't set any global varriables that may interfere with the windowed runtime enviroments
- don't override this list of runtime varriables
    - p5
    - p5Inst
    - \_FCONFIG\_

Setting any of these varriables to a different value can and will break your program. to avoid this remove any global declarations of these variables in your program

>## **FAQ**

Q: Why can't i run my projects from code.org's export option?
- A: <br> well it hasn't been maintained for years major work had to be done to get this up and running

Q: Why can't we use code.org's storage base instead of this seperate one?
- A:
    - It violates code.org's TOS in there robots.txt for scraping & updating data
    - It requires much more effort trying to manage a scraper over my own storage and call base
    - It is more stable and i should not have to change it for a while without stuff breaking
    - I'm lazy af (▀̿Ĺ̯▀̿ ̿)

However if they had stayed on firebase and didn't migrate managing crossplay storage would be viable but too bad.

Q: My project has weird font issues when it comes to icons?
- A: <br> well before no icons would appear so it's better than nothing! as to the reason I'm unsure myself as all the font & font paths are included in the CSS directory I had to make for Applab. So perhaps someone more knowledable can try to fix it but it only happens on like 1 project that's kinda does generate the icons after a few reloads it's pretty much a non issue at the moment

Q: Why can't you emulate it 100%?
- A: <br> it would defeat the purpose of trying to make projects faster. See code.org uses an interpreter for their projects which allows for a few things to be done that can't be accomplished within my enviroment but there program runs several times slower since i am running the project without any interpreters. much of the p5 library & the respective Applab & Gamelab API's has been modified significantly for this purpose
