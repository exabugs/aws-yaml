import _ from 'lodash';
import _fs from 'fs';
import yaml from '../src/index';

const fs = _fs.promises;

test('template', async () => {
  const buff = await fs.readFile(`${__dirname}/template.yaml`, 'utf8');
  const result = yaml.load(buff);

  const { AWSTemplateFormatVersion } = result;
  expect(AWSTemplateFormatVersion).toEqual('2010-09-09');
});
