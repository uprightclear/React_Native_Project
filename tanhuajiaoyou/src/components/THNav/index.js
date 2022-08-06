import React, { Component } from 'react';
import { View, Text, ImageBackground, StatusBar, TouchableOpacity } from 'react-native';
import { pxToDp } from "../../utils/stylesKits";
import IconFont from "../IconFont";
import { NavigationContext } from "@react-navigation/native";
class Index extends Component {
  static contextType = NavigationContext;
  render() {
    // goBack
    return (
      <View>
        <StatusBar
          backgroundColor="transparent"
          translucent={true}
        />
        <ImageBackground source={require("../../res/headbg.png")}
          style={{
            height: pxToDp(60), paddingTop: pxToDp(12), flexDirection: 'row',
            paddingLeft: pxToDp(10), paddingRight: pxToDp(10),
            alignItems: "center", justifyContent: 'space-between'
          }}
        >
          <TouchableOpacity
            onPress={this.context.goBack}
            style={{ width: pxToDp(80), flexDirection: "row", alignItems: 'center' }}>
            <IconFont style={{ color: "#fff" }} name="iconfanhui" />
            <Text style={{ color: "#fff" }} >返回</Text>
          </TouchableOpacity>

          <Text style={{ color: "#fff", fontSize: pxToDp(20), fontWeight: "bold" }}>{this.props.title}</Text>

          <Text
            onPress={this.props.onRightPress || function () { }}
            style={{ width: pxToDp(80), color: "#fff", textAlign: "right" }}>{this.props.rightText}</Text>

        </ImageBackground>
      </View>
    );
  }
}
export default Index;