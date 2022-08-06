import React, { Component } from 'react';
import { View, Text, Image, StatusBar, StyleSheet,AsyncStorage } from 'react-native';
import { pxToDp } from "../../../utils/stylesKits";
import { Input } from 'react-native-elements';
import validator from "../../../utils/validator";
import request from "../../../utils/request";
import { ACCOUNT_LOGIN } from "../../../utils/pathMap";
import THButton from "../../../components/THButton";
import { CodeField, Cursor } from 'react-native-confirmation-code-field';
import Toast from "../../../utils/Toast";
import {ACCOUNT_VALIDATEVCODE  } from "../../../utils/pathMap";
import {inject,observer  } from "mobx-react";
@inject("RootStore")
@observer
class Index extends Component {
  state = {
    // 手机号码 
    phoneNumber: "18665711978",
    // 手机号码是否合法
    phoneValid: true,
    // 是否显示登录页面 
    showLogin: true,
    // 验证码输入框的值
    vcodeTxt: "",
    // 倒计时按钮的文本
    btnText: "重新获取",
    // 是否在倒计时中
    isCountDowning:false
  }

  // 登录框手机号码输入 
  phoneNumberChangeText = (phoneNumber) => {
    this.setState({ phoneNumber });
    console.log(phoneNumber);
  }
  // 手机号码点击 完成
  phoneNumberSubmitEditing = async () => {
    /* 
    1 对手机号码的合法性做校验 -  正则
       1 不通过  提示
    2 将手机号码发送到后台对应接口 -> 获取验证码  axios
      1 发送异步请求的时候 自动的显示等待框
      2 请求回来  等待框  自动隐藏
      3 关键
        1 等待框 ? 
        2 自动 ? -> axios的 拦截器 
    3 将登录页面切换成 填写验证码的界面 
    4 开启定时器
     */
    //  validator.validatePhone
    const { phoneNumber } = this.state;
    const phoneValid = validator.validatePhone(phoneNumber);
    if (!phoneValid) {
      // 没有通过
      this.setState({ phoneValid });
      return;
    }

    const res = await request.post(ACCOUNT_LOGIN, { phone: phoneNumber });
    if (res.code == "10000") {
      // 请求成功
      this.setState({ showLogin: false });
      // 开启定时器
      this.countDown();
    } else {

    }

  }

  // 开启获取验证码的定时器
  countDown = () => {
    console.log("开启倒计时");
    if(this.state.isCountDowning){
      return;
    }
    

    this.setState({ isCountDowning: true });

    let seconds = 5;
    // 重新获取(5s)
    this.setState({ btnText: `重新获取(${seconds}s)` });
    let timeId = setInterval(() => {
      seconds--;
      this.setState({ btnText: `重新获取(${seconds}s)` });
      if (seconds === 0) {
        clearInterval(timeId);
        this.setState({ btnText: "重新获取",isCountDowning:false });
      }
    }, 1000);
  }

  // 验证码输入完毕事件
  onVcodeSubmitEditing=async()=>{
    /* 
    1 对验证码做校验  长度
    2 将手机号码和验证码 一起发送到后台 
    2.5 
      将用户数据存放到 mobx中
    3 返回值 有 isNew  
    4 新用户 -> 完善个人信息的页面 
    5 老用户 -> 交友 - 首页
     */

     const { vcodeTxt,phoneNumber}=this.state;
     if(vcodeTxt.length!=6){
      Toast.message("验证码不正确",2000,"center");
       return;
     }

     const res=await request.post(ACCOUNT_VALIDATEVCODE,{
       phone:phoneNumber,
       vcode:vcodeTxt
     });
     if(res.code!="10000"){
      console.log(res);
       return;
     }
     
    //  存储用户数据到 mobx中
    this.props.RootStore.setUserInfo(phoneNumber,res.data.token,res.data.id);
    //  存储用户数据到 本地缓存中  永久
    AsyncStorage.setItem("userinfo",JSON.stringify({
      mobile:phoneNumber,
      token:res.data.token,
      userId:res.data.id
    }))
     if(res.data.isNew){
      //  新用户 UserInfo
      this.props.navigation.navigate("UserInfo");
 
     }else{
      //  老用户
      this.props.navigation.reset({
        routes:[{name:"Tabbar"}]
      })
     }
  }

  // 渲染登录页面
  renderLogin = () => {
    const { phoneNumber, phoneValid } = this.state;
    return <View>
      {/* 标题 */}
      <View><Text style={{ fontSize: pxToDp(25), color: "#888", fontWeight: "bold" }}>手机号登录注册</Text></View>
      {/* 输入框 */}
      <View style={{ marginTop: pxToDp(25) }}>
        <Input
          placeholder='请输入手机号码'
          maxLength={11}
          keyboardType="phone-pad"
          value={phoneNumber}
          inputStyle={{ color: "#333" }}
          onChangeText={this.phoneNumberChangeText}
          errorMessage={phoneValid ? "" : "手机号码格式不正确"}
          onSubmitEditing={this.phoneNumberSubmitEditing}
          leftIcon={{ type: 'font-awesome', name: 'phone', color: "#ccc", size: pxToDp(20) }}
        />
      </View>
      {/* 渐变按钮  */}
      <View>
        <THButton onPress={this.phoneNumberSubmitEditing} style={{ width: "85%", alignSelf: "center", height: pxToDp(40), borderRadius: pxToDp(20) }}>获取验证码</THButton></View>
    </View>
  }
  // 点击重新获取按钮
  repGetVcode=()=>{
    this.countDown();
  }
  // 渲染填写验证码 页面
  renderVcode = () => {
    const { phoneNumber, vcodeTxt, btnText,isCountDowning } = this.state;
    return <View>
      <View><Text style={{ fontSize: pxToDp(25), color: "#888", fontWeight: "bold" }}>输入6位验证码</Text></View>
      <View style={{ marginTop: pxToDp(10) }}><Text style={{ color: "#888" }}>已发到:+86 {phoneNumber}</Text></View>
      <View><CodeField
        value={vcodeTxt}
        onChangeText={this.onVcodeChangeText}
        onSubmitEditing={this.onVcodeSubmitEditing}
        cellCount={6}
        rootStyle={styles.codeFiledRoot}
        keyboardType="number-pad"
        renderCell={({ index, symbol, isFocused }) => (
          <Text key={index} style={[styles.cell, isFocused && styles.focusCell]} >{symbol || (isFocused ? <Cursor /> : null)}</Text>
        )}
      /></View>
      <View style={{ marginTop: pxToDp(10) }}><THButton disabled={isCountDowning} onPress={this.repGetVcode} style={{ width: "85%", alignSelf: "center", height: pxToDp(40), borderRadius: pxToDp(20) }}>{btnText}</THButton></View>
    </View>
  }
  // 验证码输入框的值改变事件
  onVcodeChangeText = (vcodeTxt) => {
    this.setState({ vcodeTxt });
  }
  render() {
    const { phoneNumber, phoneValid, showLogin } = this.state;
    return (
      <View>
        {/* 0.0  状态栏 开始 */}
        <StatusBar backgroundColor="transparent" translucent={true} />
        {/* 0.0  状态栏 结束 */}
        {/* 1.0 背景图片 开始 */}
        {/* 200 单位 dp 单位px -> dp单位? */}
        <Image style={{ width: "100%", height: pxToDp(220) }} source={require("../../../res/profileBackground.jpg")} />
        {/* 1.0 背景图片 结束*/}

        {/* 2.0 内容 开始 */}
        <View style={{ padding: pxToDp(20) }}>
          {/* 2.1 登录 开始 */}
          {showLogin ? this.renderLogin() : this.renderVcode()}

          {/* 2.1 登录 结束 */}
        </View>
        {/* 2.0 内容 结束 */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  title: { textAlign: 'center', fontSize: 30 },
  codeFiledRoot: { marginTop: 20 },
  cell: {
    width: 40,
    height: 40,
    lineHeight: 38,
    fontSize: 24,
    borderBottomWidth: 2,
    borderColor: '#00000030',
    textAlign: 'center',
    color: "#7d53ea"
  },
  focusCell: {
    borderColor: '#7d53ea'
  },
});
export default Index;