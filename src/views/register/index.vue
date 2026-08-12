<template>
  <div class="login-container">
    <el-form ref="registerForm" :model="registerForm" :rules="registerRules" class="login-form" auto-complete="on" label-position="left">
      <div class="title-container">
        <h3 class="title">用户注册</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="registerForm.username"
          placeholder="请输入用户名"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="mobile">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="mobile"
          v-model="registerForm.mobile"
          placeholder="请输入手机号码"
          name="mobile"
          type="text"
          tabindex="2"
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
          v-model="registerForm.password"
          :type="passwordType"
          placeholder="请输入密码"
          name="password"
          tabindex="3"
          auto-complete="on"
          @keyup.enter.native="onRegister"
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
          v-model="registerForm.code"
          placeholder="请输入验证码"
          name="code"
          type="text"
          tabindex="4"
          auto-complete="off"
        />
        <img :src="captcha" class="captcha-img" @click="getCode">
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="onRegister">注册</el-button>

      <div class="login-footer">
        <span @click="onGoLogin">已有账号,立即登录</span>
      </div>

    </el-form>
  </div>
</template>

<script>
import { getVerify } from '@/api/user'

export default {
  name: 'Register',
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
      registerForm: {
        username: '',
        mobile: '',
        password: '',
        code: '',
        uuid: undefined
      },
      registerRules: {
        username: [{ required: true, trigger: 'blur', message: '用户名不能为空' }],
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
    getCode() {
      getVerify().then(res => {
        this.registerForm.uuid = res.data.uuid
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
    onRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/register', this.registerForm).then(() => {
            this.$message.success('注册成功, 请登录')
            this.$router.push({ path: '/login' })
            this.loading = false
          }).catch(() => {
            this.getCode()
            this.registerForm.code = ''
            this.loading = false
          })
        }
      })
    },
    onGoLogin() {
      this.$router.replace({ path: '/login' })
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
    padding: 120px 35px 0;
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
    text-align: center;
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
