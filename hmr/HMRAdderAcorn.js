import { Parser, tokenizer } from 'acorn';
import HMRAdderBase from './HMRAdderBase';
var _hotListenerInfo;
let first = true;
class HMRAdderAcorn extends HMRAdderBase {
    transform(code, path) {
        if (!first) return code;
        first = false;
        code = code.replace(/=>/g, '=> ').replace(/Blue\.r\(([A-Z]\w*)[ \n]*\)/g, 'Blue.r($1, null)');
        const originalCode = code;
        const tokens = tokenizer(originalCode, {
            ecmaVersion: 'latest',
            sourceType: "module"
        });
        //let str = ''
        for (const token of tokens){
            if (token.type.label === 'function') console.log('hbj');
        }
        //console.log(str);
        return code;
    }
    transform_o(code, path) {
        code = code.replace(/=>/g, '=> ').replace(/Blue\.r\(([A-Z]\w*)[ \n]*\)/g, 'Blue.r($1, null)');
        const program = this.Parser.parse(code, {
            ecmaVersion: 'latest',
            sourceType: "module"
        });
        const originalCode = code;
        const { imports , exportedFuncs  } = this.analyzeTree(program.body, path);
        const insertRecord = this.getInsertRecord();
        for (const funcNode of exportedFuncs){
            const { start , end  } = funcNode;
            const funcCode = this.getCodeFragment([
                start,
                end
            ], code, insertRecord);
            const jsxComponents = this.getDependentJSXComponents(funcCode, imports);
            //const refObjName = 
            code = this.replaceCode(this.processFunctionCode(jsxComponents, funcNode, funcCode, imports, originalCode), [
                start,
                end
            ], code, insertRecord);
        }
        return code;
    }
    /////////////////
    addHotListenerInfo(hotListenerInfo, jsxComponent, refObjectName, updateInitializeLines) {
        (_hotListenerInfo = hotListenerInfo)[jsxComponent.info.src] ?? (_hotListenerInfo[jsxComponent.info.src] = {
            varMapCode: '',
            listenCode: '',
            usedCompNames: []
        });
        const o = hotListenerInfo[jsxComponent.info.src];
        if (!o.usedCompNames.includes(jsxComponent.name)) {
            o.varMapCode += `${jsxComponent.info.imports[jsxComponent.name]}:${jsxComponent.name},`;
            o.usedCompNames.push(jsxComponent.name);
        //o.overrideImportCode += `${jsxComponent.name}_b = ${jsxComponent.name};`
        }
        o.listenCode += `
if(${refObjectName}.${jsxComponent.refName}.${this.UPDATE_LISTENER_FUNC_NAME}){
  ${refObjectName}.${jsxComponent.refName}=${refObjectName}.${jsxComponent.refName}.${this.UPDATE_LISTENER_FUNC_NAME}(${jsxComponent.name}, ${jsxComponent.attrObjCode ? jsxComponent.attrObjCode : 'null'});
  ${updateInitializeLines}
}else{
  import.meta.hot.decline()
}
`;
    }
    processFunctionCode(jsxComponents, funcNode, funcCode, imports, wholeCode) {
        const insertRecord = this.getInsertRecord();
        const originalFuncCode = funcCode;
        const bodyNode = funcNode.body;
        const relBodyStartIndex = bodyNode.start - funcNode.start, relBodyEndIndex = bodyNode.end - funcNode.start;
        const bodyNodes = bodyNode.body;
        const paramNode = funcNode.params[0];
        let insertCodeToFirstLine = '';
        if (paramNode) {
            const pStart = paramNode.start - funcNode.start;
            const pEnd = paramNode.end - funcNode.start;
            const paramCode = funcCode.substring(pStart, pEnd);
            funcCode = this.replaceCode(this.PARAM_ALTER_NAME, [
                pStart,
                pEnd
            ], funcCode, insertRecord);
            insertCodeToFirstLine = `\nlet ${paramCode}=${this.PARAM_ALTER_NAME};`;
        }
        let selfVarName = 'self';
        const execLater = [];
        const hotListenerInfo = {};
        let refObjectName;
        let c = 0;
        const retNode = bodyNodes?.find((v)=>v.type === 'ReturnStatement'
        );
        const isDirectJSXArrowReturnFunc = bodyNode.type === 'CallExpression' && bodyNode.callee?.object?.name === 'Blue';
        if (retNode) {
            if (retNode.argument.type === 'Identifier') selfVarName = retNode.argument.name;
        } else if (!isDirectJSXArrowReturnFunc) {
            return originalFuncCode;
        }
        const isDirectJSXReturnFunc = retNode && retNode.argument.type === 'CallExpression' && retNode.argument.callee?.object?.name === 'Blue';
        const insertHotListenerPlace = isDirectJSXArrowReturnFunc ? relBodyEndIndex : retNode.start - funcNode.start;
        for (const v1 of funcCode.matchAll(/Blue\.r\(/g)){
            let blueCallNode = this.Parser.parseExpressionAt(funcCode, v1.index, {
                ecmaVersion: 'latest',
                sourceType: "module"
            });
            if (blueCallNode.type === 'SequenceExpression') {
                blueCallNode = blueCallNode.expressions.find((v)=>v.start === blueCallNode.start
                );
            }
            if (blueCallNode?.type === 'CallExpression' && blueCallNode?.arguments[1]?.type === 'ObjectExpression') {
                const name = blueCallNode.arguments[1].properties.find((v)=>v.key?.name === 'ref'
                )?.value.elements[0].name;
                if (name) {
                    refObjectName = name;
                    break;
                }
            }
        }
        for (const jsxComponent of jsxComponents){
            const attrNode = jsxComponent.node.arguments[1] // null | { attr: value }
            ;
            if (attrNode.type === 'ObjectExpression') {
                jsxComponent.attrObjCode = originalFuncCode.substring(attrNode.start, attrNode.end);
                const refAttrNode = attrNode.properties.find((v)=>v.key.name === 'ref'
                ) // ref: [refs, 'elem']
                ;
                //const classAttrNode = attrNode.properties.find((v: Node) => v.key.name === 'class')  // class: [refs, 'elem']
                if (refAttrNode) {
                    let updateInitializeLines = '';
                    const refAttrContentNode = refAttrNode.value.elements;
                    jsxComponent.refName = refAttrContentNode[1].value;
                    jsxComponent.hasRef = true;
                    if (!isDirectJSXArrowReturnFunc) {
                        // take any statements which uses updated components
                        for (const { type , start , end  } of bodyNodes){
                            const relStart = start - funcNode.start, relEnd = end - funcNode.start;
                            const statement = originalFuncCode.substring(relStart, relEnd);
                            if (type === 'ExpressionStatement' && originalFuncCode.indexOf(jsxComponent.refName, relStart) === relStart) {
                                updateInitializeLines += `${refObjectName}.${statement};`;
                            }
                        }
                        //find ref object name (refs)
                        for (const v of originalFuncCode.matchAll(new RegExp(jsxComponent.refName, 'g'))){
                            try {
                                const varNode = this.Parser.parseExpressionAt(originalFuncCode, v.index, {
                                    ecmaVersion: 'latest',
                                    sourceType: "module"
                                });
                                if (varNode.type === 'AssignmentExpression' || varNode.type === 'CallExpression') {
                                    funcCode = this.insertCode(`${refObjectName}.`, v.index, funcCode, insertRecord);
                                }
                            } catch (e) {}
                        }
                    }
                    this.addHotListenerInfo(hotListenerInfo, jsxComponent, refObjectName, updateInitializeLines);
                } else {
                    //Blue.r(A, {noAttr: 'aaa'})
                    jsxComponent.refName = `bjsxc_${c++}`;
                    jsxComponent.hasRef = false;
                    execLater.push(()=>{
                        funcCode = this.insertCode(`ref:[${refObjectName},'${jsxComponent.refName}'],`, attrNode.start + 1, funcCode, insertRecord);
                        this.addHotListenerInfo(hotListenerInfo, jsxComponent, refObjectName, '');
                    });
                }
            } else {
                // Blue.r('Comp', null)
                jsxComponent.refName = `bjsxc_${c++}`;
                execLater.push(()=>{
                    funcCode = this.replaceCode(`{ref:[${refObjectName},'${jsxComponent.refName}']}`, [
                        attrNode.start,
                        attrNode.start + 4
                    ], funcCode, insertRecord);
                    this.addHotListenerInfo(hotListenerInfo, jsxComponent, refObjectName, '');
                });
            }
        }
        if (!refObjectName) {
            refObjectName = 'refs';
            insertCodeToFirstLine += `const ${refObjectName}={};`;
        }
        for(let i = execLater.length; i--;){
            execLater[i]();
        }
        let insertCodeBeforeHotListener = '';
        if (isDirectJSXArrowReturnFunc) {
            insertCodeToFirstLine = `{${insertCodeToFirstLine}const ${selfVarName}=`;
            funcCode = this.insertCode(`\nreturn ${selfVarName};}`, bodyNode.end, funcCode, insertRecord, true);
        } else if (isDirectJSXReturnFunc) {
            const selfCode = this.getCodeFragment([
                retNode.start - funcNode.start + 6,
                retNode.end - funcNode.start
            ], funcCode, insertRecord);
            insertCodeBeforeHotListener = `const ${selfVarName}=${selfCode}`;
            funcCode = this.replaceCode(`\nreturn ${selfVarName};`, [
                retNode.start - funcNode.start,
                retNode.start - funcNode.start + selfCode.length + 7
            ], funcCode, insertRecord);
        }
        funcCode = this.insertCode(insertCodeToFirstLine, isDirectJSXArrowReturnFunc ? relBodyStartIndex : relBodyStartIndex + 1, funcCode, insertRecord);
        let hotListenerCode = '';
        if (paramNode) {
            hotListenerCode = `const newElem=Blue.r(Comp, attr, ${this.PARAM_ALTER_NAME}.children?.map(elem=>elem.__newElem||elem))`;
        } else {
            hotListenerCode = `const newElem=Blue.r(Comp, attr)`;
        }
        hotListenerCode = `\n${selfVarName}.${this.UPDATE_LISTENER_FUNC_NAME} = (Comp, attr) =>{
    ${hotListenerCode}
    ${selfVarName}.__newElem=newElem
    ${selfVarName}.before(newElem);
    ${selfVarName}.remove();
    return newElem
  }\n`;
        //let listenerAdded = false
        for(const src in hotListenerInfo){
            //listenerAdded || (listenerAdded = true)
            const listenerData = hotListenerInfo[src];
            hotListenerCode += `import.meta.hot.accept('${src}',({${listenerData.varMapCode}})=>{${listenerData.listenCode}});`;
        }
        //if (listenerAdded) {
        hotListenerCode = `
${insertCodeBeforeHotListener}
if(import.meta.hot){
  ${hotListenerCode}
}else{
  console.warn('import.meta.hot does not exist')
}\n`;
        //}
        funcCode = this.insertCode(hotListenerCode, insertHotListenerPlace, funcCode, insertRecord);
        return funcCode;
    }
    analyzeTree(body, filepath) {
        const imports = {
            varNames: [],
            info: {}
        };
        const exportedFuncs = [];
        const namesToLookFor = [];
        for(let i = body.length; i--;){
            const bNode = body[i];
            this.filterImports(bNode, imports, filepath);
            this.filterExportedFuncs(bNode, exportedFuncs, namesToLookFor);
        }
        return {
            imports,
            exportedFuncs
        };
    }
    filterImports(node, imports, filepath) {
        if (node.type !== 'ImportDeclaration' || node.source.value.indexOf('.') !== 0) return null;
        const resolvedImportPath = this.resolveFilePath(node.source.value, filepath);
        if (!resolvedImportPath) return null;
        const info = {
            src: resolvedImportPath,
            imports: {}
        };
        imports.info[node.source.value] = info;
        for (const specifier of node.specifiers){
            let name = specifier.local.name;
            if (specifier.type === 'ImportDefaultSpecifier') {
                //info.imports.default = name
                info.imports[name] = 'default';
            } else if (specifier.type === 'ImportSpecifier') {
                //info.imports[specifier.imported.name] = name
                info.imports[name] = specifier.imported.name;
            }
            imports.varNames.push({
                name,
                info
            });
        }
    }
    filterFuncs(node, funcNodes, namesToLookFor, checkName = false) {
        const { type  } = node;
        if (!checkName && type === 'FunctionDeclaration' || type === 'ArrowFunctionExpression') {
            funcNodes.push(node);
        } else if (type === 'VariableDeclaration') {
            if (checkName) {
                for (const declaration of node.declarations){
                    if (namesToLookFor.includes(declaration.id.name)) {
                        this.filterFuncs(declaration.init, funcNodes, namesToLookFor);
                    }
                }
            } else {
                for (const declaration of node.declarations)this.filterFuncs(declaration.init, funcNodes, namesToLookFor);
            }
        } else if (type === 'Identifier') namesToLookFor.push(node.name);
    }
    filterExportedFuncs(node, funcNodes, namesToLookFor) {
        if (node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration') {
            const { declaration , specifiers  } = node;
            if (declaration) {
                this.filterFuncs(declaration, funcNodes, namesToLookFor);
            } else {
                specifiers.forEach((specifier)=>{
                    this.filterFuncs(specifier.local, funcNodes, namesToLookFor);
                });
            }
        } else if (namesToLookFor.length) {
            this.filterFuncs(node, funcNodes, namesToLookFor, true);
        }
    }
    // getImports(body: Node[], filepath: string) {
    //   const imports: ImportsData = {
    //     varNames: [],
    //     info: {}
    //   }
    //   for (const node of body) {
    //     if (node.type !== 'ImportDeclaration' || node.source.value.indexOf('.') !== 0) continue
    //     const resolvedImportPath = this.resolveFilePath(node.source.value, filepath)
    //     if (!resolvedImportPath) continue
    //     const info: ImportInfo = {
    //       src: resolvedImportPath,
    //       imports: {}
    //     }
    //     imports.info[node.source.value] = info
    //     for (const specifier of node.specifiers) {
    //       let name: string = specifier.local.name
    //       if (specifier.type === 'ImportDefaultSpecifier') {
    //         //info.imports.default = name
    //         info.imports[name] = 'default'
    //       } else if (specifier.type === 'ImportSpecifier') {
    //         //info.imports[specifier.imported.name] = name
    //         info.imports[name] = specifier.imported.name
    //       }
    //       imports.varNames.push({ name, info })
    //     }
    //   }
    //   return imports
    // }
    // getExports(body: Node[]): Node[] {
    //   return body.filter(v => v.type === 'ExportDefaultDeclaration' || v.type === 'ExportNamedDeclaration')
    // }
    // getExportedFunctions(body: Node[]): Node[] {
    //   const funcNodes: Node[] = []
    //   const namesToLookFor: string[] = []
    //   const filterFuncs = (node: Node, checkName = false) => {
    //     const { type } = node
    //     if (!checkName && type === 'FunctionDeclaration' || type === 'ArrowFunctionExpression') {
    //       funcNodes.push(node)
    //     } else if (type === 'VariableDeclaration') {
    //       if (checkName) {
    //         for (const declaration of node.declarations) {
    //           if (namesToLookFor.includes(declaration.id.name)) {
    //             filterFuncs(declaration.init)
    //           }
    //         }
    //       } else {
    //         for (const declaration of node.declarations) filterFuncs(declaration.init)
    //       }
    //     } else if (type === 'Identifier') namesToLookFor.push(node.name)
    //   }
    //   for (let i = body.length; i--;) {
    //     const bNode = body[i]
    //     if (bNode.type === 'ExportDefaultDeclaration' || bNode.type === 'ExportNamedDeclaration') {
    //       const { declaration, specifiers } = bNode
    //       if (declaration) {
    //         filterFuncs(declaration)
    //       } else {
    //         specifiers.forEach(specifier => {
    //           filterFuncs(specifier.local)
    //         })
    //       }
    //     } else if (namesToLookFor.length) {
    //       filterFuncs(bNode, true)
    //     }
    //   }
    //   return funcNodes
    // }
    /** returns list of  */ getDependentJSXComponents(code, imports) {
        const jsxInfo = [];
        for (const v2 of code.matchAll(/Blue\.r\(([A-Z][A-z_]*)/g)){
            const compName = v2[1];
            let blueCallNode = this.Parser.parseExpressionAt(code, v2.index, {
                ecmaVersion: 'latest',
                sourceType: "module"
            });
            if (blueCallNode.type === 'SequenceExpression') {
                blueCallNode = blueCallNode.expressions.find((v)=>v.start === blueCallNode.start
                );
            }
            for (const i of imports.varNames){
                if (i.name === compName) {
                    const importedJSXData = {
                        name: compName,
                        info: i.info,
                        node: blueCallNode,
                        index: v2.index
                    };
                    jsxInfo.push(importedJSXData);
                }
            }
        }
        return jsxInfo;
    }
    getVars(searchVar, scopeCode) {
        return [];
    }
    fromDirectReturnToVarReturn(code) {
        return '';
    }
    getReturnValue(funcNode) {
        return '';
    }
    constructor({ resolveFilePath  }){
        super();
        this.resolveFilePath = resolveFilePath;
        this.Parser = Parser;
    }
}
export { HMRAdderAcorn as default };