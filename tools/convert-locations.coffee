fs = require 'fs'
xml2js = require 'xml2js'

convert =

    fileList: []

    #   Grab all the first in the directory
    init: ->
        fs.readdir './locations-original-xml', (err, files) ->
            throw err if err
            convert.fileList = files
            convert.convertFiles()
            
    #   Now go through each on in turn converting it
    convertFiles: ->
        if convert.fileList.length is 0
            console.log '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=';
            console.log 'Done!'
            return

        thisFile = convert.fileList.pop()

        #   Lazy check, should use filters above
        if thisFile is '.DS_Store'
            convert.convertFiles()
            return

        console.log thisFile

        parser = new xml2js.Parser()
        fs.readFile './locations-original-xml/' + thisFile, (err, data) ->
            throw err if err
            parser.parseString data, (err, dataJSON) ->

                ##  Get the base information
                locationJSON = convert.getBaseInformation(dataJSON)
                locationJSON.gradient = convert.getGradient(dataJSON)
                locationJSON.dynamic = convert.getBaseDimensions(dataJSON)
                locationJSON.dynamic.layers = convert.getLayers(dataJSON)

                #   Write the file out
                fs.writeFile './locations/' + thisFile.replace('.xml', '.json'), JSON.stringify(locationJSON, null, 4), (err) ->
                    throw err if err
                    fs.writeFile './locations/' + thisFile.replace('.xml', '.callback.json'), 'getRoom(' + JSON.stringify(locationJSON) + ')', (err) ->
                        throw err if err
                        convert.convertFiles()

    getBaseInformation: (dataJSON) ->

        locationJSON = {}
        locationJSON.tsid = dataJSON.game_object.$.tsid
        locationJSON.label = dataJSON.game_object.$.label
        locationJSON

    getGradient: (dataJSON) ->

        result = {}
        dynamic = dataJSON.game_object.object[0].object
        for item in dynamic
            if item.$.id is 'gradient'
                if 'str' of item
                    for colour in item.str
                        result[colour.$.id] = colour._
        result

    getBaseDimensions: (dataJSON) ->

        result = {}
        dynamic = dataJSON.game_object.object[0].int
        for item in dynamic
            result[item.$.id] = parseInt(item._, 10)
        result

    getLayers: (dataJSON) ->

        #   Dive down
        dynamic = dataJSON.game_object.object[0].object

        #   Find the layers in the dynamic object
        result = {}
        for item in dynamic
            if item.$.id is 'layers'

                #   Grab the array of layers
                layers = item.object
                for layer in layers

                    #   Ok, first get the layer name
                    result[layer.$.id] = {}
                    if 'str' of layer and layer.str.length > 0
                        result[layer.$.id].name = layer.str[0]._

                        #   now the dimensions
                        if 'int' of layer
                            for d in layer.int
                                result[layer.$.id][d.$.id] = parseInt(d._, 10)

                            #   lets have a look at the things we can
                            #   get in a layer
                            result[layer.$.id].filters = convert.getFilters(layer.object)
                            result[layer.$.id].decos = convert.getDecos(layer.object)
                            result[layer.$.id].signposts = convert.getSignposts(layer.object)                    

                            #   TODO: Impliment the following
                            #   use GUVVV3FU2FC38SK.json as a test source
                            ###
                            result[layer.$.id].walls = convert.getWalls(layer.object)
                            result[layer.$.id].boxes = convert.getBoxes(layer.object)
                            result[layer.$.id].doors = convert.getDoors(layer.object)
                            result[layer.$.id].ladders = convert.getLadders(layer.object)
                            result[layer.$.id].platformLines = convert.getPlatformLines(layer.object)
                            result[layer.$.id].targets = convert.getTargets(layer.object)
                            ###


        result

    #   Get the filters out of the json into some nice
    #   friendly format
    getFilters: (layer) ->

        result = {}
        for element in layer
            if element.$.id is 'filtersNEW' or element.$.id is 'filters'
                if 'object' of element
                    for filter in element.object
                        if 'int' of filter and filter.int.length > 0
                            result[filter.$.id] = parseInt(filter.int[0]._)

        result

    #   Get the decoration objects out
    getDecos: (layer) ->

        result = []
        for element in layer
            if element.$.id is 'decos'
                if 'object' of element
                    for deco in element.object
                        newDeco = {}

                        #   get the sprite name
                        if 'str' of deco
                            for name in deco.str
                                if name.$.id is 'sprite_class'
                                    newDeco.filename = name._

                        #   now get the position stuff
                        if 'int' of deco
                            for position in deco.int
                                newDeco[position.$.id] = parseInt(position._, 10)

                        #   see if there's any flipping
                        newDeco.hFlip = false
                        newDeco.vFlip = false
                        if 'bool' of deco
                            for flip in deco.bool
                                newDeco.hFlip = true if flip.$.id is 'h_flip' and flip._ is 'true'
                                newDeco.vFlip = true if flip.$.id is 'v_flip' and flip._ is 'true'

                        result.push newDeco

        result

    getSignposts: (layer) ->

        result = []
        for element in layer
            if element.$.id is 'signposts'
                if 'object' of element
                    for signpost in element.object
                        newSignpost = {}
                        #   get the name
                        newSignpost.name = signpost.$.id
                        #   get the position stuff
                        for position in signpost.int
                            newSignpost[position.$.id] = parseInt(position._, 10)

                        #   and now the connections, sorry this goes deep
                        newSignpost.connects = []
                        if 'object' of signpost and signpost.object.length > 0 and 'object' of signpost.object[0]
                            for connection in signpost.object[0].object
                                newConnection = {}

                                # get the flags
                                if 'bool' of connection
                                    for b in connection.bool
                                        newConnection[b.$.id] = true if b._ is 'true'
                                        newConnection[b.$.id] = false if b._ is 'false'

                                #   get the ints
                                if 'int' of connection
                                    for i in connection.int
                                        newConnection[i.$.id] = parseInt(i._, 10)

                                #   get the strings
                                if 'str' of connection
                                    for s in connection.str
                                        newConnection[s.$.id] = s._ unless s.$.id is 'swf_file_versioned'

                                #   and where does it go to?
                                if 'objref' of connection
                                    newConnection.label = connection.objref[0].$.label
                                    newConnection.tsid = connection.objref[0].$.tsid

                                newSignpost.connects.push newConnection

                        result.push newSignpost

        result

convert.init()