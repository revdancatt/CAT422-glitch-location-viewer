library filename_extensions;

import 'dart:async';
import 'dart:io';

Future main() async {
	// Find path

	String repo = Directory.current // filename-extensions
		.parent // tools
		.parent.path;
	String json = repo + '/locations';
	Directory jsonDir = new Directory(json);

	// Find files

	List<FileSystemEntity> fes = await jsonDir.list(recursive: true).toList();
	List<File> files = [];
	for (FileSystemEntity fe in fes) {
		if (fe is File) {
			files.add(fe);
		}
	}

	// Process files

	print('Found ${files.length} file(s).\n');

	int converted = 0;
	int errors = 0;

	for (File file in files) {
		try {
			await convertFile(file);
			converted++;
		} catch (_) {
			print('Error converting ${file.path}!');
			errors++;
		}
	}

	print('\nConverted $converted file(s), $errors file(s) failed to convert.');
}

Future convertFile(File file) async {
	print('Converting ${file.path}...');

	// Read file

	List<String> lines = await file.readAsLines();

	// Edit filenames

	for (int lI = 0; lI < lines.length; lI++) {
		String oldLine = lines[lI];

		if (oldLine.contains('filename')) {
			String newLine = '\t';

			oldLine.splitMapJoin(new RegExp(r'"filename": "(.*?)"'),
				onMatch: (Match m) {
					String filename = m.group(1);
					if (filename.contains('.')) {
						// Already has an extension
						newLine += filename;
					} else {
						newLine += '"filename": "$filename.png"';
					}
				},
				onNonMatch: (String n) {
					newLine += n;
				}
			);
			lines[lI] = newLine;
		}
	}

	// Write file

	await file.writeAsString(lines.join('\n'));
}
