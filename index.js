const yaml = require('js-yaml');
const _ = require('lodash');
const { cidr } = require('node-cidr');

// https://github.com/nodeca/js-yaml/blob/master/examples/custom_types.js

const AZs = {
  'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
  'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
};

const replace = (m, v, k) => m.replace(new RegExp(`\\$\{${k}}`, 'g'), v);

const assign = (sources) => Object.assign({}, ...sources);

const funcs = (params) => ({
  Ref: {
    type: '!Ref',
    scalar: (data) => params[data],
  },
  'Fn::Join': {
    type: '!Join',
    sequence: (data) => data[1].join(data[0]),
  },
  'Fn::Select': {
    type: '!Select',
    sequence: (data) => data[1][data[0]],
  },
  'Fn::Split': {
    type: '!Split',
    sequence: (data) => data[1].split(data[0]),
  },
  'Fn::GetAtt': {
    type: '!GetAtt',
    sequence: (data) => _.at(params, data.join('.'))[0],
    scalar: (data) => _.at(params, data)[0],
  },
  'Fn::Sub': {
    type: '!Sub',
    sequence: (data) => _.reduce(assign([params, data[1]]), replace, data[0]),
    scalar: (data) => _.reduce(params, replace, data),
  },
  'Fn::FindInMap': {
    type: '!FindInMap',
    sequence: (data) => _.at(params, data.join('.'))[0],
  },
  'Fn::GetAZs': {
    type: '!GetAZs',
    scalar: (data) => AZs[data] || AZs[params['AWS::Region']],
  },
  'Fn::If': {
    type: '!If',
    sequence: (data) => (params[data[0]] ? data[1] : data[2]),
  },
  'Fn::Equals': {
    type: '!Equals',
    sequence: (data) => data[0] === data[1],
  },
  'Fn::And': {
    type: '!And',
    sequence: (data) => data.find((r) => !r) === undefined,
  },
  'Fn::Or': {
    type: '!Or',
    sequence: (data) => data.find((r) => r) !== undefined,
  },
  'Fn::Not': {
    type: '!Not',
    sequence: (data) => !data[0],
  },
  'Fn::Base64': {
    type: '!Base64',
    scalar: (data) => Buffer.from(data).toString('base64'),
  },
  'Fn::Cidr': {
    type: '!Cidr',
    sequence: (data) => cidr.subnets(data[0], 32 - data[2], data[1]),
  },
});

const types = (funcs) =>
  _.reduce(
    funcs,
    (m, v) => {
      ['scalar', 'sequence']
        .filter((kind) => v[kind])
        .forEach((kind) => {
          m.push(new yaml.Type(v.type, { kind, construct: v[kind] }));
        });
      return m;
    },
    [],
  );

const dofunc = (obj, func) => {
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const key = keys[0];
    const f = func[key];
    if (f) {
      const v = traverse(obj[key], func);
      if (Array.isArray(v)) {
        return f.sequence(v);
      } else {
        return f.scalar(v);
      }
    }
  }
};

const traverse = (obj, func) => {
  if (Array.isArray(obj)) {
    return obj.map((r) => traverse(r, func));
  } else if (typeof obj === 'object') {
    return [dofunc(obj, func), _.mapValues(obj, (o) => traverse(o, func))].find(
      (r) => r !== undefined,
    );
  } else {
    return obj;
  }
};

const _load = (buff, params) => {
  const p = assign(params);
  const f = funcs(p);
  const schema = yaml.Schema.create(types(f));
  const result = yaml.load(buff, { schema });
  return traverse(result, f);
};

const aws = {
  'AWS::AccountId': '',
  'AWS::NotificationARNs': [],
  'AWS::Partition': 'aws',
  'AWS::Region': process.env.AWS_DEFAULT_REGION || 'us-east-1',
  'AWS::StackId': '',
  'AWS::StackName': '',
  'AWS::URLSuffix': 'amazonaws.com',
};

function load(buff, params) {
  const phase0 = _load(buff, [aws, params]);

  const Parameters = _.mapValues(phase0.Parameters, 'Default');

  const { Mappings, Resources, Conditions } = phase0;

  const _params = [aws, Parameters, Mappings, Resources, Conditions, params];

  const phase1 = _load(buff, _params);

  return phase1;
}

module.exports = { load };
