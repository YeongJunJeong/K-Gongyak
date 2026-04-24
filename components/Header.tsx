export default function Header() {
  return (
    <header className="bg-gov-navy text-white no-print">
      {/* 상단 얇은 바 - 태극 컬러 악센트 */}
      <div className="h-1 flex">
        <div className="flex-1 bg-gov-red" />
        <div className="flex-1 bg-gov-blue" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 정부 상징 느낌의 엠블럼 */}
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gov-red" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gov-blue" />
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.3em] text-white/70">
              REPUBLIC OF KOREA · LOCAL ELECTION 2026
            </div>
            <div className="text-lg font-bold tracking-tight">
              제9회 전국동시지방선거 공약생성기
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <span className="border-l border-white/20 pl-6">
            지역 현안 기반 정책 제안 시스템
          </span>
        </nav>
      </div>

      {/* 아래 구분선 */}
      <div className="h-px bg-white/15" />
    </header>
  );
}
