export default function Footer() {
  return (
    <footer className="mt-auto bg-gov-navy-dark text-white/80 text-sm no-print">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between gap-3">
        <div>
          <div className="font-semibold text-white">공약생성기</div>
          <div className="text-white/60 text-xs mt-1">
            본 서비스는 참고용 AI 생성 결과이며, 실제 공약 발표 시에는
            전문가의 검토가 필요합니다.
          </div>
        </div>
        <div className="text-xs text-white/50 self-end">
          © 2026 Policy Generator. Powered by OpenAI.
        </div>
      </div>
    </footer>
  );
}
