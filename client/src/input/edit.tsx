/// <reference path="../../typings/extern.d.ts"/>

import * as React from 'react';
import { render } from 'react-dom';
import {Editor, EditorState} from 'draft-js';

export class EditState {
    editorState: Draft.Model.ImmutableData.EditorState;
}
export class EditProps {
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
  render(): UI.Element {
    return <Editor editorState={this.state.editorState} onChange={this.onChange} />;
  }
}

