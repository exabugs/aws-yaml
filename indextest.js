const yaml = require('./index');
const fs = require('fs').promises;

const main = async () => {
  const buff = await fs.readFile(`${__dirname}/template.yaml`, 'utf8');
  const result = yaml.load(buff);

  result;
};

main();
