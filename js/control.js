control = {

    layerQueue: [],
    imageQueue: [],
    layersId: [],
    layersIdLength: 0,
    gameObject: {},
    currentRoomId: null,
    percentageOf: null,
    stageWidth: null,

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

        //  Because we are loading this from github where we have
        //  no control over the backend, we're going to use
        //  the .callback.json file which has a built in callback
        //  to the root getRoom() function
        //  In the real world some backend script would go grab
        //  the .json file and return it back with a proper
        //  callback.
        $.getScript('locations/' + roomId + '.callback.json');

    },

    //  This will create a DIV for each layer in the location and then
    //  load in and place all the image assests
    //  At some point I may move this to canvas objects, but you know
    //  DIV kind of make sense at the moment.
    drawRoom: function() {

        room = this.gameObject;

        //console.log(room);
        $('.location').text(room.label);

        //  Stop the animation on the stage, empty it and 
        //  start to fill it back up again
        $('.stage').stop(true, false);
        $('.stage').empty();
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

        $('.stage').css('filter','progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#' + topGradient + '\', endColorstr=\'#' + bottomGradient + '\', gradientType=1)');
        $('.stage').css('background-image','-webkit-gradient(linear, left top, right bottom, color-stop(0.1, #' + topGradient + '), color-stop(0.99, #' + bottomGradient + '))');
        $('.stage').css('background-image','-moz-linear-gradient(top left, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');
        $('.stage').css('background-image','-o-linear-gradient(top left, #' + topGradient + ' 0%, #' + bottomGradient + ' 100%)');


        //  Now we need to add each layer to the stage
        var newLayer = null;

        //  Handle the exists
        var signpost = null;
        var connection = null;
        var exitLink = null;
        var exitList = $('<ul>');

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
            //  the pipeline.
            control.layerQueue.push(id);

            //  BUT, as we can't wait, lets just put everything in there
            $('.stage').append(newLayer);

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
                    'z-index': parseInt(deco.z, 10)
                });
                newImg.attr('src', 'img/scenery/' + deco.filename + '.png');
                newLayer.append(newImg);
            }

            //  Think about doing location exists
            for (var s in layer.signposts) {
                signpost = layer.signposts[s];
                for (var c in signpost.connects) {
                    connection = signpost.connects[c];
                    exitLink = $('<li>').append($('<a>').attr({
                        id: connection.tsid.replace('L','G'),
                        href: '#'
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
            return false;
        });

        //  Now set up the scrolling
        control.percentageOf = $('.stage').width() - window.innerWidth;
        control.stageWidth = $('.stage').width();

        //  update the percentageOf if we resize the window
        $(window).bind('resize', function() {
            control.percentageOf = $('.stage').width() - window.innerWidth;
        });

        $(window).bind('scroll', function() {

            var currentPercent = window.pageXOffset / control.percentageOf;
            var len = control.layersIdLength;
            while (len--) {
                layerId = control.layersId[len];
                room.dynamic.layers[layerId].offset = ((room.dynamic.layers[layerId].w - control.stageWidth) * -currentPercent);
                $('#' + layerId).css('transform', 'translateX(' + room.dynamic.layers[layerId].offset + 'px)' );
            }
            
        });

    }

};

//  THIS IS THE FUNCTION WE NEED TO BE ABLE TO LOAD IN
//  THE JSON FROM A REMOTE SERVER
function getRoom(dataJSON) {
    control.gameObject = dataJSON;
    control.drawRoom();
}