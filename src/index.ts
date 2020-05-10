import _ from 'lodash';
import yaml from 'js-yaml';

const { cidr } = require('node-cidr');

// https://github.com/nodeca/js-yaml/blob/master/examples/custom_types.js

const AZs: { [key: string]: string[] } = {
  'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
  'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c', 'ap-northeast-1d'],
};

const replace = (m: string, v: string, k: string) =>
  m.replace(new RegExp(`\\$\{${k}}`, 'g'), v);

const assign = (sources: any[]) => Object.assign({}, ...sources);

const funcs = (params: any) => ({
  Ref: {
    type: '!Ref',
    scalar: (data: string) => params[data],
  },
  'Fn::Join': {
    type: '!Join',
    sequence: (data: [string, string[]]) => data[1].join(data[0]),
  },
  'Fn::Select': {
    type: '!Select',
    sequence: (data: [string, any]) => data[1][data[0]],
  },
  'Fn::Split': {
    type: '!Split',
    sequence: (data: [string, string]) => data[1].split(data[0]),
  },
  'Fn::GetAtt': {
    type: '!GetAtt',
    sequence: (data: string[]) => _.get(params, data.join('.')),
    scalar: (data: string) => _.get(params, data),
  },
  'Fn::Sub': {
    type: '!Sub',
    sequence: (data: [string, any]) =>
      _.reduce(assign([params, data[1]]), replace, data[0]),
    scalar: (data: string) => _.reduce(params, replace, data),
  },
  'Fn::FindInMap': {
    type: '!FindInMap',
    sequence: (data: any[]) => _.get(params, data.join('.')),
  },
  'Fn::GetAZs': {
    type: '!GetAZs',
    scalar: (data: string) => AZs[data] || AZs[params['AWS::Region']],
  },
  'Fn::If': {
    type: '!If',
    sequence: (data: [any, any, any]) => (params[data[0]] ? data[1] : data[2]),
  },
  'Fn::Equals': {
    type: '!Equals',
    sequence: (data: [any, any]) => data[0] === data[1],
  },
  'Fn::And': {
    type: '!And',
    sequence: (data: any[]) => data.find((r) => !r) === undefined,
  },
  'Fn::Or': {
    type: '!Or',
    sequence: (data: any[]) => data.find((r) => r) !== undefined,
  },
  'Fn::Not': {
    type: '!Not',
    sequence: (data: [any]) => !data[0],
  },
  'Fn::Base64': {
    type: '!Base64',
    scalar: (data: string) => Buffer.from(data).toString('base64'),
  },
  'Fn::Cidr': {
    type: '!Cidr',
    sequence: (data: [string, number, number]) =>
      cidr.subnets(data[0], 32 - data[2], data[1]),
  },
  // Not Implemented
  'Fn::ImportValue': {
    type: '!ImportValue',
    scalar: (data: string) => data,
  },
});

const types = (funcs: any) =>
  _.reduce(
    funcs,
    (m: any, v: any) => {
      ['scalar', 'sequence']
        .filter((kind) => v[kind])
        .forEach((kind: any) => {
          m.push(new yaml.Type(v.type, { kind, construct: v[kind] }));
        });
      return m;
    },
    [],
  );

const dofunc = (obj: any, func: any) => {
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

const traverse = (obj: any, func: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((r) => traverse(r, func));
  } else if (typeof obj === 'object') {
    return [
      dofunc(obj, func),
      _.mapValues(obj, (o: any) => traverse(o, func)),
    ].find((r) => r !== undefined);
  } else {
    return obj;
  }
};

const _load = (buff: string, params: any) => {
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

function load(buff: string, params?: any) {
  const phase0 = _load(buff, [aws, params]);

  const Parameters = _.mapValues(phase0.Parameters, 'Default');

  const { Mappings, Resources, Conditions } = phase0;

  const _params = [aws, Parameters, Mappings, Resources, Conditions, params];

  const phase1 = _load(buff, _params);

  return phase1;
}

export default { load };
