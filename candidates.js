var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {

    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));

  });
  return filelist.filter(file=>{return file.indexOf(".yml")>0});
}

const filter_file = (dir, tags="") => {
  tags = tags.toLowerCase()
  var objTags = tags.split(",").map(t=>{return t.trim()})

  var collect = { }
  collect.godList = []
  collect.matchList = []

  var list = walkSync(dir);
  list.forEach(file=>{
    collect.godList.push(file)
    var test_stream = fs.readFileSync(file, 'utf8');
    var doc = yaml.safeLoad(test_stream);
    if(tags=="") {
      collect.matchList.push(file)
    }
    if(doc.tags!=undefined) {
      doc.tags.split(",").forEach(tag=>{
        tag=tag.trim().toLowerCase();
        if(collect[tag]==undefined) {collect[tag]= [];}
        collect[tag].push(file)
        if(objTags.indexOf(tag)!=-1 && collect.matchList.indexOf(file)==-1) {  collect.matchList.push(file) }
      })
    }
  })
  //console.debug(collect);
  return collect.matchList
}


module.exports.file_list = filter_file
