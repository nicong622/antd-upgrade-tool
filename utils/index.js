function removeEmptyModuleImport(j, root, moduleName) {
  root
    .find(j.ImportDeclaration)
    .filter((path) => path.node.specifiers.length === 0 && path.node.source.value === moduleName)
    .replaceWith();
}

module.exports = {
  removeEmptyModuleImport,
};
