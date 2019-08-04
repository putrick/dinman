const { getConfig } = require('./config');

const looseDependencyTypes = getConfig().looseDependencyTypes || [];
const repository = require('./repository');
const processes = require('./processes');
const logger = require('./logger');

const isLooseDependency = (app, dependencyApp) =>
  looseDependencyTypes.some(looseDependencyType =>
    app.type === looseDependencyType.from &&
      dependencyApp.type === looseDependencyType.to);

const startAppWithDependencies = (app, appsToStart, depth = Number.MAX_SAFE_INTEGER, currentDepth = 0) => {
  if (appsToStart.includes(app.name)) {
    return;
  }
  appsToStart.push(app.name);
  app.dependencies.forEach((dependencyAppName) => {
    if (appsToStart.includes(dependencyAppName) || dependencyAppName === app.name || currentDepth >= depth) {
      return;
    }
    const dependencyApp = repository.getAppByName(dependencyAppName);
    if (isLooseDependency(app, dependencyApp)) {
      return;
    }
    startAppWithDependencies(dependencyApp, appsToStart, depth, currentDepth + 1);
  });
  processes.startApp(app.name);
};

const startApp = (appName, depth) => {
  const app = repository.getAppByName(appName);

  if (!app) {
    logger.info(`App ${appName} not found.`);
    return;
  }

  startAppWithDependencies(app, [], depth);
};

const startAppExcluded = (appName) => {
  const app = repository.getAppByName(appName);

  if (!app) {
    logger.info(`App ${appName} not found.`);
    return;
  }

  const appsToStart = [app.name];
  app.dependencies.forEach((dependencyAppName) => {
    if (dependencyAppName === app.name) {
      return;
    }
    const dependencyApp = repository.getAppByName(dependencyAppName);
    if (isLooseDependency(app, dependencyApp)) {
      return;
    }
    startAppWithDependencies(dependencyApp, appsToStart);
  });
};

module.exports = {
  startApp,
  startAppExcluded,
};
