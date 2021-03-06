const debug = require('debug')('config');

const CONFIG_DIR_PATH = process.env.CONFIG_DIR_PATH || '../../../config';
const ENV_FILE_PATH = process.env.ENV_FILE_PATH || '../../../.env.json';

const _ = require('lodash');
const iterator = require('object-recursive-iterator');
const path = require('path');
const isJSON = require('is-json');

applyEnvFile(ENV_FILE_PATH);

const defaultConfig = resolveConfig(path.join(CONFIG_DIR_PATH, 'default.json'));
const productionConfig = resolveConfig(path.join(CONFIG_DIR_PATH, 'production.json'));
const resultConfig = mergeConfigs(defaultConfig, productionConfig);

module.exports = _.assign({ get, set }, resultConfig);

function get(config) {
  return _.get(resultConfig, config);
}

function set(path, value) {
  return _.set(resultConfig, path, value);
}

function resolveConfig(configPath) {
  const config = require(configPath);

  iterator.forAll(config, function (path, key, obj) {
    if (!process.env[obj[key]]) return;

    const value = _.trim(process.env[obj[key]], '\'');
    obj[key] = isJSON(value) ? JSON.parse(value) : value;
  });

  return config;
}

function applyEnvFile(envFilePath) {
  try {
    const envFile = require(envFilePath);
    _.mapKeys(envFile, (value, envName) => {
      process.env[envName] = value;
    })
  } catch (err) {
    // No env file. It's okay.
  }
}

function mergeConfigs(defaultConfig, productionConfig) {
  const config = process.env.NODE_ENV === 'production' ?
    _.assign({}, defaultConfig, productionConfig) :
    defaultConfig;

  debug(config);
  return config;
}
