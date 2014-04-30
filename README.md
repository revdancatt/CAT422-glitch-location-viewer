CAT422-glitch-location-viewer
=============================

![Landscape](http://revdancatt.github.io/CAT422-glitch-location-viewer/img/landscape1.jpg)

This code is an attempt to bring Glitch landscapes back to life, and maybe even eventually walk around them and chat with other people. In the meantime try out the viewer here, maybe it'll work!: http://mvurxi.com

Read the blogpost ["Rebuilding Ur, bringing back the beauty of Glitch locations"](http://revdancatt.com/2013/11/26/slowly-bringing-glitch-back-to-life/) for more information.

See the TODO list down at the end for more information

## Viewer

The viewer is here: http://mvurxi.com and is just an example of how you can load in the location .json files and render thelandscape with the .png files.

Its not tested on all browsers and is for demo purposes only.

## Server

The backend server can be found here: https://github.com/revdancatt/CAT424-glitch-backend

## Location JSON files

All the locations in the game have been converted from their original [.xml files](https://github.com/tinyspeck/glitch-locations) into JSON files. Not all the content in the .xml has been ported over to the JSON *yet*, but there's enough to build the scene. You can find them in the `locations` directory.

Each file has two formats `.json` and `.callback.json`. The `.json` file is what you'll generally use if you're loading in the data to a backend (or making a proxy .json loader that adds a callback).

If you want to load the data into javascript from github, then use the `.callback.json` files, in jQuery you would do something like this...

`$.getScript('http://revdancatt.github.io/CAT422-glitch-location-viewer/locations/GLIERMJ93DE1H25.callback.json');`

...which has a built in callback, you'll need a root function getRoom, rather like this...

`function getRoom(dataJSON) {
    console.log(dataJSON);
    // pass the dataJSON back to something else
}
`

## Scenery .pngs

Nearly all the scenery objects (_not sprites and other characters & objects_) have been converted to .png files. Not all the images made it and I'll be adding them by hand over time as I figure them out.

Note the directory structure has been flattened, all the .pngs now sit in a single directory `/img/scenery`.

[Example Image would be here](http://revdancatt.github.io/CAT422-glitch-location-viewer/img/scenery/house_medium_01.png)

![Example Image would be here](http://revdancatt.github.io/CAT422-glitch-location-viewer/img/scenery/house_medium_01.png)

## Tools

There's a few tools that I used to convert all the stuff, that you can find in the `tools` directory.

#### 1
`convert-fla-to-png.jsfl` is a script file for Adobe Flash CC, go to *commands* | *Run Command...* and open the `convert-fla-to-png.jsfl` file. This will ask you for an `input` directory which contains the .fla files from Glitch, it will attempt to open then and export them as .png files to a parallel directory called `output`.

You don't _need_ to use it, as you can just use the .pngs hosted here. But it's there for reference. *Note:* at the moment you have to babysit the script when it hits a file it can't convert, I'll fix this in some future version.

#### 2

`convert-locations.coffee` ... you need to compile this to .js obviously and run it with Node, you'll need to `npm install xml2js` to ge the xml2js lib. This converts the games .xml files into .json files. Again it's just here for reference as you can use the .json files hosted here. But maybe you want to convert over more stuff, like doors and ladders and what not.

## TODO


* Lots of optimisation
* Lots of bug fixes :) 
* Add signposts to the scene so the user can move from one location to another using those
* Convert the Path lines and walls into the JSON to, so we know where a play can walk
* Work out which bits of scenery are missing (these now display in a debug text area)
* At some point move image assets to CDN on multiple domains and parallelise the loading of assets
* Apply the filters to change the colours
* Option checkbox to turn blurring on/off (blurring slows everything down)
* ~~Impliment global and local chat~~
* ~~Allow users to change their name~~
* ~~Add a simple node/socket.io chat server~~
* ~~Add a player sprite to the scene and let them walk round~~
* ~~Loading Progress Bar, when loading levels~~
* ~~Maybe render to canvas layers instead, may speed the blurring up~~ (note, blurring a whole canvas is still slow, will need to blur images in code before sticking them on the canvas, tricky!)
* ~~Work out how the heck Glitch rotates pieces of the landscape, 'cause it sure hell ain't normally :(~~
* ~~Some elements need to be flipped horizontally or vertically~~
* ~~Add the name of the current location somewhere on the screen.~~
* ~~Add a list of connected locations that the user can click to move from one location to another.~~
* ~~Write a node script to automatically convert the rest of the location XML files into JSON~~
* ~~Work out why the positioning is a bit off on certain landscape elements~~
* ~~Work out how to know when to horizontally flip some elements~~
* ~~Render a location's "layer" to a number of DIVs to build the whole scene~~
* tea and biscuits

## Contact

Say "Hi" [@revdancatt](http://twitter.com/revdancatt)

## License

All scenery .png files and location .json files are provided under the [Creative Commons CC0 1.0 Universal License](http://creativecommons.org/publicdomain/zero/1.0/legalcode). This is a broadly permissive "No Rights Reserved" license — you may do what you please with what we've provided. I'm just converting them (and hosting on Github) to save other people the time and effort. A shoutout would be nice (it was a pita converting them) but you don't need to.

Original files can be found via [glitchthegame.com](http://glitchthegame.com)

The javascript code (i.e the rendering "client") has a MIT LICENSE.

