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
    
    //  We are putting these here, because although we can figure them out
    //  I want faster access to them because they are
    //  used in animation
    stageWidth: null,
    stageHeight: null,
    stageHolderWidth: null,
    stageHolderHeight: null,

    loadingRoom: true,
    loadingItem: null,
    loadtime: {
        start: null,
        end: null
    },

    init: function(roomId) {

        //  update the percentageOf if we resize the window
        $(window).bind('resize', function() {
            try {
                control.stageHolderWidth = $('.stage_holder').width();
                control.stageHolderHeight = $('.stage_holder').height();
            } catch(er) {
                //  Nowt
            }
        });
        control.stageHolderWidth = $('.stage_holder').width();
        control.stageHolderHeight = $('.stage_holder').height();

        //  Now load the room
        this.loadRoom(roomId);

        //  Do the player init
        player.init();

    },


    /*
    This is supposed to load in the next room
    */
    loadRoom: function(roomId) {


        control.loadtime.start = new Date();

        //  set the room id into the "global" object
        this.currentRoomId = roomId;

        //  Now fade down the stage (we will empty it
        //  when we have the new room loaded)
        $('.stage').stop(true, false);
        $('.stage').fadeTo(1333, 0.1);
        $('.location').text('');
        $('.player_holder').remove();
        $('.other_player_holders').remove();
        $('.localChat ul').empty();
        player.otherUsers = {};
        player.loaded = false;
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
        $.getScript('http://revdancatt.github.io/CAT422-glitch-location-viewer/locations/' + roomId + '.callback.json');

    },


    //  Create the stage and put the gradient background in.
    prepStage: function() {

        room = this.gameObject;

        document.title = 'MVURXI : ' + room.label;
        $('.location').text(room.label);

        //  Stop the animation on the stage, empty it and 
        //  start to fill it back up again
        $('.stage').stop(true, false);
        $('.stage').empty();
        window.scrollTo(0,0);
        $('.stage').fadeTo(666, 1);
        $('.loading_holder').fadeIn(666);

        //  First thing we want to do is set the stage, so lets get the stage size and
        //  gradient.
        $('.stage').css({
            position: 'absolute',
            overflow: 'hidden',
            width: parseInt(room.dynamic.r, 10) - parseInt(room.dynamic.l, 10),
            height: parseInt(room.dynamic.b, 10) - parseInt(room.dynamic.t, 10),
            'z-index': -1000
        });
        control.stageWidth = parseInt(room.dynamic.r, 10) - parseInt(room.dynamic.l, 10);
        control.stageHeight = parseInt(room.dynamic.b, 10) - parseInt(room.dynamic.t, 10);

        //  Pad the gratients (yes we could use loopy things but you know
        //  obvious code is obvious)
        var topGradient = null;
        var bottomGradient = null;

        if (room.gradient.top >> 16 === 0 && room.gradient.top >> 8 === 0 && (room.gradient.top.length == 6 || room.gradient.top.length == 4 || room.gradient.top.length == 1)) {

            topGradient = room.gradient.top;
            while (topGradient.length < 6) {
                topGradient = '0' + topGradient;
            }
            topGradient = '#' + topGradient;

            bottomGradient = room.gradient.bottom;
            while (bottomGradient.length < 6) {
                bottomGradient = '0' + bottomGradient;
            }
            bottomGradient = '#' + bottomGradient;

        } else {
            var r = ((room.gradient.top >> 16) & 0xff);
            var g = ((room.gradient.top >> 8) & 0xff);
            var b = ((room.gradient.top) & 0xff);
            topGradient = 'rgb(' + r + ',' + g + ',' + b + ')';

            r = ((room.gradient.bottom >> 16) & 0xff);
            g = ((room.gradient.bottom >> 8) & 0xff);
            b = ((room.gradient.bottom) & 0xff);
            bottomGradient = 'rgb(' + r + ',' + g + ',' + b + ')';
        }

        $('.stage').css('background-image', '-webkit-gradient(linear, left top, left bottom, color-stop(0, ' + topGradient + '), color-stop(1, ' + bottomGradient + '))');
        $('.stage').css('background-image', '-o-linear-gradient(bottom, ' + topGradient + ' 0%, ' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-moz-linear-gradient(bottom, ' + topGradient + ' 0%, ' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-webkit-linear-gradient(bottom, ' + topGradient + ' 0%, ' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', '-ms-linear-gradient(bottom, ' + topGradient + ' 0%, ' + bottomGradient + ' 100%)');
        $('.stage').css('background-image', 'linear-gradient(to bottom, ' + topGradient + ' 0%, ' + bottomGradient + ' 100%)');

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
        var newCanvas = null;
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

            //  Attach a canvas object to the layer
            newCanvas = $('<canvas>').attr({id: id + '_canvas', width: parseInt(layer.w, 10), height: parseInt(layer.h, 10)})
                .css({width: parseInt(layer.w, 10), height: parseInt(layer.h, 10)})
                .css({position: 'absolute', top: 0, left: 0});

            //  Check for filters
            //  TODO: ONE DAY, WE WILL USE WEBGL SHADERS FOR SPEED
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
            newCanvas.css('filter', filters.join(' '));
            newCanvas.css('-webkit-filter', filters.join(' '));
            newCanvas.css('-moz-filter', filters.join(' '));
            newCanvas.css('-o-filter', filters.join(' '));
            newCanvas.css('-ms-filter', filters.join(' '));

            //  Add the canvas to the layer
            newLayer.append(newCanvas);

            //  If this is the 'middleground' layer then we need to add the player
            if (id == 'middleground') {
                var playerSprite = $('<div>').attr('class', 'player_holder').append(
                    $('<div>').attr('class', 'player_frame').append(
                        $('<div>').attr('class', 'player').css('background-image', 'url(img/glitchen/root_base.png)')
                    )
                );
                playerSprite.append($('<div>').addClass('nameLabel').text(player.username));

                //  For the moment, set the player position to be half the stage
                //  and 300 from the bottom.
                //  In future we will get this from the sign-post connection information
                player.setPosition(parseInt(layer.w, 10) / 2 + 100, 100);
                newLayer.append(playerSprite);

                //  tell the backend we've moved rooms
                if (player.connected) {
                    console.log('socket.emit');
                    socket.emit('joinroom', room.label, player.position.x, player.position.y, player.position.facing);
                }

            }

            //  Now attach the layer.
            $('.stage').append(newLayer);

            //  Think about doing location exists
            for (var s in layer.signposts) {
                
                signpost = layer.signposts[s];

                /*
                //  TODO: Huh?!? Where's the signpost assets?
                //  console.log(signpost);
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

        //  Tell the player that it's loaded
        player.loaded = true;

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
        
        //  Prep the image
        var newImg = $('<img>');
        newImg.css({
            'position': 'absolute',
            'width': parseInt(item.w, 10),
            'height': parseInt(item.h, 10),
            'left': 0,
            'top': 0
        });

        //  If something goes wrong loading the image
        //  then we make a note of which image failed and move
        //  onto the next one
        newImg.bind('error', function() {
            if (item.filename in control.failedImageLoad) {
                control.failedImageLoad[item.filename]++;
            } else {
                control.failedImageLoad[item.filename] = 1;
            }
            control.currentImageCount--;
            var percent = 100 - parseInt(control.currentImageCount / control.maxImageCount * 100, 10);
            $('.percent').css('width', percent + '%');

            $('.offscreenBuffer').empty();
            control.loadImages();
        });

        //  If the image loaded then we need to move make a blitting canvas for it
        //  and move it over.
        newImg.bind('load', function() {


            var thisImg = this;

            //  TODO:
            //  Now is probable the time to apply filters to the image if we want to
            //  like tinting.
            //  TURN THIS OFF FOR THE MOMENT AS ITS STILL NOT RIGHT
            /*
            if ('tintColor' in room.dynamic.layers[layerId].filters && room.dynamic.layers[layerId].filters.tintColor !== '' && 'tintAmount' in room.dynamic.layers[layerId].filters && room.dynamic.layers[layerId].filters.tintAmount !== '') {
                var tintColor = room.dynamic.layers[layerId].filters.tintColor;
                var tintAmount = room.dynamic.layers[layerId].filters.tintAmount;
                var r = ((tintColor >> 16) & 0xff);
                var g = ((tintColor >> 8) & 0xff);
                var b = ((tintColor) & 0xff);
                if (tintAmount > 0) {
                    tintAmount = 100 / tintAmount;
                    if (tintAmount > 1) {
                        tintAmount = 1;
                    }
                } else {
                    tintAmount = 0;
                }
                var rgbks = control.generateRGBKs(newImg[0]);
                thisImg = control.generateTintImage( newImg[0], rgbks, r, g, b );
            }
            */

            //  Put the image into the source canvas, flipping if needed.
            //  Note we are making the canvas twice the height as a hack
            //  to allow us to rotate if we need to, and also put the
            //  image into the main canvas based on the center points.
            var sourceCanvas = $('<canvas>');
            sourceCanvas.attr({width: item.w, height: item.h * 2})
            .css({width: item.w, height: item.h * 2})
            .css({position: 'absolute', top: 0, left: 0});
            //$('.offscreenBuffer').append(sourceCanvas);
            sourceContext = sourceCanvas[0].getContext('2d');
            if (item.h_flip) {
                sourceContext.scale(-1, 1);
                sourceContext.drawImage(thisImg, -item.w, 0, item.w, item.h);
            } else {
                sourceContext.drawImage(thisImg, 0, 0, item.w, item.h);
            }

            //$('.offscreenBuffer').append(sourceCanvas);
            var blitThis = sourceCanvas;

            //  If we're supposed to rotate then we need this extra step
            if ('r' in item) {

                //  Work out the dimensions we need for a canvas to accomodate rotating the image
                var maxEdgeSize = Math.sqrt(Math.pow(item.h * 2, 2) + Math.pow(item.w, 2));
                var targetCanvas = $('<canvas>');
                targetCanvas.attr({width: maxEdgeSize, height: maxEdgeSize})
                .css({width: maxEdgeSize, height: maxEdgeSize})
                .css({position: 'absolute', top: 0, left: 0});
                //$('.offscreenBuffer').append(targetCanvas);
                
                targetContext = targetCanvas[0].getContext('2d');
                targetContext.translate(targetCanvas.width() / 2, targetCanvas.height() / 2);

                targetContext.rotate(Math.PI/180 * item.r);
                targetContext.drawImage(sourceCanvas[0], -item.w / 2, -item.h, item.w, item.h * 2);
                blitThis = targetCanvas;
            }
            

            //  Now blit the item to the main canvas
            var flipMod = -1;

            var targetContext = $('#' + layerId + ' canvas')[0].getContext('2d');
            if (layerId == 'middleground') {
                targetContext.drawImage(blitThis[0], item.x - (blitThis.width() / 2) + ($('#middleground canvas').width()/2), item.y - (blitThis.height() / 2) + ($('#middleground canvas').height()), blitThis.width(), blitThis.height());
            } else {
                targetContext.drawImage(blitThis[0], item.x - (blitThis.width() / 2), item.y - (blitThis.height() / 2), blitThis.width(), blitThis.height());
            }

            //  Reduce down the current image count
            control.currentImageCount--;
            var percent = 100 - parseInt(control.currentImageCount / control.maxImageCount * 100, 10);
            $('.percent').css('width', percent + '%');
            //  Load the images again
            $('.offscreenBuffer').empty();
            control.loadImages();
        });

        //  Now attach the image to the offscreen buffer
        //  and load it.
        $('.offscreenBuffer').append(newImg);
        newImg.attr('src', 'http://revdancatt.github.io/CAT422-glitch-location-viewer/img/scenery/' + item.filename + '.png');

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

        $('.loading_holder').fadeOut(600);

        control.loadtime.end = new Date();
        console.log('Load time: ' + (control.loadtime.end - control.loadtime.start) + 'ms');

    },

    //  COLOUR TINT CODE FROM:
    //  http://www.playmycode.com/blog/2011/06/realtime-image-tinting-on-html5-canvas/
    generateRGBKs: function(img, alpha) {

        var w = img.width;
        var h = img.height;
        var rgbks = [];

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        var ctx = canvas.getContext("2d");
        ctx.globalAlpha = alpha;
        ctx.drawImage( img, 0, 0 );

        var pixels = ctx.getImageData( 0, 0, w, h ).data;

        // 4 is used to ask for 3 images: red, green, blue and
        // black in that order.
        for ( var rgbI = 0; rgbI < 4; rgbI++ ) {
            canvas = document.createElement("canvas");
            canvas.width  = w;
            canvas.height = h;
            
            ctx = canvas.getContext('2d');
            ctx.drawImage( img, 0, 0 );
            var to = ctx.getImageData( 0, 0, w, h );
            var toData = to.data;
            
            for (
                    var i = 0, len = pixels.length;
                    i < len;
                    i += 4
            ) {
                toData[i  ] = (rgbI === 0) ? pixels[i  ] : 0;
                toData[i+1] = (rgbI === 1) ? pixels[i+1] : 0;
                toData[i+2] = (rgbI === 2) ? pixels[i+2] : 0;
                toData[i+3] =                pixels[i+3]    ;
            }
            
            ctx.putImageData( to, 0, 0 );

            var imgComp = new Image();
            imgComp.src = canvas.toDataURL();
            
            rgbks.push( imgComp );                        
        }

        return rgbks;
    },

    generateTintImage: function( img, rgbks, red, green, blue ) {
        var buff = document.createElement( "canvas" );
        buff.width  = img.width;
        buff.height = img.height;
        
        var ctx  = buff.getContext("2d");

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage( img, 0, 0 );

        ctx.globalCompositeOperation = 'lighter';
        if ( red > 0 ) {
            ctx.globalAlpha = red   / 255.0;
            ctx.drawImage( rgbks[0], 0, 0 );
        }
        if ( green > 0 ) {
            ctx.globalAlpha = green / 255.0;
            ctx.drawImage( rgbks[1], 0, 0 );
        }
        if ( blue > 0 ) {
            ctx.globalAlpha = blue  / 255.0;
            ctx.drawImage( rgbks[2], 0, 0 );
        }

        return buff;
    }

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
