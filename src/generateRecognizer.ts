import { createClassDeclaration, createToken, SyntaxKind, createPrinter, EmitHint, createSourceFile, ScriptTarget, ScriptKind, createProperty, createArrayLiteral, createLiteral, createMethod, createUnionTypeNode, createKeywordTypeNode, createLiteralTypeNode, createTextChangeRange, createTextSpan, setSyntheticLeadingComments, addSyntheticLeadingComment } from 'typescript';
import { writeFileSync } from 'fs';
import { join } from 'path';

const states = ['path', 'pathTransition', 'pathPriorHash', 'pathPriorQuery', 'pathPriorQueryTransition', 'pathPriorSlash', 'pathPriorSlashTransition', 'text'];
const nonTriggerCharacter = 'nonTriggerCharacter';
const triggerCharacters = [
  { value: '[', name: 'openingSquareBracket' },
  { value: ']', name: 'closingSquareBracket' },
  { value: '(', name: 'closingRoundBracket' },
  { value: '/', name: 'forwardSlash' },
  { value: '\\', name: 'backwardSlash' },
  { value: ' ', name: 'space' },
  { value: '?', name: 'questionMark' },
  { value: '#', name: 'numberSign' },
  { value: ')', name: 'closingRoundBracket' },
];

const node =
  createClassDeclaration(
    undefined,
    [
      createToken(SyntaxKind.ExportKeyword),
      createToken(SyntaxKind.DefaultKeyword),
      createToken(SyntaxKind.AbstractKeyword),
    ],
    'LinkContextRecognizerBase',
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
        createArrayLiteral(
          triggerCharacters.map(triggerCharacter => createLiteral(triggerCharacter.value)),
          false,
        )
      ),
      createProperty(
        undefined,
        [
          createToken(SyntaxKind.ProtectedKeyword),
          createToken(SyntaxKind.ReadonlyKeyword),
        ],
        'state',
        undefined,
        createUnionTypeNode(states.map(state => createLiteralTypeNode(createLiteral(state)))),
        createLiteral(states[0]),
      ),
      ...states
        .reduce((handlers, state) => [
          ...handlers,
          `${nonTriggerCharacter}${state[0].toUpperCase() + state.slice(1)}`,
          ...triggerCharacters.map(triggerCharacter => `${triggerCharacter.name}${state[0].toUpperCase() + state.slice(1)}`)
        ], [] as string[])
        .map(handler =>
          createMethod(
            undefined,
            [
              createToken(SyntaxKind.ProtectedKeyword),
              createToken(SyntaxKind.AbstractKeyword),
            ],
            undefined,
            handler,
            undefined,
            undefined,
            [],
            createUnionTypeNode(
              [
                createKeywordTypeNode(SyntaxKind.VoidKeyword),
                createKeywordTypeNode(SyntaxKind.NullKeyword),
              ]
            ),
            undefined,
          )
        ),
    ]
  );

addSyntheticLeadingComment(node, SyntaxKind.MultiLineCommentTrivia, `
This is a generated file. Any manual changes will be lost the next time is is regenerated using \`npm run generate\`!
`, true);

// TODO: Figure out how to write this using TypeScript
let sourceFile = createSourceFile('LinkContextRecognizerBase.g.ts', '', ScriptTarget.Latest, undefined, ScriptKind.TS);
const sourceCode = createPrinter().printNode(EmitHint.Unspecified, node, sourceFile);
sourceFile = sourceFile.update(sourceCode, createTextChangeRange(createTextSpan(sourceFile.getStart(), sourceFile.getEnd()), sourceCode.length));

writeFileSync(join('src', sourceFile.fileName), sourceFile.getFullText(), 'utf8');
