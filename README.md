CAT422-glitch-location-viewer
=============================

Hello!

This is the start of a tool to render out Glitch locations.

But before it can do that there's a few things that have to happen:

* Convert all the Glitch location XML files that can be found in [locations-xml.zip](https://github.com/tinyspeck/glitch-locations) into nice friendly JSON objects (I've done this for "Marrakesh Meadow" so far).
* Convert all the .fla files found in [locations-xml.zip](https://github.com/tinyspeck/glitch-locations) into .png files that can be loaded into the page.

So far there's a little script, in js/control.js that loads in an xml-json converted file to clean it up. At some point I'll make a node script to plough thru all the locations and do it properly.

You'll also find a whole bunch of .png files that have been converted from the .fla files. *These are not all the files*, but rather _most_ of the files to do with drawing scenery. There are supposed to be just over 5,000 of these, but some didn't convert properly. The Flash Pro JSFL script that did the conversion is called "convert-fla-to-png.jsfl", I've never written JSFL before so please feel free to improve the error catching on that.

At some point I'll make a list of all the files that didn't make the conversion.

When I upload the files (I'm still converting atm) they will be in /img/scenery


# License

All scenery .png files and location .json files are provided under the [Creative Commons CC0 1.0 Universal License](http://creativecommons.org/publicdomain/zero/1.0/legalcode). This is a broadly permissive "No Rights Reserved" license — you may do what you please with what we've provided. I'm just converting them (and hosting on Github) to save other people the time and effort. A shoutout would be nice (it was a pita converting them) but you don't need to.

Original files can be found via glitchthegame.com
