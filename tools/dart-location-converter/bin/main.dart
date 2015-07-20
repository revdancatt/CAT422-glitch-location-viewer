import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:xml/xml.dart';
import 'package:jsonx/jsonx.dart' as jsonx;

main(List<String> args) async {
	Directory origLocations = new Directory('../../locations-original-xml');
	await for (FileSystemEntity entity in origLocations.list()) {
		if (entity is File) {
			File xmlFile = entity;
			String tsid = xmlFile.path.substring(xmlFile.path.lastIndexOf('/') + 1, xmlFile.path.length - 4);
			File jsonFile = new File('../../locations/$tsid.json');
			File jsonCallbackFile = new File('../../locations/$tsid.callback.json');

			XmlDocument document = parse(await xmlFile.readAsString());

			Map locationJson = JSON.decode(await jsonFile.readAsString());
			locationJson['physics'] = await _getPhysics(document);
			jsonFile.writeAsString(jsonx.encode(locationJson, indent:'    '));
			jsonCallbackFile.writeAsString('getRoom('+JSON.encode(locationJson)+')');
			print('wrote ${jsonFile.path}');
		}
	}
}

Future<Map> _getPhysics(XmlDocument document) async {
	Map physicsMap = {};

	XmlElement dynamic = document.firstChild.children[1];
	List<XmlElement> possiblePhysics = dynamic.findElements('object').toList();

	possiblePhysics.forEach((XmlElement element) {
		element.attributes.forEach((XmlAttribute attr) async {
			if (attr.value == 'physics') {
				//we found the actual physics element
				//lets put it in the physics map
				element.children.forEach((XmlNode child) {
					List<XmlAttribute> attributes = child.attributes;
					attributes.forEach((XmlAttribute attr) {
						physicsMap[attributes[0].value] = num.parse(child.text);
					});
				});
			}
		});
	});

	return physicsMap;
}