import { Component } from "react";
import './CaptchaApp.css';
import GoCaptchaBtn from './components/GoCaptchaBtn'
import { message } from 'antd';
import { myvar } from "../../myvar";
import { forEach, isEmpty, size } from 'lodash-es'
import qs from "qs";

export class CaptchaApp extends Component {
  constructor(props: any) {
    super(props);

    this.state = {
      popoverVisible: true,
      captBase64: '',
      captThumbBase64: '',
      captKey: '',
      captStatus: 'default',
      captExpires: 0,
      captAutoRefreshCount: 0,
    }
  }

  componentDidMount(): void {
    myvar.captchaReset = () => { this.setState({ captStatus: "default" }) }
  }

  componentWillUnmount(): void {
    myvar.captchaReset = () => { }
  }

  render() {
    const state = this.state as any
    return (
      <GoCaptchaBtn
        class="go-captcha-btn"
        value={state.captStatus}
        width="100%"
        height="50px"
        imageBase64={state.captBase64}
        thumbBase64={state.captThumbBase64}
        changeValue={(val: any) => this.setState({ captStatus: val })}
        confirm={this.handleConfirm}
        refresh={this.handleRequestCaptCode}
      />
    );
  }

  // ================= Methods ================
  /**
   * 处理请求验证码
   */
  handleRequestCaptCode = () => {
    this.setState({
      captBase64: '',
      captThumbBase64: '',
      captKey: ''
    })

    fetch("/api/v1/auth/captcha/get").then(ret => {
      ret.json().then(data => {
        if ((data['code'] || 0) === 0) {
          if (isEmpty(data)) {
            return
          }
          myvar.captchaKey = data['captcha_key']
          this.setState({
            captBase64: data['image_base64'] || '',
            captThumbBase64: data['thumb_base64'] || '',
            captKey: data['captcha_key'] || ''
          })
        } else {
          message.warning(`获取人机验证数据失败`)
        }
      }).catch(() => message.warning(`获取人机验证数据失败 1`))
    }).catch(() => message.warning(`获取人机验证数据失败 2`))
  }

  /**
   * 处理验证码校验请求
   */
  handleConfirm = (dots: any) => {
    if (size(dots) <= 0) {
      message.warning(`请进行人机验证再操作`)
      return
    }

    let dotArr: any[] = []
    forEach(dots, (dot: any) => {
      dotArr.push(dot.x, dot.y)
    })

    fetch("/api/v1/auth/captcha/check", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify({
        dots: dotArr.join(','),
        key: (this.state as any).captKey || ''
      })
    }).then(ret => {
      ret.json().then(data => {
        if ((data['code'] || 0) === 0) {
          message.success(`人机验证成功`)
          this.setState({
            captStatus: 'success',
            captAutoRefreshCount: 0
          })
        } else {
          const { captAutoRefreshCount = 0 } = (this.state as any)
          message.warning(`人机验证失败`)
          if (captAutoRefreshCount > 5) {
            this.setState({
              captStatus: 'overing',
              captAutoRefreshCount: 0
            })
            return
          }
          this.handleRequestCaptCode()
          this.setState({
            captStatus: 'error',
            captAutoRefreshCount: captAutoRefreshCount + 1
          })
        }
      }).catch(() => message.warning(`人机验证失败 1`))
    }).catch(() => message.warning(`人机验证失败 2`))
  }
}
