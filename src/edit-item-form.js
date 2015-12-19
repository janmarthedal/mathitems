import React from 'react';
import EditItemBox from './edit-item-box';
import RenderItemBox from './render-item-box';
import {textToItemData} from './item-data';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }
    setBody(value) {
        this.refs.editor.setValue(value);
    }
    onChange(text) {
        var data = textToItemData(text);
        this.refs.viewer.setItemData(data);
    }
    render() {
        return (
            <form className="pure-form" method="post">
                <EditItemBox ref='editor' onChange={this.onChange} />
                <RenderItemBox ref='viewer' />
                <button type="submit" className="pure-button pure-button-primary">Create</button>
            </form>
        );
    }
}
