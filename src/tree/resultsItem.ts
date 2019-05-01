import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { ModelService } from '../model/modelService';

export class ResultsItem extends TreeItem {

    id: string = ModelService.generateUniqueId();
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None;
    iconPath: string | Uri | { light: string | Uri; dark: string | Uri } | undefined;

    constructor() {
        super('Loading results...');
    }

    public refresh(executedTimestamp: string): void {
        this.label = `Analysis Results (${executedTimestamp})`;
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    }
}