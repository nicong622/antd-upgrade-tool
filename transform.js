const { removeEmptyModuleImport } = require('./utils/index');

function removeCompatibleCss(path, i) {
  if (path.node.source.value === '@ant-design/compatible/assets/index.css') {
    path.parent.node.body.splice(i, 1);
  }
}

function removeCompatibleForm(path) {
  if (path.node.source.value === '@ant-design/compatible') {
    path.node.specifiers = path.node.specifiers.filter((node) => node.imported.name !== 'Form');
  }
}

function addFormImport(path, j) {
  if (path.node.source.value === 'antd') {
    const hasImportedForm = !!path.node.specifiers.find((node) => node.imported.name === 'Form');

    if (!hasImportedForm) {
      path.node.specifiers.push(j.importSpecifier(j.identifier('Form'), j.identifier('Form')));
    }
  }
}

function importDeclarationVisitor(j, root) {
  root.find(j.ImportDeclaration).forEach((path, i) => {
    removeCompatibleCss(path, i);
    removeCompatibleForm(path);
    addFormImport(path, j);
  });

  removeEmptyModuleImport(j, root, '@ant-design/compatible');

  return root;
}

function removeFieldDecorator(j, root) {
  return root
    .find(j.JSXExpressionContainer)
    .filter((path) => path.node.expression?.callee?.callee?.name === 'getFieldDecorator')
    .forEach((path) => {
      const parent = path.parent.node;
      const index = parent.children.findIndex((node) => node.type === 'JSXExpressionContainer');

      const tagAttributes = parent.openingElement.attributes;
      const calleeArgs = path.node.expression.callee.arguments;

      try {
        const fieldValue =
          calleeArgs[0].type === 'StringLiteral'
            ? calleeArgs[0]
            : j.jsxExpressionContainer(calleeArgs[0]);

        // 添加 FormItem 的 name 属性
        tagAttributes.push(j.jsxAttribute(j.jsxIdentifier('name'), fieldValue));
      } catch (err) {
        console.log(err);
      }

      if (calleeArgs.length > 1) {
        // getFieldDecorator 的第二个参数
        const fieldDecoArgs = calleeArgs[1].properties;

        // 把 getFieldDecorator 的第二个参数中的属性转成 Form.Item
        fieldDecoArgs.forEach((node) => {
          try {
            tagAttributes.push(
              j.jsxAttribute(j.jsxIdentifier(node.key.name), j.jsxExpressionContainer(node.value))
            );
          } catch (e) {
            console.error(e);
          }
        });
      }

      // 获取在 getFieldDecorator 中传入的组件
      const formFields = path.node.expression.arguments;
      // 用 getFieldDecorator 中的组件替换掉 getFieldDecorator 区块
      parent.children.splice(index, 1, ...formFields);
    });
}

module.exports = function (fileInfo, api) {
  if (!fileInfo.source.includes('@ant-design/compatible')) return null;

  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  importDeclarationVisitor(j, root);
  removeFieldDecorator(j, root);

  return root.toSource();
};

module.exports.parser = 'tsx';
