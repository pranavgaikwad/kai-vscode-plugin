
import * as vscode from 'vscode';
import { ChangeType } from '../model/model';
import { ModelService } from '../model/modelService';
import { MTA_HINT } from './markers';

export function initQuickfixSupport(context: vscode.ExtensionContext, modelService: ModelService): void {
    context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('java', new QuickfixProvider(modelService), {
			providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
		}));
}

export class QuickfixProvider implements vscode.CodeActionProvider  {

    constructor(private modelService: ModelService) {
    }

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		return context.diagnostics
			.filter(diagnostic => diagnostic.code.toString().includes(MTA_HINT))
			.map(diagnostic => this.createFix(document, range, diagnostic));
	}

    private createFix(document: vscode.TextDocument, range: vscode.Range, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {       
        const code = diagnostic.code.toString().split("::");
        const configId = code[1].trim();
        const hintId = code[2].trim();
        const hint = this.modelService.findHint(configId, hintId);
        if (!hint || hint.quickfixes.length === 0) return undefined;
        const quickfix = hint.quickfixes[0];
        if (quickfix.quickfixApplied) return undefined;
        const command: vscode.Command = {
            title: `unknown mta quickfix`,
            command: 'rhamt.applyQuickfix',
            arguments: [
                {
                    config: hint.configuration,
                    quickfix,
                    applyQuickfix: (applied: boolean) => {
                        quickfix.quickfixApplied = applied;
                        hint.configuration.markQuickfixApplied(quickfix, applied);
                        hint.complete = applied;
                        hint.configuration.markIssueAsComplete(hint, applied);
                        hint.configuration.onChanged.emit({
                            type: ChangeType.QUICKFIX_APPLIED,
                            name: 'quickfix',
                            value: quickfix.id
                        });
                    }
                }
            ]
        };
        switch (quickfix.type) {
            case 'REPLACE': {
                command.title = `Replace \`${quickfix.searchString}\` with \`${quickfix.replacementString}\``;
                break;
            }
            case 'DELETE_LINE':
                command.title = 'Delete line';
                break;
            case 'INSERT_LINE':
                command.title = `Insert new line: \`${quickfix.newLine}\``;
                break;
            case 'TRANSFORMATION':
                command.title = `Refactor snippet of code`
                break;
            default:
                break;
        }
        const fix = new vscode.CodeAction(command.title, vscode.CodeActionKind.QuickFix);
        fix.command = command;
        fix.diagnostics = [diagnostic];
		fix.isPreferred = true;
		return fix;
	}
}
