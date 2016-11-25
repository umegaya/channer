/// <reference path="../../../typings/extern.d.ts"/>

import * as React from 'react';
import { render } from 'react-dom';
import {Editor, EditorState} from 'draft-js';
var RichTextEditor : ReactRTE.Editor = window.channer.parts.RichTextEditor;
var toEditorValue = function (editorState: Draft.Model.ImmutableData.EditorState): ReactRTE.EditorValue {
  return RichTextEditor.EditorValue.createFromState(editorState);
}

export class EditState {
    editorState: Draft.Model.ImmutableData.EditorState;
}
export class EditProps {
    onSend: (state: ReactRTE.EditorValue) => void;
}
export class EditComponent extends React.Component<EditProps, EditState> {
  constructor(props: EditProps) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
  }
  onChange = (editorState: Draft.Model.ImmutableData.EditorState) => {
      this.setState({editorState: editorState});
      //TODO: persistent editorState 
  }
  onSend = (event: any) => {
    this.props.onSend(toEditorValue(this.state.editorState));
  }
  render(): UI.Element {
    return <div className="editbox">
        <img className="plus"/>
        <Editor editorState={this.state.editorState} onChange={this.onChange}/>
        <img className="send" onClick={this.onSend}/>    
    </div>
  }
}

export class RichEditState {
    value: ReactRTE.EditorValue;
}
export class RichEditProps {
    editorState: Draft.Model.ImmutableData.EditorState;
    onSend: (state: ReactRTE.EditorValue) => void;
}
export class RichEditComponent extends React.Component<RichEditProps, RichEditState> {
  constructor(props: RichEditProps) {
    super(props);
    this.state = {value: toEditorValue(props.editorState)};
  }
  onChange = (editorValue: ReactRTE.EditorValue) => {
      this.setState({value: editorValue});
      //TODO: persistent editorState 
  }
  render(): UI.Element {
    return <div className="rich-editbox">
        <RichTextEditor value={this.state.value} onChange={this.onChange}/>
    </div>
  }
}
