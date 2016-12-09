/* eslint no-console: 0 */

'use strict';

const path = require('path');
const _ = require('lodash');
const shell = require('shelljs');
const colors = require('colors/safe');
const vio = require('./vio');

let silent = false;

// NOTE: I just assume helpers is always loaded before lodash is used...
_.pascalCase = _.flow(_.camelCase, _.upperFirst);
_.upperSnakeCase = _.flow(_.snakeCase, _.toUpper);


function setSilent(isSilent) {
  silent = isSilent;
}

function log(msg) {
  if (!silent) console.log(msg);
}

function warn(msg) {
  if (!silent) console.log(colors.yellow('Warning: ' + msg));
}

function error(msg) {
  if (!silent) console.log(colors.red('Error: ' + msg));
}

function fatalError(msg) {
  error(msg);
  throw new Error('Error: ' + msg);
}

let prjRoot;

function setProjectRoot(root) {
  prjRoot = root;
}

function getProjectRoot() {
  if (!prjRoot) {
    let cwd = process.cwd();
    let lastDir = null;
    // Traverse above until find the package.json.
    while (cwd && lastDir !== cwd) {
      if (shell.test('-e', path.join(cwd, 'package.json'))) {
        prjRoot = cwd;
        break;
      }
      lastDir = cwd;
      cwd = path.join(cwd, '..');
    }
  }
  return prjRoot;
}

function getActionType(feature, action) {
  return `${_.upperSnakeCase(feature)}_${_.upperSnakeCase(action)}`;
}

function getAsyncActionTypes(feature, action) {
  return {
    normal: getActionType(feature, action),
    begin: `${_.upperSnakeCase(feature)}_${_.upperSnakeCase(action)}_BEGIN`,
    success: `${_.upperSnakeCase(feature)}_${_.upperSnakeCase(action)}_SUCCESS`,
    failure: `${_.upperSnakeCase(feature)}_${_.upperSnakeCase(action)}_FAILURE`,
    dismissError: `${_.upperSnakeCase(feature)}_${_.upperSnakeCase(action)}_DISMISS_ERROR`,
  };
}

function mapSrcFile(fileName) {
  return path.join(getProjectRoot(), 'src', fileName);
}

function mapFeatureFile(feature, fileName) {
  return path.join(getProjectRoot(), 'src/features', _.kebabCase(feature), fileName);
}

function mapTestFile(feature, fileName) {
  return path.join(getProjectRoot(), 'tests/features', _.kebabCase(feature), fileName);
}

function mapComponent(feature, name) {
  // Map a component, page name to the file.
  return mapFeatureFile(feature, _.pascalCase(name));
}

function mapReduxFile(feature, name) {
  return mapFeatureFile(feature, 'redux/' + _.camelCase(name) + '.js');
}

function mapReduxTestFile(feature, name) {
  return mapTestFile(feature, 'redux/' + _.camelCase(name) + '.test.js');
}

function mapComponentTestFile(feature, name) {
  return mapTestFile(feature, _.pascalCase(name) + '.test.js');
}

function assertNotEmpty(str, name) {
  if (!str) {
    fatalError(name + ' should not be empty.');
  }
}

function assertFeatureExist(feature) {
  const p = path.join(getProjectRoot(), 'src/features', _.kebabCase(feature));
  if (!shell.test('-e', p) && !vio.dirExists(p)) {
    fatalError('Feature doesn\'t exist: ' + feature);
  }
}

function assertFeatureNotExist(feature) {
  const p = path.join(getProjectRoot(), 'src/features', _.kebabCase(feature));
  if (shell.test('-e', p) || vio.dirExists(p)) {
    fatalError('Feature doesn\'t exist: ' + feature);
  }
}

function getFeatures() {
  return _.toArray(shell.ls(path.join(getProjectRoot(), 'src/features')));
}

module.exports = {
  cssExt: 'less',
  setProjectRoot,
  getProjectRoot,
  getActionType,
  getAsyncActionTypes,
  mapSrcFile,
  mapComponent,
  mapReduxFile,
  mapReduxTestFile,
  mapFeatureFile,
  mapTestFile,
  mapComponentTestFile,
  assertNotEmpty,
  assertFeatureExist,
  assertFeatureNotExist,
  getFeatures,
  fatalError,
  setSilent,
  log,
  warn,
  error,
};
