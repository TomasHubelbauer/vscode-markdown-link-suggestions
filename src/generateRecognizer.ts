import {
  createClassDeclaration, createToken, SyntaxKind, createPrinter, EmitHint, createSourceFile, ScriptTarget, ScriptKind, createProperty, createArrayLiteral, createLiteral,
  createKeywordTypeNode, createTextChangeRange, createTextSpan, addSyntheticLeadingComment, createBlock,
  createIdentifier, createSwitch, createCaseBlock, createCaseClause, createFor, createParameter, createBinary, createPostfix, createPropertyAccess, createVariableDeclaration,
  createVariableStatement, createElementAccess, createDefaultClause, createBreak, createCall, createStatement, createThis, createNodeArray, createImportClause,
  createImportDeclaration,
  createEmptyStatement,
  createAssignment,
  createUnionTypeNode,
  createLiteralTypeNode,
  createIf,
  createContinue,
  createConstructor,
  createArrayTypeNode,

} from 'typescript';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { pathExistsSync } from 'fs-extra';

const states = ['path', 'pathTransition', 'pathPriorHash', 'pathPriorQuery', 'pathPriorQueryTransition', 'pathPriorSlash', 'pathPriorSlashTransition', 'text'];
//const nonTriggerCharacter = 'nonTriggerCharacter';
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
      .map(combination => createImportDeclaration(
        undefined,
        undefined,
        createImportClause(
          createIdentifier(combination),
          undefined
        ),
        createLiteral(`./handlers/${combination}`),
      )
      ),
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
              createKeywordTypeNode(SyntaxKind.NullKeyword)
            ]
          ),
          createIdentifier('null'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'text',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.NullKeyword)]),
          createIdentifier('null'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'path',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.NullKeyword)]),
          createIdentifier('null'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'pathComponents',
          undefined,
          createUnionTypeNode([createArrayTypeNode(createKeywordTypeNode(SyntaxKind.StringKeyword)), createKeywordTypeNode(SyntaxKind.NullKeyword)]),
          createIdentifier('null'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'query',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.NullKeyword)]),
          createIdentifier('null'),
        ),
        createProperty(
          undefined,
          [
            createToken(SyntaxKind.PublicKeyword),
          ],
          'fragment',
          undefined,
          createUnionTypeNode([createKeywordTypeNode(SyntaxKind.StringKeyword), createKeywordTypeNode(SyntaxKind.NullKeyword)]),
          createIdentifier('null'),
        ),
        createConstructor(
          undefined,
          undefined,
          [
            createParameter(
              undefined,
              undefined,
              undefined,
              'line',
              undefined,
              createKeywordTypeNode(SyntaxKind.StringKeyword),
            ),
            createParameter(
              undefined,
              undefined,
              undefined,
              'index',
              undefined,
              createKeywordTypeNode(SyntaxKind.NumberKeyword),
            ),
          ],
          createBlock(
            [
              createVariableStatement(
                [
                  // TODO: Figure out how to get rid of `var`
                  // createToken(SyntaxKind.ConstKeyword),
                ],
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
                createBinary(
                  createIdentifier('index'),
                  SyntaxKind.GreaterThanEqualsToken,
                  createPropertyAccess(
                    createIdentifier('line'),
                    'length',
                  )
                ),
                createPostfix(
                  createIdentifier('index'),
                  SyntaxKind.MinusMinusToken,
                ),
                createBlock(
                  [
                    createVariableStatement(
                      [
                        // TODO: Figure out how to get rid of `var`
                        // createToken(SyntaxKind.ConstKeyword),
                      ],
                      [
                        createVariableDeclaration(
                          'character',
                          undefined,
                          createElementAccess(
                            createIdentifier('line'),
                            0,
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
                              createBlock(
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
                                                createCall(
                                                  createIdentifier(`${triggerCharacter.name}${capitalize(state)}`),
                                                  undefined,
                                                  [
                                                    createThis(),
                                                  ],
                                                ),
                                              )
                                            ),
                                            createBreak(),
                                          ]
                                        )),
                                        createDefaultClause(
                                          [
                                            createBlock(
                                              [

                                              ],
                                              true,
                                            )
                                          ]
                                        )
                                      ]
                                    ),
                                  ),
                                  createBreak(),
                                ],
                                true,
                              )
                            ],
                          )),
                          createDefaultClause(
                            [
                              createBlock(
                                [

                                ],
                                true,
                              )
                            ],
                          )
                        ],
                      ),
                    ),
                    createIf(
                      createBinary(
                        createIdentifier('stateTransition'),
                        SyntaxKind.EqualsEqualsEqualsToken,
                        createIdentifier('null'),
                      ),
                      createBreak(),
                      undefined,
                    ),
                    createIf(
                      createBinary(
                        createIdentifier('stateTransition'),
                        SyntaxKind.EqualsEqualsEqualsToken,
                        createIdentifier('undefined'),
                      ),
                      createContinue(),
                      undefined,
                    ),
                    createStatement(
                      createAssignment(
                        createIdentifier('state'),
                        createIdentifier('stateTransition'),
                      )
                    )
                  ],
                  true,
                )
              ),
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
This is a generated file. Any manual changes will be lost the next time is is regenerated using \`npm run generate\`!
`, true);

// TODO: Figure out how to write this using TypeScript
const sourceCode = createPrinter().printNode(EmitHint.Unspecified, sourceFile, sourceFile);
sourceFile = sourceFile.update(sourceCode, createTextChangeRange(createTextSpan(sourceFile.getStart(), sourceFile.getEnd()), sourceCode.length));

writeFileSync(join('src', sourceFile.fileName), sourceFile.getFullText(), 'utf8');

const gitIgnoreFilePath = join('src', 'handlers', '.gitignore');
if (!pathExistsSync(gitIgnoreFilePath)) {
  writeFileSync(gitIgnoreFilePath, `
# The generator reads this file and will only generate files that are on this list
# Once you implement a handler, comment it out so that the generator leaves it intact
${combine().map(combination => combination + '.ts').join('\n')}
`, 'utf8');
}

const ignoredPatterns = String(readFileSync(gitIgnoreFilePath, 'utf8')).split('\n');
const ignoredCombinations = combine().filter(combination => ignoredPatterns.includes(combination + '.ts'));

// Skip the non-ignored combinations, those have been changed and we don't wont to lose non-generated code
for (const combination of ignoredCombinations) {
  writeFileSync(join('src', 'handlers', combination + '.ts'), `
// This is a generated file, to make it yours, remove it from the .gitignore of this repository
import LinkContextRecognizer from '../LinkContextRecognizer.g';
export default function({}: LinkContextRecognizer): undefined | ${states.map(state => `'${state}'`).join(' | ')} | null {
  throw new Error("The handler '${combination}' has not been implemented.");
}
`, 'utf8');
}

function combine() {
  return triggerCharacters.reduce((combinations, triggerCharacter) => [...combinations, ...states.map(state => `${triggerCharacter.name}${capitalize(state)}`)], [] as string[])
}

function capitalize(state: string) {
  return state[0].toUpperCase() + state.slice(1);
}
