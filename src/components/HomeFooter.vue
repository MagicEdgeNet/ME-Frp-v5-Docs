<template>
  <footer class="footer" :class="{ 'is-dark': isDarkMode }">
    <div class="footer-content">
      <div class="footer-left">
        <div class="footer-logos">
          <div class="footer-logo">
            <img src="/favicon.svg" alt="幻缘映射" />
            <div class="footer-logo-text">
              <span class="logo-title">幻缘映射 MagicEdge Frp</span>
              <span class="logo-subtitle">由幻缘网络与云上极致运营</span>
            </div>
          </div>
        </div>
        <p>Copyright © MENET 2021-2026. All rights reserved.</p>
        <p class="legal-line">
          <a href="https://内网穿透.中国/" target="_blank" rel="noopener noreferrer">
            <img class="nq-icp-icon" src="https://img.fastmirror.net/s/2025/07/22/687f8d53e18f5.png"
              alt="内网穿透联盟统一识别编码: AZWB66WB" />
            <span class="license-text">内网穿透联盟统一识别编码: AZWB66WB</span>
          </a>
        </p>
      </div>
      <div class="footer-right">
        <div class="footer-links">
          <a href="https://www.mefrp.com/policy?tab=terms">服务协定</a>
          <a href="https://www.mefrp.com/dashboard/help">联系我们</a>
        </div>
      </div>
    </div>

    <!-- 横跨整行的备案与合规信息 -->
    <div class="footer-legal">
      <p class="legal-notice">
        本站仅提供内网穿透、端口映射等技术服务，不提供任何游戏及相关服务，与防沉迷规定无关。用户须遵守本站<a
          href="https://www.mefrp.com/policy?tab=terms">服务协定</a>及法律法规，不得利用本站服务从事任何违法违规活动；违者本站有权暂停或终止服务、向主管部门报告，由此产生的法律责任由用户自行承担。
      </p>
      <div class="legal-licenses">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          <img class="nq-icp-icon" src="/pic/6a7d55b290ffe.png" alt="ICP 备案号: 津ICP备2026003267号-2" />
          <span class="license-text">ICP 备案号: 津ICP备2026003267号-2</span>
        </a>
        <a href="https://dxzhgl.miit.gov.cn/dxxzsp/xkz/xkzgl/resource/qiyesearch.jsp?num=B1-20263718" target="_blank"
          rel="noopener noreferrer">
          <img class="nq-icp-icon" src="/pic/6acf49a93b1f5.png" alt="全国电信增值业务经营许可证：B1-20263718" />
          <span class="license-text">全国电信增值业务经营许可证（CDN/VPN/ISP/IDC）：B1-20263718</span>
        </a>
        <a href="https://www.gsxt.gov.cn/" target="_blank" rel="noopener noreferrer">
          <img class="nq-icp-icon" src="/pic/6acf49efc3cb3.png" alt="统一社会信用代码：91440300MAKJLQ6K8C" />
          <span class="license-text">统一社会信用代码：91440300MAKJLQ6K8C</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import type { ThemeContext } from '../types/theme'

const themeCtx = inject<ThemeContext | null>('theme', null)
const isDarkMode = themeCtx?.isDarkMode ?? ref(false)
</script>

<style lang="scss" scoped>
@use '../assets/styles/components/homeFooter.scss';
</style>
