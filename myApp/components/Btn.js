import React, { Component } from 'react';
import { View, Text } from 'react-native';
import {inject ,observer } from "mobx-react";
@inject("RootStore")
@observer
class Index extends Component {
  handleChangeName=()=>{
    this.props.RootStore.changeName("八戒");
  }
  render() {
    return (
    <View><Text onPress={this.handleChangeName} >Btn:{this.props.RootStore.name}</Text></View>
    );
  }
}
export default Index;