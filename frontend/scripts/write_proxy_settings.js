const fs = require('fs')
const aws_export = 'src/aws-exports.ts'
const proxy_settings = 'src/proxy.conf.json'
let endpoint;

fs.readFile(aws_export, 'utf8', function (err, data) {
  if (err) {
    return console.log(err)
  }
  const endpointIndex = data.indexOf('endpoint: \'https:');
  const firstIndex = data.indexOf('\'', endpointIndex + 1) + 1;
  const secondIndex = data.indexOf('\'', firstIndex + 1);
  endpoint = data.substr(firstIndex, secondIndex - firstIndex);
  endpoint = endpoint.substr(0, endpoint.lastIndexOf('/'));
})

fs.readFile(proxy_settings, 'utf8', function (err, data) {
  if (err) {
    return console.log(err)
  }

  const json = JSON.parse(data);

  json['/dev'].target = endpoint;
  json['/prod'].target = endpoint;

  const result = JSON.stringify(json, null, 2);

  fs.writeFile(proxy_settings, result, 'utf8', function (err) {
    if (err) return console.log(err)
  })
})
