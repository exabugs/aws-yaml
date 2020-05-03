# aws-yaml

## Overview

Parse AWS Yaml into json

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

| Tag           |     |
| ------------- | --- |
| Ref           |     |
| Fn::Join      |     |
| Fn::Select    |     |
| Fn::Split     |     |
| Fn::GetAtt    |     |
| Fn::Sub       |     |
| Fn::FindInMap |     |
| Fn::GetAZs    |     |
| Fn::If        |     |
| Fn::Equals    |     |
| Fn::And       |     |
| Fn::Or        |     |
| Fn::Not       |     |
| Fn::Base64    |     |
| Fn::Cidr      |     |

## Unavailable Tags

| Tag             |     |
| --------------- | --- |
| Fn::ImportValue |     |
| Fn::Transform   |     |
