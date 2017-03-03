'use strict';

/**
 * The default module of the rekit-core package. It does two things:
 *
 * 1. Wraps modularized APIs to final Rekit commands.
 * 2. Exports other modules as properties. i.e. `require('rekit-core').component` equals to `require('rekit-core/component')`.
 *
 * @module rekit-core
**/

const _ = require('lodash');
const component = require('./component');
const style = require('./style');
const test = require('./test');
const action = require('./action');
const featureMgr = require('./feature');
const utils = require('./utils');
const vio = require('./vio');
const refactor = require('./refactor');
const entry = require('./entry');
const route = require('./route');
const template = require('./template');
const plugin = require('./plugin');
const constant = require('./constant');

const injectExtensionPoints = plugin.injectExtensionPoints;

/**
 * Add a component including unit test and style files. It wraps APIs from `component`, `style` and `test`.
 *
 * @param {string} feature - the feature where to create the component.
 * @param {string} name - the component name, will be converted to pascal case.
 * @param {object} args - other args.
 * @alias module:rekit-core.addComponent
 *
 * @example <caption>Create a container component</caption>
 * const rekitCore = require('rekit-core');
 *
 * // Add a component named 'TopicList' which is connected to Redux store.
 * rekitCore.addComponent('home', 'topic-list', { connect: true });
 *
 * // Write the changes to disk. Otherwise only in memory, see more at rekitCore/vio
 * rekitCore.vio.flush();
**/
function addComponent(feature, name, args) {
  feature = _.kebabCase(feature);
  name = _.pascalCase(name);

  args = args || {};
  component.add(feature, name, {
    templateFile: args.connect ? 'ConnectedComponent.js' : 'Component.js',
  });
  if (args.urlPath) {
    let urlPath = args.urlPath;
    if (urlPath === '$auto') urlPath = name;
    urlPath = _.kebabCase(urlPath);
    route.add(feature, name, { urlPath, isIndex: !!args.isIndex });
  }
  style.add(feature, name);
  test.add(feature, name, {
    templateFile: args.connect ? 'ConnectedComponent.test.js' : 'Component.test.js',
  });
}

/**
 * Remove a component including unit test and style files. It wraps APIs from `component`, `style` and `test`.
 *
 * @param {string} feature - the feature where to create the component.
 * @param {string} name - the component name, will be converted to pascal case.
 * @alias module:rekit-core.removeComponent
 *
 * @example <caption>Remove a container component</caption>
 * const rekitCore = require('rekit-core');
 *
 * // Remove a component named 'TopicList' which is connected to Redux store.
 * rekitCore.removeComponent('home', 'topic-list');
 *
 * // Write the changes to disk. Otherwise only in memory, see more at rekitCore/vio
 * rekitCore.vio.flush();
**/
function removeComponent(feature, name) {
  feature = _.kebabCase(feature);
  name = _.pascalCase(name);
  component.remove(feature, name);
  route.remove(feature, name);
  style.remove(feature, name);
  test.remove(feature, name);
}

/**
 * Move/rename a component including unit test and style files. It wraps APIs from `component`, `style` and `test`.
 *
 * @param {object} source - which component to be moved, in form of { name: {string}, feature: {string} }.
 * @param {object} target - where to move, in form of { name: {string}, feature: {string} }.
 * @alias module:rekit-core.moveComponent
 *
 * @example <caption>Rename TopicList to Topics</caption>
 * const rekitCore = require('rekit-core');
 *
 * // Rename the component from 'TopicList' to 'Topics'
 * rekitCore.moveComponent({ feautre: 'home', name: 'topic-list' }, { feautre: 'home', name: 'topics' });
 *
 * // Write the changes to disk. Otherwise only in memory, see more at rekitCore/vio
 * rekitCore.vio.flush();
**/
function moveComponent(source, target) {
  source.feature = _.kebabCase(source.feature);
  source.name = _.pascalCase(source.name);
  target.feature = _.kebabCase(target.feature);
  target.name = _.pascalCase(target.name);

  component.move(source, target);
  test.move(source, target);
  style.move(source, target);
  route.move(source, target);
}

function addAsyncAction(feature, name) {
  action.addAsync(feature, name);
  test.addAction(feature, name, { isAsync: true });
}

function removeAsyncAction(feature, name) {
  action.removeAsync(feature, name);
  test.removeAction(feature, name);
}

function moveAsyncAction(source, dest) {
  action.moveAsync(source, dest);
  test.moveAction(source, dest, { isAsync: true });
}

function addAction(feature, name, args) {
  args = args || {};
  if (args.async) {
    addAsyncAction(feature, name);
    return;
  }
  action.add(feature, name);
  test.addAction(feature, name);
}

function removeAction(feature, name) {
  const targetPath = utils.mapReduxFile(feature, name);
  if (_.get(refactor.getRekitProps(targetPath), 'action.isAsync')) {
    removeAsyncAction(feature, name);
    return;
  }
  action.remove(feature, name);
  test.removeAction(feature, name);
}

function moveAction(source, target) {
  const targetPath = utils.mapReduxFile(source.feature, source.name);
  if (_.get(refactor.getRekitProps(targetPath), 'action.isAsync')) {
    moveAsyncAction(source, target);
    return;
  }
  action.move(source, target);
  test.moveAction(source, target);
}

function addFeature(name) {
  featureMgr.add(name);
  entry.addToRootReducer(name);
  entry.addToRouteConfig(name);
  entry.addToRootStyle(name);

  // Add default page and sample action
  addComponent(name, 'default-page', { isIndex: true, connect: true, urlPath: '$auto' });
  addAction(name, 'sample-action');
}

function removeFeature(name) {
  featureMgr.remove(name);
  entry.removeFromRootReducer(name);
  entry.removeFromRouteConfig(name);
  entry.removeFromRootStyle(name);
}

function moveFeature(oldName, newName) {
  featureMgr.move(oldName, newName);
}

const coreCommands = {
  addComponent: injectExtensionPoints(addComponent, 'add', 'component'),
  removeComponent: injectExtensionPoints(removeComponent, 'remove', 'component'),
  moveComponent: injectExtensionPoints(moveComponent, 'move', 'component'),
  addAction: injectExtensionPoints(addAction, 'add', 'action'),
  removeAction: injectExtensionPoints(removeAction, 'remove', 'action'),
  moveAction: injectExtensionPoints(moveAction, 'move', 'action'),
  addAsyncAction: injectExtensionPoints(addAsyncAction, 'add', 'async-action'),
  removeAsyncAction: injectExtensionPoints(removeAsyncAction, 'remove', 'async-action'),
  moveAsyncAction: injectExtensionPoints(moveAsyncAction, 'move', 'async-action'),
  addFeature: injectExtensionPoints(addFeature, 'add', 'feature'),
  removeFeature: injectExtensionPoints(removeFeature, 'remove', 'feature'),
  moveFeature: injectExtensionPoints(moveFeature, 'move', 'feature'),
};

function splitName(name) {
  const arr = name.split('/');
  return {
    feature: arr[0],
    name: arr[1],
  };
}

function handleCommand(args) {
  const params = [];
  switch (args.commandName) {
    case 'add':
    case 'remove': {
      if (args.type === 'feature') params.push(args.name);
      else {
        params.push(splitName(args.name).feature);
        params.push(splitName(args.name).name);
      }
      break;
    }
    case 'move': {
      if (args.type === 'feature') {
        params.push(args.source);
        params.push(args.target);
      } else {
        params.push(splitName(args.source));
        params.push(splitName(args.target));
      }
      break;
    }
    default:
      break;
  }
  params.push(args);

  let cmd = plugin.getCommand(args.commandName, args.type);
  if (!cmd) {
    cmd = coreCommands[_.camelCase(args.commandName + '-' + args.type)];
  }

  if (!cmd) {
    utils.fatalError(`Can't find the desired command: ${args.commandName}`);
  }
  cmd.apply(null, params);
}

module.exports = Object.assign({
  vio,
  refactor,
  utils,
  component,
  constant,
  style,
  test,
  action,
  template,
  feature: featureMgr,
  entry,
  route,
  plugin,

  handleCommand,
}, coreCommands);

// NOTE: plugin.loadPlutins should be executed after module.exports to avoid circular dependency
// plugin.loadPlugins();
