//  Open a folder of fla files, and then output them in a parallel
//  folder called "output"
//
//  This is very rough and ready and needs babysitting for the files
//  that don't work.
//
//  Good luck!

var folder = fl.browseForFolderURL("Choose a folder to publish:");
var files = FLfile.listFolder(folder + "/*.fla", "files");
for (file in files) {
        var curFile = files[file];

        // open document, export, and close
        try {
            fl.openDocument(folder + "/" + curFile);
            var exportFileName = folder + '/../output/' + fl.getDocumentDOM().name.replace('.fla','.png');
            fl.getDocumentDOM().exportPNG(exportFileName, true, true);
            fl.closeDocument(fl.getDocumentDOM());
        } catch(er) {
            fl.trace(curFile);
            fl.trace(er);
            fl.trace('----------------');
        }
}