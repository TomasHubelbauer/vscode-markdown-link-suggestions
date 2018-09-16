import {
  createClassDeclaration, createToken, SyntaxKind, createPrinter, EmitHint, createSourceFile, ScriptTarget, ScriptKind, createProperty, createArrayLiteral,
  createLiteral, createKeywordTypeNode, createTextChangeRange, createTextSpan, addSyntheticLeadingComment, createBlock, createIdentifier, createSwitch, createCaseBlock,
  createCaseClause, createFor, createParameter, createBinary, createPostfix, createVariableDeclaration, createVariableStatement, createElementAccess,
  createDefaultClause, createBreak, createCall, createStatement, createThis, createNodeArray, createImportClause, createImportDeclaration, createEmptyStatement,
  createAssignment, createUnionTypeNode, createLiteralTypeNode, createIf, createContinue, createConstructor, createArrayTypeNode, createThrow, createNew, createDelete,
  createTypeReferenceNode,
} from 'typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { pathExistsSync, ensureDirSync } from 'fs-extra';

const states = ['path', 'pathTransition', 'pathPriorHash', 'pathPriorQuery', 'pathPriorQueryTransition', 'pathPriorSlash', 'pathPriorSlashTransition', 'text'];
const nonTriggerCharacter = 'nonTriggerCharacter';
const triggerCharacters = [
  { value: '[', name: 'openingSquareBracket' },
  { value: ']', name: 'closingSquareBracket' },
  { value: '(', name: 'openingRoundBracket' },
  { value: '/', name: 'forwardSlash' },
  { value: '\\', name: 'backwardSlash' },
  { value: ' ', name: 'space' },
  { value: '?', name: 'questionMark' },
  { value: '#', name: 'numberSign' },
  { value: ')', name: 'closingRoundBracket' },
];

let sourceFile = createSourceFile('LinkContextRecognizer.g.ts', '', ScriptTarget.Latest, undefined, ScriptKind.TS);
sourceFile.statements = createNodeArray(
  [
    createEmptyStatement(),
    ...combine()
      .map(combination => createImportDeclaration(undefined, undefined, createImportClause(createIdentifier(combination.handlerTitleCase), undefined), createLiteral(`./handlers/${combination.handlerTitleCase}${combination.exists ? '' : '.g'}`))),
    createClassDeclaration(
      undefined,
      [
        createToken(SyntaxKind.ExportKeyword),
        createToken(SyntaxKind.DefaultKeyword),
      ],
      'LinkContextRecognizer',
      undefined,
      [],
      [
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
            createToken(SyntaxKind.StaticKeyword),
            createToken(SyntaxKind.ReadonlyKeyword),
          ],
          'TRIGGER_CHARACTERS',
          undefined,
          undefined,
          createArrayLiteral(triggerCharacters.map(triggerCharacter => createLiteral(triggerCharacter.value))),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'cursor',
          undefined,
          createUnionTypeNode(
            [
              createLiteralTypeNode(createLiteral('text')),
              createLiteralTypeNode(createLiteral('transition')),
              createLiteralTypeNode(createLiteral('scheme')),
              createLiteralTypeNode(createLiteral('path')),
              createLiteralTypeNode(createLiteral('query')),
              createLiteralTypeNode(createLiteral('fragment')),
              createKeywordTypeNode(SyntaxKind.UndefinedKeyword)
            ]
          ),
          createIdentifier('undefined'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'text',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.UndefinedKeyword)]),
          createIdentifier('undefined'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'path',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.UndefinedKeyword)]),
          createIdentifier('undefined'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'pathComponents',
          undefined,
          createUnionTypeNode([createArrayTypeNode(createKeywordTypeNode(SyntaxKind.StringKeyword)), createKeywordTypeNode(SyntaxKind.UndefinedKeyword)]),
          createIdentifier('undefined'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'query',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.UndefinedKeyword)]),
          createIdentifier('undefined'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'fragment',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.UndefinedKeyword)]),
          createIdentifier('undefined'),
        ),
        ...combine()
          .map(combination => createProperty(
            undefined,
            [createToken(SyntaxKind.PublicKeyword), createToken(SyntaxKind.ReadonlyKeyword)],
            combination.handlerCamelCase,
            undefined,
            createTypeReferenceNode(combination.handlerTitleCase, []),
            createNew(createIdentifier(combination.handlerTitleCase), undefined, [])
          )),
        createConstructor(
          undefined,
          undefined,
          [
            createParameter(undefined, undefined, undefined, 'line', undefined, createKeywordTypeNode(SyntaxKind.StringKeyword)),
            createParameter(undefined, undefined, undefined, 'index', createToken(SyntaxKind.QuestionToken), createKeywordTypeNode(SyntaxKind.NumberKeyword)),
          ],
          createBlock(
            [
              createStatement(createAssignment(createIdentifier('index'), createBinary(createIdentifier('index'), SyntaxKind.BarBarToken, createIdentifier('line.length - 1')))),
              createVariableStatement(
                undefined,
                [
                  createVariableDeclaration(
                    'state',
                    createUnionTypeNode(states.map(state => createLiteralTypeNode(createLiteral(state)))),
                    createLiteral('path'),
                  ),
                ]
              ),
              createFor(
                createIdentifier('index'),
                createBinary(createIdentifier('index'), SyntaxKind.GreaterThanEqualsToken, createLiteral(0)),
                createPostfix(createIdentifier('index'), SyntaxKind.MinusMinusToken),
                createBlock(
                  [
                    createVariableStatement(
                      undefined,
                      [
                        createVariableDeclaration(
                          'character',
                          undefined,
                          createElementAccess(
                            createIdentifier('line'),
                            createIdentifier('index'),
                          ),
                        ),
                        createVariableDeclaration(
                          'stateTransition',
                          createUnionTypeNode(
                            [
                              ...states.map(state => createLiteralTypeNode(createLiteral(state))),
                              createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
                              createKeywordTypeNode(SyntaxKind.NullKeyword),
                            ]
                          ),
                          createIdentifier('undefined'),
                        ),
                      ]
                    ),
                    createSwitch(
                      createIdentifier('character'),
                      createCaseBlock(
                        [
                          ...triggerCharacters.map(triggerCharacter => createCaseClause(
                            createLiteral(triggerCharacter.value),
                            [
                              createSwitch(
                                createIdentifier('state'),
                                createCaseBlock(
                                  [
                                    ...states.map(state => createCaseClause(
                                      createLiteral(state),
                                      [
                                        createStatement(
                                          createAssignment(
                                            createIdentifier('stateTransition'),
                                            createCall(createIdentifier(`this.${triggerCharacter.name}${capitalize(state)}.handle`), undefined, [createThis()]),
                                          )
                                        ),
                                        createBreak(),
                                      ]
                                    )),
                                    createDefaultClause([createThrow(createNew(createIdentifier('Error'), undefined, [createLiteral('Unknown state.')]))])
                                  ]
                                ),
                              ),
                              createBreak(),
                            ],
                          )),
                          createDefaultClause(
                            [
                              createSwitch(
                                createIdentifier('state'),
                                createCaseBlock(
                                  [
                                    ...states.map(state => createCaseClause(
                                      createLiteral(state),
                                      [
                                        createStatement(
                                          createAssignment(
                                            createIdentifier('stateTransition'),
                                            createCall(createIdentifier(`this.${nonTriggerCharacter}${capitalize(state)}.handle`), undefined, [createThis(), createIdentifier('character')]),
                                          )
                                        ),
                                        createBreak(),
                                      ]
                                    )),
                                    createDefaultClause([createThrow(createNew(createIdentifier('Error'), undefined, [createLiteral('Unknown state.')]))])
                                  ]
                                )
                              )
                            ],
                          )
                        ],
                      ),
                    ),
                    createIf(createBinary(createIdentifier('stateTransition'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('null')), createBreak()),
                    createIf(createBinary(createIdentifier('stateTransition'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createContinue()),
                    createStatement(createAssignment(createIdentifier('state'), createIdentifier('stateTransition')))
                  ],
                  true,
                )
              ),
              createIf(createBinary(createIdentifier('this.cursor'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.cursor')))),
              createIf(createBinary(createIdentifier('this.text'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.text')))),
              createIf(createBinary(createIdentifier('this.path'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.path')))),
              createIf(createBinary(createIdentifier('this.pathComponents'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.pathComponents')))),
              createIf(createBinary(createIdentifier('this.query'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.query')))),
              createIf(createBinary(createIdentifier('this.fragment'), SyntaxKind.EqualsEqualsEqualsToken, createIdentifier('undefined')), createStatement(createDelete(createIdentifier('this.fragment')))),
              ...combine().map(combination => createStatement(createDelete(createIdentifier(`(this as any).${combination.handlerCamelCase}`)))),
            ],
            true,
          )
        ),
      ],
    )
  ],
  false,
);

addSyntheticLeadingComment(sourceFile.statements[0], SyntaxKind.MultiLineCommentTrivia, `
* This is a generated file. Any manual changes will be lost the next time is is regenerated using \`npm run generate\`!
`, true);

// TODO: Figure out how to write this using TypeScript
const sourceCode = createPrinter().printNode(EmitHint.Unspecified, sourceFile, sourceFile);
sourceFile = sourceFile.update(sourceCode, createTextChangeRange(createTextSpan(sourceFile.getStart(), sourceFile.getEnd()), sourceCode.length));

writeFileSync(join('src', sourceFile.fileName), sourceFile.getFullText(), 'utf8');
ensureDirSync(join('src', 'handlers'));
for (const combination of combine()) {
  // Skip .g.ts where there is .ts
  if (combination.exists) {
    continue;
  }

  writeFileSync(join('src', 'handlers', combination.handlerTitleCase + '.g.ts'), `
// This is a generated file, to make it yours, change the extension from .g.ts to .ts (VS Code will rename the \`import\` in \`LinkContextRecognizer\` for you)
import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class ${combination.handlerTitleCase} {
  public handle(_recognizer: LinkContextRecognizer${combination.trigger ? '' : ', _character: string'}): undefined | ${states.map(state => `'${state}'`).join(' | ')} | null {
    throw new Error("The handler '${combination.handlerTitleCase}' has not been implemented.");
  }
}
`.replace(/^\s/, ''), 'utf8');
}

function combine() {
  return triggerCharacters
    .reduce((combinations, triggerCharacter) => [
      ...combinations,
      ...states.map(state => {
        const handlerCamelCase = `${triggerCharacter.name}${capitalize(state)}`;
        const handlerTitleCase = `${capitalize(triggerCharacter.name)}${capitalize(state)}`;
        const exists = pathExistsSync(join('src', 'handlers', handlerCamelCase + '.ts'));
        return { handlerCamelCase, handlerTitleCase, trigger: true, exists };
      })
    ], [] as { handlerCamelCase: string; handlerTitleCase: string; trigger: boolean; exists: boolean; }[])
    .concat(states.map(state => {
      const handlerCamelCase = `${nonTriggerCharacter}${capitalize(state)}`;
      const handlerTitleCase = `${capitalize(nonTriggerCharacter)}${capitalize(state)}`;
      const exists = pathExistsSync(join('src', 'handlers', handlerCamelCase + '.ts'));
      return { handlerCamelCase, handlerTitleCase, trigger: false, exists };
    }));
}

function capitalize(state: string) {
  return state[0].toUpperCase() + state.slice(1);
}
