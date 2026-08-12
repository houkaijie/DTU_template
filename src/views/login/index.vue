<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">
      <div class="title-container">
        <h3 class="title">DTU配置平台-用户登录</h3>
      </div>

      <el-form-item prop="mobile">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="mobile"
          v-model="loginForm.mobile"
          placeholder="请输入手机号码"
          name="mobile"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="请输入密码"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <el-form-item prop="code">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="code"
          v-model="loginForm.code"
          placeholder="请输入验证码"
          name="code"
          type="text"
          tabindex="3"
          auto-complete="off"
        />
        <img :src="captcha" class="captcha-img" @click="getCode">
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">登录</el-button>

      <div class="login-footer">
        <el-popover
          width="350"
          trigger="click"
          placement="top-start"
          title="提示"
          content="联系厂家找回密码，联系方式17205779883"
        >
          <span slot="reference" class="forgot">忘记密码?</span>
        </el-popover>
        <span class="register" @click="handleRegister">立即注册</span>
      </div>

    </el-form>
  </div>
</template>

<script>
import { getVerify } from '@/api/user'

export default {
  name: 'Login',
  data() {
    const validateMobile = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入手机号码'))
      } else if (!/^1\d{10}$/.test(value)) {
        callback(new Error('请输入正确的手机号码'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 6) {
        callback(new Error('密码长度不能小于6位'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        mobile: '',
        password: '',
        code: '',
        uuid: undefined
      },
      loginRules: {
        mobile: [{ required: true, trigger: 'blur', validator: validateMobile }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        code: [{ required: true, trigger: 'blur', message: '验证码不能为空' }]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined,
      captcha: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    this.getCode()
  },
  methods: {
    // 获取图形验证码
    getCode() {
      getVerify().then(res => {
        this.loginForm.uuid = res.data.uuid
        this.captcha = res.data.captcha
      })
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm).then(() => {
            this.$router.push({ path: this.redirect || '/' })
            this.loading = false
          }).catch(() => {
            // 验证码失败时刷新
            this.getCode()
            this.loginForm.code = ''
            this.loading = false
          })
        }
      })
    },
    handleRegister() {
      this.$router.push({ path: '/register' })
    }
  }
}
</script>

<style lang="scss">
$bg:#2d3a4b;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }

  .captcha-img {
    height: 35px;
    margin: 0 10px;
    cursor: pointer;
    border-radius: 4px;
    vertical-align: middle;
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  background-image: linear-gradient(160deg, #2d3a4b 0%, #1f2d3d 100%);
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 140px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
      letter-spacing: 2px;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .login-footer {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    span {
      font-size: 14px;
      color: #889aa4;
      cursor: pointer;

      &:hover {
        color: #409eff;
      }
    }
  }
}
</style>
