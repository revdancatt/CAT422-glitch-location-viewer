CAT422-glitch-location-viewer
=============================

![Glitch House](http://revdancatt.github.io/CAT422-glitch-location-viewer/img/scenery/house_medium_01.png)

Hello!

Try it now, maybe it'll work!: http://revdancatt.github.io/CAT422-glitch-location-viewer/?v=0.2

![Landscape](http://revdancatt.github.io/CAT422-glitch-location-viewer/img/landscape1.jpg)

This is a dump of Glitch location scenery found in [locations-xml.zip](https://github.com/tinyspeck/glitch-locations) into .png format to help build Glitch's "rooms". Not all files made it through the conversion, 232 out of the 5,055 total threw errors while converting. At some point I'll make a list of them.

Note the directory structure has been flattened, all the .pngs now sit in a single directory /img/scenery. This is because the files describing each "room" just holds the filename and not the subdirectory that the piece of scenery was sitting in (if we want to mix scenery styles).

Example Image would be here: http://revdancatt.github.io/CAT422-glitch-location-viewer/img/scenery/house_medium_01.png

Also note, these are _just_ the scenery images, there's a whole bunch of other stuff like objects and characters that haven't been converted. This is just for making the world rather than anything in it. 

*As a bonus*, I've also converted one of the XML files ("Marrakesh Meadow") that describes how the "room" is put together into friendly .json format, you'll find it in the "locations" folder. With that and the .pngs there should be enough to stick everything back together.

# TODO

* Write a node script to automatically convert the rest of the location XML files into JSON
* Work out why the positioning is a bit off on certain landscape elements
* ~~Render a location's "layer" to a number of DIVs to build the whole scene~~
* Maybe convert that to canvas
* Convert the Path lines and walls into the JSON to, so we know where a play can walk
* Add a player sprite to the scene and let them walk round
* tea and biscuits

Say "Hi" [@revdancatt](http://twitter.com/revdancatt)

# License

All scenery .png files and location .json files are provided under the [Creative Commons CC0 1.0 Universal License](http://creativecommons.org/publicdomain/zero/1.0/legalcode). This is a broadly permissive "No Rights Reserved" license — you may do what you please with what we've provided. I'm just converting them (and hosting on Github) to save other people the time and effort. A shoutout would be nice (it was a pita converting them) but you don't need to.

Original files can be found via [glitchthegame.com](http://glitchthegame.com)
