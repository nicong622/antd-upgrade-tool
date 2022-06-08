function makeVisitor(t) {
  return {
    // 处理 {getFieldDecorator()()} 相关语句
    JSXExpressionContainer(path) {
      if (
        path.parent.type === 'JSXElement' &&
        path.node.expression?.callee?.callee?.name === 'getFieldDecorator'
      ) {
        const parent = path.parent;
        const index = parent.children.findIndex((node) => node.type === 'JSXExpressionContainer');

        // getFieldDecorator 的第二个参数
        const fieldDecoArgs = path.node.expression.callee.arguments[1].properties;

        const tagAttributes = parent.openingElement.attributes;
        // 把 getFieldDecorator 的第二个参数中的属性转成 Form.Item
        fieldDecoArgs.forEach((node) => {
          tagAttributes.push(
            t.jsxAttribute(t.jSXIdentifier(node.key.name), t.JSXExpressionContainer(node.value))
          );
        });

        // 获取在 getFieldDecorator 中传入的组件
        const formFields = path.node.expression.arguments;
        // 用 getFieldDecorator 中的组件替换掉 getFieldDecorator 区块
        parent.children.splice(index, 1, ...formFields);
      }
    },

    // 移除 @ant-design/compatible 相关 import
    ImportDeclaration(path) {
      if (path.node.source.value === '@ant-design/compatible') {
        path.remove();

        // 从 antd 中 import Form 组件
        path.container.forEach((node) => {
          if (node.type === 'ImportDeclaration' && node.source.value === 'antd') {
            if (node.specifiers.findIndex((node) => node.local.name === 'Form') === -1) {
              const formImportSpecifier = t.importSpecifier(
                t.identifier('Form'),
                t.identifier('Form')
              );
              node.specifiers.push(formImportSpecifier);
            }
          }
        });
      } else if (path.node.source.value === '@ant-design/compatible/assets/index.css') {
        path.remove();
      }
    },

    // 不在 props 中引入 getFieldDecorator
    FunctionDeclaration(path1) {
      path1.traverse({
        VariableDeclaration(path2) {
          path2.traverse({
            Identifier(path) {
              if (path.node.name === 'getFieldDecorator') {
                if (path.container.type === 'ObjectProperty') {
                  const parent = path.findParent((path) => path.node.type === 'ObjectPattern');
                  if (!parent) return;

                  const index = parent.node.properties.findIndex(
                    (node) => node.key.name === 'getFieldDecorator'
                  );

                  if (index > -1) {
                    parent.node.properties.splice(index, 1);
                  }
                }
              }
            },
          });
        },
      });
    },

    // 把 export default Form.create()(Component) 转成 export default Component
    ExportDefaultDeclaration(path) {
      if (path.node.declaration.type === 'CallExpression') {
        path.node.declaration = path.node.declaration.arguments[0];
      }
    },
  };
}

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program(path) {
        const shouldRun =
          path.node.body.findIndex((node) => {
            const isImport = node.type === 'ImportDeclaration';
            const isAntdC = node.source.value === '@ant-design/compatible';

            return isImport && isAntdC;
          }) > -1;

        if (shouldRun) {
          path.traverse(makeVisitor(t));
        }
      },
    },
  };
};
