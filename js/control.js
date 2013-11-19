control = {

    game_object: {},
    layerQueue: [],
    imageQueie: [],
    percentageOf: null,
    stageWidth: null,
    layersId: [],
    layersIdLength: 0,


    //  This will create a DIV for each layer in the location and then
    //  load in and place all the image assests
    //  At some point I may move this to canvas objects, but you know
    //  DIV kind of make sense at the moment.
    drawRoom: function() {

        //  First thing we want to do is set the stage, so lets get the stage size and
        //  gradient.
        $('.stage').css({
            position: 'relative',
            width: parseInt(room.dynamic.r, 10) - parseInt(room.dynamic.l, 10),
            height: parseInt(room.dynamic.b, 10) - parseInt(room.dynamic.t, 10),
            overflow: 'hidden',
            'z-index': -1000
        });

        $('.stage').css('filter','progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#' + room.dynamic.gradient.top + '\', endColorstr=\'#' + room.dynamic.gradient.bottom + '\', gradientType=1)');
        $('.stage').css('background-image','-webkit-gradient(linear, left top, right bottom, color-stop(0.1, #' + room.dynamic.gradient.top + '), color-stop(0.99, #'+room.dynamic.gradient.bottom+'))');
        $('.stage').css('background-image','-moz-linear-gradient(top left, #' + room.dynamic.gradient.top + ' 0%, #'+room.dynamic.gradient.bottom+' 100%)');
        $('.stage').css('background-image','-o-linear-gradient(top left, #' + room.dynamic.gradient.top + ' 0%, #'+room.dynamic.gradient.bottom+' 100%)');

        $('.stage').append(
            $('<div>')
            .addClass('ground')
            .css({
                'position': 'absolute',
                'left': 0,
                'top': parseInt(room.dynamic.b, 10) - parseInt(room.dynamic.t, 10) + parseInt(room.dynamic.ground_y, 10),
                'width': parseInt(room.dynamic.r, 10) - parseInt(room.dynamic.l, 10),
                'height': Math.abs(parseInt(room.dynamic.ground_y, 10)),
                'background': '#48701C',
                'z-index': -500
            })
        );

        //  Now we need to add each layer to the stage
        var newLayer = null;
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
                    'left': parseInt(deco.x, 10),
                    'top': parseInt(deco.y, 10) - (parseInt(deco.h, 10) * 1),
                    'z-index': parseInt(deco.z, 10)
                });
                newImg.attr('src', 'img/scenery/' + deco.filename);
                newLayer.append(newImg);
            }

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
                if (layerId == 'middleground') {
                    room.dynamic.layers[layerId].offset = ((room.dynamic.layers[layerId].w - control.stageWidth) * -currentPercent) + room.dynamic.l;
                } else {
                    room.dynamic.layers[layerId].offset = ((room.dynamic.layers[layerId].w - control.stageWidth) * -currentPercent);
                }
                $('#' + layerId).css('transform', 'translateX(' + room.dynamic.layers[layerId].offset + 'px)' );
            }
            /*
            var len = control.layersIdLength;
            while (len--) {
                layerId = control.layersId[len];
                $('#' + layerId).css('transform', 'translateX(' + room.dynamic.layers[layerId].offset + 'px)' );
            }
            */
        });
    },

    //  At some point I will automate all this in Node and convert the whole lot
    //  for the moment I've just done one as a test
    convertRoom: function() {

        //  first the kind handy stuff
        this.game_object.tsid = room.game_object['-tsid'];
        this.game_object.label = room.game_object['-label'];
        this.game_object.dynamic = {};

        //  Now go grab the things from the xml to populate the dynamic
        for (var i in room.game_object.object.int) {
            //console.log(room.game_object.object.int[i]);
            this.game_object.dynamic[room.game_object.object.int[i]['-id']] = room.game_object.object.int[i]['#text'];
        }

        this.game_object.dynamic.layers = {};

        var sourceLayers = null;
        var sourceLayer = null;
        var targetLayer = null;
        var decos = null;
        var deco = null;
        var sourceGradient = null;

        for (i in room.game_object.object.object) {

            //  If we are on the layers object...
            if (room.game_object.object.object[i]['-id'] == 'layers') {
                sourceLayers = room.game_object.object.object[i].object;

                //  grab the layer name
                for (var l in sourceLayers) {
                    sourceLayer = sourceLayers[l];
                    this.game_object.dynamic.layers[sourceLayer['-id']] = {};
                    targetLayer = this.game_object.dynamic.layers[sourceLayer['-id']];

                    //  get the dimensions for each layer
                    for (var d in sourceLayer.int) {
                        targetLayer[sourceLayer.int[d]['-id']] = sourceLayer.int[d]['#text'];
                    }

                    //  Now we want to look for the 'decos' which describe the scenery that
                    //  makes up a 'room'
                    targetLayer.decos = [];

                    if ('-id' in sourceLayer.object) {
                        decos = sourceLayer.object.object;
                    } else {
                        for (var lt in sourceLayer.object) {
                            layerType = sourceLayer.object[lt];
                            if (layerType['-id'] == 'decos') {
                                decos = layerType.object;
                                break;
                            }
                        }
                    }
                    if (decos.length == undefined) {
                        decos = [decos];
                    }

                    //  Now loop thru the decos recording the data
                    for (var dc in decos) {
                        newDeco = {};
                        deco = decos[dc];
                        for (var s in deco.str) {
                            if (deco.str[s]['-id'] == 'sprite_class') {
                                newDeco.filename = deco.str[s]['#text'] + '.png';
                            }
                        }
                        for (var p in deco.int) {
                            newDeco[deco.int[p]['-id']] = deco.int[p]['#text'];
                        }
                        targetLayer.decos.push(newDeco);
                    }
                }
                
            }

            //  Now we want to know about the gradient background and what have you
            if (room.game_object.object.object[i]['-id'] == 'gradient') {
                sourceGradient = room.game_object.object.object[i].str;
                this.game_object.dynamic.gradient = {};
                for (var g in sourceGradient) {
                    this.game_object.dynamic.gradient[sourceGradient[g]['-id']] = sourceGradient[g]['#text'];
                }
            }
        }

        //  Copy the output on the page into something like...
        //  http://jsonformatter.curiousconcept.com/
        //  ...to make it all pretty like.
        //  (as noted, this'll all be done in node at some point, so
        //  you won't need to do this)
        $('.output').html(JSON.stringify(this.game_object));
        
    }

};