# aws-yaml

## Overview

Parse AWS Yaml into json

https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html

## How To Install

```
yarn add aws-yaml
```

## How To Use

```
import yaml from 'aws-yaml';
import fs from 'fs';

const buff = await fs.promises.readFile('template.yaml', 'utf8');
const json = yaml.load(buff);

const { Resources } = json;
```

## Available Tags

| full          | short      |
| ------------- | ---------- |
| Ref           | !Ref       |
| Fn::Join      | !Join      |
| Fn::Select    | !Select    |
| Fn::Split     | !Split     |
| Fn::GetAtt    | !GetAtt    |
| Fn::Sub       | !Sub       |
| Fn::FindInMap | !FindInMap |
| Fn::GetAZs    | !GetAZs    |
| Fn::If        | !If        |
| Fn::Equals    | !Equals    |
| Fn::And       | !And       |
| Fn::Or        | !Or        |
| Fn::Not       | !Not       |
| Fn::Base64    | !Base64    |
| Fn::Cidr      | !Cidr      |

## Unavailable Tags

| full            | short        |
| --------------- | ------------ |
| Fn::ImportValue | !ImportValue |
| Fn::Transform   | !Transform   |
