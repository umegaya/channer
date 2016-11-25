///<reference path="./draft-js.d.ts" />
///<reference path="../UI.d.ts" />

declare namespace ReactRTE {
    class EditorValue {
        getEditorState(): Draft.Model.ImmutableData.EditorState;
        setEditorState(state: Draft.Model.ImmutableData.EditorState): void;
        toString(fmt: string): string;
    }
    interface Editor extends UI.Component {
        EditorValue : {
            createEmpty(): EditorValue;
            createFromState(state: Draft.Model.ImmutableData.EditorState): EditorValue;
        }
    }
}

