control = {

    game_object: {},


    //  This will create a DIV for each layer in the location and then
    //  load in and place all the image assests
    //  At some point I may move this to canvas objects, but you know
    //  DIV kind of make sense at the moment.
    drawRoom: function() {


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