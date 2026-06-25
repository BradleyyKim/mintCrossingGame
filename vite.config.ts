import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// OG/메타의 절대 URL. 빌드 환경에 따라 자동 결정:
//  - Vercel: VERCEL_PROJECT_PRODUCTION_URL(시스템 변수) → 프로덕션 도메인
//  - 커스텀 도메인 등 수동 지정: VITE_SITE_URL
//  - 로컬: 개발 서버 주소
const siteUrl =
  process.env.VITE_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:5180')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // index.html 의 __SITE_URL__ 자리표시자를 빌드 시점에 실제 도메인으로 치환
      name: 'inject-site-url',
      transformIndexHtml(html) {
        return html.replaceAll('__SITE_URL__', siteUrl)
      },
    },
  ],
  server: {
    host: true, // LAN IP 로도 접속 가능 → 휴대폰에서 바로 테스트
    port: 5180, // 5173 은 다른 프로젝트가 쓰는 경우가 있어 충돌 회피
  },
})
