fs = require 'fs'
xml2js = require 'xml2js'
async = require 'async'

convert =

	fileList: []

	#   Grab all the location files and queue them with async
	init: ->
		fs.readdir './locations-original-xml', (err, files) ->
			throw err if err
			convert.fileList = files
			queue = async.queue((file, callback) -> 
				convert.convertFiles(file, callback)
			, 4) # will run 4 tasks at once

			#   nice! :)
			queue.drain = ->
				console.log '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=';
				console.log 'Done!'

			queue.push(files)
			
	#   Now go through each on in turn converting it
	convertFiles: (file, callback) ->

		#sources is a folder, not a file
		if file is 'sources'
			return

		#   Lazy check, should use filters above
		if file is '.DS_Store'
			return callback()

		console.log file

		parser = new xml2js.Parser()
		fs.readFile './locations-original-xml/' + file, (err, data) ->
			throw err if err
			parser.parseString data, (err, dataJSON) ->

				#read in the source file for this street and parse it
				sourceData = convert.getSourceData(dataJSON)

				##  Get the base information
				locationJSON = convert.getBaseInformation(dataJSON,sourceData)
				locationJSON.gradient = convert.getGradient(dataJSON)
				locationJSON.dynamic = convert.getBaseDimensions(dataJSON)
				locationJSON.dynamic.layers = convert.getLayers(dataJSON)

				#extract the objrefs tag from the sourceData
				locationJSON.objrefs = convert.getObjRefs(sourceData)

				#   Write the file out
				fs.writeFile './locations/' + file.replace('.xml', '.json'), JSON.stringify(locationJSON, null, 4), (err) ->
					throw err if err
					fs.writeFile './locations/' + file.replace('.xml', '.callback.json'), 'getRoom(' + JSON.stringify(locationJSON) + ')', (err) ->
						throw err if err
						callback()

	getSourceData: (dataJSON) ->

		sourceData = ""
		tsid = dataJSON.game_object.$.tsid
		#read in the corresponding source file
		tsid = "L" + tsid.slice(1,tsid.length)
		sourceFile = fs.readFileSync './locations-original-xml/sources/' + tsid + '.xml'
				
		#parse the xml
		parser = new xml2js.Parser()
		parser.parseString sourceFile, (err, data) ->
			sourceData = data

		sourceData

	getBaseInformation: (dataJSON,sourceData) ->

		locationJSON = {}
		locationJSON.tsid = dataJSON.game_object.$.tsid
		locationJSON.label = dataJSON.game_object.$.label
		locationJSON.hub_id = sourceData.game_object.$.hubid
		locationJSON.mote_id = sourceData.game_object.$.moteid
		locationJSON.loading_image = convert.getLoadingImage(sourceData)
		locationJSON.main_image = convert.getMainImage(sourceData)

		locationJSON

	getLoadingImage: (sourceData) ->

		loading_image = {}
		for o in sourceData.game_object.object
			if o.$.id is 'dynamic'
				if 'object' of o
					for object in o.object
						if object.$.id is 'loading_image'
							if 'str' of object
								loading_image.url = "http://c2.glitch.bz/" + object.str[0]._
							if 'int' of object
								for d in object.int
									loading_image[d.$.id] = parseInt(d._, 10)
			
		loading_image

	getMainImage: (sourceData) ->

		mainImage = {}
		for o in sourceData.game_object.object
			if o.$.id is 'dynamic'
				if 'object' of o
					for object in o.object
						if object.$.id is 'image'
							if 'str' of object
								mainImage.url = "http://c2.glitch.bz/" + object.str[0]._
							if 'int' of object
								for d in object.int
									mainImage[d.$.id] = parseInt(d._, 10)
			
		mainImage

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
							result[layer.$.id].platformLines = convert.getPlatformLines(layer.object)                 
							result[layer.$.id].ladders = convert.getLadders(layer.object)
							result[layer.$.id].walls = convert.getWalls(layer.object)

							#   TODO: Impliment the following
							#   use GUVVV3FU2FC38SK.json as a test source
							###
							result[layer.$.id].boxes = convert.getBoxes(layer.object)
							result[layer.$.id].doors = convert.getDoors(layer.object)
							result[layer.$.id].targets = convert.getTargets(layer.object)
							###


		result

	getObjRefs: (sourceData) ->

		objrefs = []
		#Get the items listed in objrefs and add them to the json
		if 'objrefs' of sourceData.game_object
			for item in sourceData.game_object.objrefs
				if item.$.id is 'items'
					if 'objref' of item
						for oref in item.objref
							if '$' of oref
								objref = {}
								objref.tsid = oref.$.tsid
								objref.label = oref.$.label
								objrefs.push objref

		objrefs

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

						#   get boolean values 
						if 'bool' of deco
							for value in deco.bool
								newDeco[value.$.id] = (value._ is 'true')

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

	getPlatformLines: (layer) ->
		
		result = []
		for element in layer
			if element.$.id is 'platform_lines'
				if 'object' of element
					for platformLine in element.object
						newPlatformLine = {}
						newPlatformLine.id = platformLine.$.id

						if 'int' of platformLine
							for perm in platformLine.int
								newPlatformLine[perm.$.id] = parseInt(perm._, 10)

						newPlatformLine.endpoints = []
						if 'object' of platformLine
							for endpoint in platformLine.object
								newEndpoint = {}
								newEndpoint.name = endpoint.$.id

								if 'int' of endpoint
									for i in endpoint.int
										newEndpoint[i.$.id] = parseInt(i._,10)

								newPlatformLine.endpoints.push newEndpoint

						result.push newPlatformLine

		result

	getLadders: (layer) ->

		result = []
		for element in layer
			if element.$.id is 'ladders'
				if 'object' of element
					for ladder in element.object
						newLadder = {}
						newLadder.id = ladder.$.id

						if 'int' of ladder
							for i in ladder.int
								newLadder[i.$.id] = parseInt(i._, 10)

						result.push newLadder

		result

	getWalls: (layer) ->

		result = []
		for element in layer
			if element.$.id is 'walls'
				if 'object' of element
					for wall in element.object
						newWall = {}
						newWall.id = wall.$.id

						if 'int' of wall
							for i in wall.int
								newWall[i.$.id] = parseInt(i._, 10)

						result.push newWall

		result

convert.init()