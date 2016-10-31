///<reference path="./draft-js.d.ts" />

declare namespace ReactRTE {
    class EditorValue {
        getEditorState(): Draft.Model.ImmutableData.EditorState;
        setEditorState(state: Draft.Model.ImmutableData.EditorState): void;
        toString(fmt: string): string;
        static createEmpty(): EditorValue;
        static createFromState(state: Draft.Model.ImmutableData.EditorState): EditorValue;
    }
}

