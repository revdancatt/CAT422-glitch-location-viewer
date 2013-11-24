control = {

    layerQueue: [],
    imageQueue: [],
    maxImageCount: 0,
    currentImageCount: 0,
    failedImageLoad: {},

    layersId: [],
    layersIdLength: 0,

    gameObject: {},
    currentRoomId: null,
    percentageOf: 9999999,
    stageWidth: null,
    loadingRoom: true,
    loadingItem: null,

    init: function(roomId) {

        //  update the percentageOf if we resize the window
        $(window).bind('resize', function() {
            try {
                control.percentageOf = $('.stage').width() - window.innerWidth;
            } catch(er) {
                //  Nowt
            }
        });

        $(window).bind('scroll', function() {

            var currentPercent = window.pageXOffset / control.percentageOf;
            var len = control.layersId.length;
            while (len--) {
                layerId = control.layersId[len];
                try {
                    room.dynamic.layers[layerId].offset = ((room.dynamic.layers[layerId].w - control.stageWidth) * -currentPercent);
                    $('#' + layerId).css('transform', 'translateX(' + room.dynamic.layers[layerId].offset + 'px)' );
                } catch(er) {//nowt
                }
            }
            
        });

        //  Now load the room
        this.loadRoom(roomId);

    },

    /*
    This is supposed to load in the next room
    */
    loadRoom: function(roomId) {


        //  set the room id into the "global" object
        this.currentRoomId = roomId;

        //  Now fade down the stage (we will empty it
        //  when we have the new room loaded)
        $('.stage').stop(true, false);
        $('.stage').fadeTo(1333, 0.1);
        $('.location').text('');
        $('.exits').empty();

        //  Empty the layerQueue, and the imageQueue
        this.layerQueue = [];
        this.imageQueue = [];

        //  Because we are loading this from github where we have
        //  no control over the backend, we're going to use
        //  the .callback.json file which has a built in callback
        //  to the root getRoom() function
        //  In the real world some backend script would go grab
        //  the .json file and return it back with a proper
        //  callback.
        //  NOTE: If you were writing your own Glitch client you
        //  could load the files in from GitHub using the following...
        //  $.getScript('http://revdancatt.github.io/CAT422-glitch-location-viewer/locations/' + roomId + '.callback.json');
        //  ...without needing to worry about cross-domain stuff.
        //  Note that we're loading the room
        this.loadingRoom = true;
        $.getScript('locations/' + roomId + '.callback.json');

    },

    //  Create the stage and put the gradient background in.
    prepStage: function() {

        room = this.gameObject;

        $('.location').text(room.label);

        //  Stop the animation on the stage, empty it and 
        //  start to fill it back up again
        $('.stage').stop(true, false);
        $('.stage').empty();
        window.scrollTo(0,0);
        $('.stage').fadeTo(666, 1);

        //  First thing we want to do is set the stage, so lets get the stage size and
        //  gradient.
        $('.stage').css({
            position: 'relative',
            width: parseInt(room.dynamic.r, 10) - parseInt(room.dynamic.l, 10),
            height: parseInt(room.dynamic.b, 10) - parseInt(room.dynamic.t, 10),
            overflow: 'hidden',
            'z-index': -1000
        });

        //  Pad the gratients (yes we could use loopy things but you know
        //  obvious code is obvious)
        var topGradient = room.gradient.top;
        if (topGradient.length == 2) topGradient = '0000' + topGradient;
        if (topGradient.length == 4) topGradient = '00' + topGradient;

        var bottomGradient = room.gradient.bottom;
        if (bottomGradient.length == 2) bottomGradient = '0000' + bottomGradient;
        if (bottomGradient.length == 4) bottomGradient = '00' + bottomGradient;

        $('.stage').css('background-image', '-webkit-gradient(linear, left top, left bottom, color-stop(0, #' + topGradient + '), color-stop(1, #' + bottomGradient + '))');
        $('.stage').css('background-image', '-o-linear-gradient(bottom, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-moz-linear-gradient(bottom, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-webkit-linear-gradient(bottom, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-ms-linear-gradient(bottom, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', 'linear-gradient(to bottom, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');

        //  Update the values we need for scrolling the scene.
        control.percentageOf = $('.stage').width() - window.innerWidth;
        control.stageWidth = $('.stage').width();

        //  Now go prep the layers.
        this.loadingRoom = false;
        this.prepLayers();

    },

    //  This is going to put the layers in order from the furthest back to the front
    //  so when we come to render the stuff we can put everything in order.
    //
    //  We don't really need to do this for the layers as we'll z-index them
    //  with CSS, but we do want to do it for the images
    prepLayers: function() {

        //  First of all I want to now what the highest and lowest z-indexes are
        //  (this is kinda a weird way of doing this and there are faster way
        //  but this is the one I'll be able to figure out when I come back to
        //  this code in 6 months time)
        var lowestZIndex = 99999;
        var highestZIndex = -99999;
        var sortedLayersList = [];

        $.each(room.dynamic.layers, function (id, layer) {
            if (layer.z < lowestZIndex) lowestZIndex = layer.z;
            if (layer.z > highestZIndex) highestZIndex = layer.z;
        });

        //  Now pop the layers into the layerQueue, again this is a long
        //  way round as it's n*n, *but* the overhead in the code is way
        //  offset by the length of time it takes to load in all the
        //  images.

        //  loop thru the z-indexes, from back to front
        this.layerQueue = [];
        for (var z = lowestZIndex; z <= highestZIndex; z++) {
            //  loop thru the layers to find the layer that
            //  matches the z-index we are looking for
            $.each(room.dynamic.layers, function (id, layer) {
                if (layer.z == z) {
                    control.layerQueue.push(id);
                    control.layersId.push(id);
                }
            });
        }

        //  Now make the div that's going to hold each layer.
        var filters = [];
        var tintColor = null;
        var tintAmount = null;
        var layer = null;
        var id = null;
        var newLayer = null;
        var exitList = $('<ul>');

        //  Don't bother optimising this loop.
        for (var l = 0; l < this.layerQueue.length; l++) {
            id = this.layerQueue[l];
            layer = room.dynamic.layers[id];

            newLayer = $('<div>');
            newLayer.attr('id', id);
            newLayer.css({
                'position': 'absolute',
                'width': parseInt(layer.w, 10),
                'height': parseInt(layer.h, 10),
                'left': 0,
                'top': parseInt($('.stage').css('height'), 10) - parseInt(layer.h, 10),
                'z-index': parseInt(layer.z, 10)
            });
            //  If we were actually positing the thing properly in the middle, we'd use this
            // 'left': (parseInt($('.stage').css('width'), 10) - parseInt(layer.w, 10)) / 2,
            if (id == 'middleground') {
                newLayer.css({
                    top: parseInt(layer.h, 10),
                    left: parseInt(room.dynamic.r, 10)
                });
            }

            //  Check for filters
            //  TODO: ONE DAY, WE WILL USE SHADERS FOR SPEED
            filters = [];
            tintColor = null;
            tintAmount = null;

            for (var filter in layer.filters) {
                //  Convert the filters the long way until we understand
                //  them better
                filterValue = layer.filters[filter];

                if (filter == 'brightness') {

                    //  Negative values are easy, -100 is totally black
                    //  and -1 is hardly any change at all. This fits in
                    //  with our model of brightness from 1.0 to 0.0
                    //  i.e. -50 is 0.5
                    if (filterValue < 0) {
                        filters.push('brightness(' + (1-(filterValue/-100)) +')');
                    }

                    //  Full brightness is much harder, as we really don't
                    //  get full bright (white-out) until we hit around
                    //  100% brightness in css, and even then it's on a curve
                    //  we'll probably do something with sin or log, but in the
                    //  meantime, positive values are in the range of 1-20
                    //  once we work out the maximum brightness used by Glitch.
                    if (filterValue > 0) {
                        filters.push('brightness(' + (1+(filterValue/100)) +')');
                        //  TODO, if the brightness is something crazy high, then
                        //  we want to "white-out", probably special case that.
                    }
                }

                //  Similar to brightness, but you know, different
                if (filter == 'contrast') {
                    if (filterValue < 0) {
                        filters.push('contrast(' + (1-(filterValue/-100)) +')');
                    }
                    if (filterValue > 0) {
                        filters.push('contrast(' + (1+(filterValue/100)) +')');
                    }
                }

                //  And now saturation
                if (filter == 'saturation') {
                    if (filterValue < 0) {
                        filters.push('saturation(' + (1-(filterValue/-100)) +')');
                    }
                    if (filterValue > 0) {
                        filters.push('saturation(' + (1+(filterValue/100)) +')');
                    }
                }

                //  NOTE: We are NOT going to do blur (yet) as it slows everything
                //  down too much (blur applied to the layer has loads of divs in
                //  it), lets wait until we have a canvas object.
                if (filter == 'tintColor') {
                    tintColor = filterValue;
                }
                if (filter == 'tintAmount') {
                    tintAmount = filterValue;
                }
                //  Now if we have both things we can apply the tint
                //  to the layer (only we're not going to)
                if (tintColor !== null && tintAmount !== null) {

                }

                //  NOTE: We are also not going to do tint until we hit canvas
                //  then we can tint each element as it comes in.
                if (filter == 'blur') {
                    //  HAHAHAHA, canvas!
                    //  filters.push('blur('+ filterValue + 'px)');
                }

            }

            //  If we have some filters then apply them now
            newLayer.css('filter', filters.join(' '));
            newLayer.css('-webkit-filter', filters.join(' '));
            newLayer.css('-moz-filter', filters.join(' '));
            newLayer.css('-o-filter', filters.join(' '));
            newLayer.css('-ms-filter', filters.join(' '));

            //  Now attach the layer.
            $('.stage').append(newLayer);

            //  Think about doing location exists
            for (var s in layer.signposts) {
                
                signpost = layer.signposts[s];

                /*
                //console.log(signpost);
                //  Go grab the signpost image and add it to the layer.
                newImg = $('<img>');
                newImg.css({
                    'position': 'absolute',
                    'width': parseInt(signpost.w, 10),
                    'height': parseInt(signpost.h, 10),
                    'left': parseInt(signpost.x, 10) - (parseInt(signpost.w, 10)/2),
                    'top': parseInt(signpost.y, 10) - (parseInt(signpost.h, 10) * 1),
                    'z-index': 1000,
                    'transform': (signpost.r ? 'rotate(' + parseInt(signpost.r, 10) + 'deg)' : '') + (signpost.h_flip ? ' scaleX(-1)' : ''),
                    'transform-origin': 'bottom'
                });
                //  Can't find the signpost assets, so comment this out for the moment
                //newImg.attr('src', 'img/scenery/' + signpost.name + '.png');
                //newLayer.append(newImg);
                */

                for (var c in signpost.connects) {
                    connection = signpost.connects[c];
                    exitLink = $('<li>').append($('<a>').attr({
                        id: connection.tsid.replace('L','G'),
                        href: '#/' + connection.tsid
                    }).text(connection.label));
                    exitList.append(exitLink);
                }
            }
        }

        //  pop the exits on
        $('.exits').append($('<h2>').text('Exits'));
        $('.exits').append(exitList);
        $('.exits a').bind('click', function() {
            control.loadRoom($(this).attr('id'));
        });

        //  Now go and prep each layer
        this.prepItems();
        

    },

    //  This is where I'm going to sort out all the items
    //  into their z-index order and push them back into
    //  a layer object and then shove that into the layerQueue
    prepItems: function(sortedLayersList) {

        sortedLayersList = this.layerQueue;

        //  we're going to convert decos to items
        var items = null;
        var layerId = null;
        var lowestZIndex = 99999;
        var highestZIndex = -99999;
        var decoLength = 0;
        var deco = null;
        var z = null;

        //  reset the maxImageCount
        this.maxImageCount = 0;

        for (var l = 0; l < sortedLayersList.length; l++) {
            layerId = sortedLayersList[l];
            
            //  Create a new array to hold the items in order.
            room.dynamic.layers[layerId].items = [];

            //  Now do the same thing we did before in working out
            //  which order we need to put all the decos in
            lowestZIndex = 99999;
            highestZIndex = -99999;

            //  Find out what the highest and lowest z-index is
            decoLength = room.dynamic.layers[layerId].decos.length;
            for (var d = 0; d < decoLength; d++ ) {
                z = room.dynamic.layers[layerId].decos[d].z;
                if (z < lowestZIndex) lowestZIndex = z;
                if (z > highestZIndex) highestZIndex = z;
            }

            //  Now we loop thru it all over again, from the
            //  lowestZIndex to the highestZIndex...
            //  ...only shoving the deco that matches the z-order
            //  
            //  This is an N^2 problem, but honestly it only happens the once,
            //  when we load the room, and hopefully isn't anything compared to
            //  loading in the images.
            //
            //  We'll time this, and optimise at some point in the future
            //  for the moment I'm just more worried about rending to canvas
            //  and the image queue :)
            //
            //  Loop thru the zIndexes from highest to lowest, this means
            //  that as as we push them onto the stack the ones closest to
            //  the front go on first, when we pop() them back off we'll
            //  get the ones from the back first.
            for (var i = highestZIndex; i >= lowestZIndex; i--) {
                for (d = 0; d < decoLength; d++ ) {
                    if (room.dynamic.layers[layerId].decos[d].z == i) {
                        room.dynamic.layers[layerId].items.push(room.dynamic.layers[layerId].decos[d]);
                        this.maxImageCount++;
                    }
                }
            }

            //  And now kill the decos just to tidy up
            delete room.dynamic.layers[layerId].decos;


        }

        //  Now set the currentImageCount to the maxOne so we
        //  can display a loading progress bar.
        this.currentImageCount = this.maxImageCount;

        //  Reset the failed loaded images
        this.failedImageLoad = {};

        //  TODO, put all the exits on the exits list
        //this.showExits();
        this.loadImages();

    },

    //  This function will look at the layers we still have left in our layerQueue
    loadImages: function() {

        //  if we are loading a room then this is one place where
        //  we can stop loading in images
        if (this.loadingRoom) return;

        //  Check to see if we are still working on layers, if we have run
        //  out then we have finished.
        if (this.layerQueue.length === 0) {
            //  We have finished rendering all the images
            //  Which I think means we are good.
            this.finishLevel();
            return;
        }

        //  Get the id of the first layer
        var thisLayer = this.layerQueue[0];

        //  Check to make sure we have any images left to load
        //  if we don't then, shift off the layer and go
        //  again
        if (room.dynamic.layers[thisLayer].items.length === 0) {
            this.layerQueue.shift();
            this.loadImages();
            return;
        }

        //  Pop off an item
        this.loadingItem = room.dynamic.layers[thisLayer].items.pop();

        //  Now we can load in the image and place it on the correct layer.
        this.loadImage(thisLayer, this.loadingItem);

    },

    loadImage: function(layerId, item) {

        //  If we are loading a new room, then don't do any of this
        if (this.loadingRoom) return;
        
        var newImg = $('<img>');
        newImg.css({
            'position': 'absolute',
            'width': parseInt(item.w, 10),
            'height': parseInt(item.h, 10),
            'left': parseInt(item.x, 10) - (parseInt(item.w, 10)/2),
            'top': parseInt(item.y, 10) - (parseInt(item.h, 10) * 1),
            'z-index': parseInt(item.z, 10),
            'transform': (item.r ? 'rotate(' + parseInt(item.r, 10) + 'deg)' : '') + (item.h_flip ? ' scaleX(-1)' : ''),
            'transform-origin': 'bottom'
        });
        newImg.attr('src', 'img/scenery/' + item.filename + '.png');

        newImg.bind('load', function() {
            //  Reduce down the current image count
            control.currentImageCount--;
            var percent = 100 - parseInt(control.currentImageCount / control.maxImageCount * 100, 10);
            $('.debug').text(percent + '%');
            //  Load the images again
            control.loadImages();
        });

        newImg.bind('error', function() {

            if (item.filename in control.failedImageLoad) {
                control.failedImageLoad[item.filename]++;
            } else {
                control.failedImageLoad[item.filename] = 1;
            }

            //  Reduce down the current image count
            control.currentImageCount--;
            var percent = 100 - parseInt(control.currentImageCount / control.maxImageCount * 100, 10);
            $('.debug').text(percent + '%');
            //  Load the images again
            control.loadImages();
        });

        //  Now attach the image
        $('#' + layerId).append(newImg);

    },

    //  This wraps up all the lose ends
    finishLevel: function() {

        //  Display all the images that didn't load correctly
        var newHtml = '';
        for (var image in this.failedImageLoad) {
            newHtml += image + '<br />';
        }

        if (newHtml !== '') {
            $('.debug').html('<strong>Missing images</strong><br />' + newHtml);
        } else {
            $('.debug').empty();
        }

    }



/*
    prepLayer: function() {

        //  Now we need to add each layer to the stage
        var newLayer = null;

        //  Handle the exists
        var signpost = null;
        var connection = null;
        var exitLink = null;
        var exitList = $('<ul>');
        var filters = [];
        var filterValue = null;
        var tintColor = null;
        var tintAmount = null;

        $.each(room.dynamic.layers, function (id, layer) {
            
            control.layersId.push(id);
            control.layersIdLength++;

            newLayer = $('<div>');
            newLayer.attr('id', id);
            newLayer.css({
                'position': 'absolute',
                'width': parseInt(layer.w, 10),
                'height': parseInt(layer.h, 10),
                'left': 0,
                'top': parseInt($('.stage').css('height'), 10) - parseInt(layer.h, 10),
                'z-index': parseInt(layer.z, 10)
            });
            //  If we were actually positing the thing properly in the middle, we'd use this
            // 'left': (parseInt($('.stage').css('width'), 10) - parseInt(layer.w, 10)) / 2,
            if (id == 'middleground') {
                newLayer.css({
                    top: parseInt(layer.h, 10),
                    left: parseInt(room.dynamic.r, 10)
                });
            }

            //  now rather than adding in all the scenery we should put
            //  them into a queue to load 1 at a time, so we can control
            //  the pipeline...
            control.layerQueue.push(id);
            //  ...but, we're not going to do that, yet.


            var deco = null;
            var newImg = null;
            for (var d in layer.decos) {
                deco = layer.decos[d];
                newImg = $('<img>');
                newImg.css({
                    'position': 'absolute',
                    'width': parseInt(deco.w, 10),
                    'height': parseInt(deco.h, 10),
                    'left': parseInt(deco.x, 10) - (parseInt(deco.w, 10)/2),
                    'top': parseInt(deco.y, 10) - (parseInt(deco.h, 10) * 1),
                    'z-index': parseInt(deco.z, 10),
                    'transform': (deco.r ? 'rotate(' + parseInt(deco.r, 10) + 'deg)' : '') + (deco.h_flip ? ' scaleX(-1)' : ''),
                    'transform-origin': 'bottom'
                });
                newImg.attr('src', 'img/scenery/' + deco.filename + '.png');
                newLayer.append(newImg);

                //  Now attach the layer.
                $('.stage').append(newLayer);
            }

            //  Think about doing location exists
            for (var s in layer.signposts) {
                
                signpost = layer.signposts[s];

                //console.log(signpost);

                //  Go grab the signpost image and add it to the layer.
                newImg = $('<img>');
                newImg.css({
                    'position': 'absolute',
                    'width': parseInt(signpost.w, 10),
                    'height': parseInt(signpost.h, 10),
                    'left': parseInt(signpost.x, 10) - (parseInt(signpost.w, 10)/2),
                    'top': parseInt(signpost.y, 10) - (parseInt(signpost.h, 10) * 1),
                    'z-index': 1000,
                    'transform': (signpost.r ? 'rotate(' + parseInt(signpost.r, 10) + 'deg)' : '') + (signpost.h_flip ? ' scaleX(-1)' : ''),
                    'transform-origin': 'bottom'
                });
                //  Can't find the signpost assets, so comment this out for the moment
                //newImg.attr('src', 'img/scenery/' + signpost.name + '.png');
                //newLayer.append(newImg);


                for (var c in signpost.connects) {
                    connection = signpost.connects[c];
                    exitLink = $('<li>').append($('<a>').attr({
                        id: connection.tsid.replace('L','G'),
                        href: '#/' + connection.tsid
                    }).text(connection.label));
                    exitList.append(exitLink);
                }
            }




        });

        //  pop the exits on
        $('.exits').append($('<h2>').text('Exits'));
        $('.exits').append(exitList);
        $('.exits a').bind('click', function() {
            control.loadRoom($(this).attr('id'));
        });



    }
*/
};

//  THIS IS THE FUNCTION WE NEED TO BE ABLE TO LOAD IN
//  THE JSON FROM A REMOTE SERVER
//  This is an example of how you would handle loading in the files from 
//  github.
function getRoom(dataJSON) {
    //  Store the data
    control.gameObject = dataJSON;

    //  prep the stage
    control.prepStage();
}
