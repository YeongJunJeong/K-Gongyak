"use client";

import { useMemo, useState } from "react";
import { PROVINCES, findProvince } from "@/data/regions";
import {
  CATEGORIES,
  getSubtypes,
  requiresSubdivision,
  type CandidacyCategory,
} from "@/data/candidacyTypes";
import {
  PARTY_OPTIONS,
  INTERESTS,
  DEMOGRAPHICS,
  type PartyOrientation,
  type InterestKey,
  type DemographicKey,
  type Customization,
} from "@/data/customization";
import type { GenerationResult } from "@/lib/types";

export type { GenerationResult };

export interface ProgressInfo {
  step: number;
  total: number;
  label: string;
}

interface Props {
  onResult: (result: GenerationResult | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onProgress: (progress: ProgressInfo | null) => void;
}

export default function PledgeForm({ onResult, onLoadingChange, onProgress }: Props) {
  const [provinceName, setProvinceName] = useState("");
  const [subdivisionName, setSubdivisionName] = useState("");
  const [category, setCategory] = useState<CandidacyCategory | "">("");
  const [subtypeValue, setSubtypeValue] = useState("");

  // 커스터마이징
  const [party, setParty] = useState<PartyOrientation>("unspecified");
  const [interests, setInterests] = useState<InterestKey[]>([]);
  const [demographics, setDemographics] = useState<DemographicKey[]>([]);
  const [differentiator, setDifferentiator] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const province = useMemo(() => findProvince(provinceName), [provinceName]);
  const needsSubdivision = category ? requiresSubdivision(category) : false;

  const subtypes = useMemo(() => {
    if (!category) return [];
    return getSubtypes(category, province, subdivisionName || undefined);
  }, [category, province, subdivisionName]);

  const handleProvinceChange = (val: string) => {
    setProvinceName(val);
    setSubdivisionName("");
    setSubtypeValue("");
    const p = findProvince(val);
    if (p && p.subdivisions.length === 0 && category && requiresSubdivision(category)) {
      setCategory("");
    }
  };

  const handleCategoryChange = (val: string) => {
    const next = val as CandidacyCategory;
    setCategory(next);
    setSubtypeValue("");
    if (!requiresSubdivision(next)) {
      setSubdivisionName("");
    }
  };

  const handleSubdivisionChange = (val: string) => {
    setSubdivisionName(val);
    setSubtypeValue("");
  };

  const toggleInterest = (k: InterestKey) => {
    setInterests((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : prev.length >= 4 ? prev : [...prev, k]
    );
  };

  const toggleDemographic = (k: DemographicKey) => {
    setDemographics((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  const canSubmit =
    !!provinceName &&
    !!category &&
    (!needsSubdivision || !!subdivisionName) &&
    !!subtypeValue &&
    !submitting;

  const selectedSubtype = subtypes.find((s) => s.value === subtypeValue);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit || !selectedSubtype) return;

    const customization: Customization = {
      party,
      interests,
      demographics,
      differentiator: differentiator.trim() || undefined,
    };

    setSubmitting(true);
    onLoadingChange(true);
    onResult(null);
    onProgress({ step: 0, total: 4, label: "요청 전송 중..." });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provinceName,
          subdivisionName: subdivisionName || undefined,
          candidacyLabel: selectedSubtype.label,
          candidacyCategory: selectedSubtype.category,
          customization,
        }),
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `요청 실패 (${res.status})`);
      }

      // SSE 스트림 파싱
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotResult = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith("data:")) continue;
          const json = trimmed.slice(5).trim();
          if (!json) continue;

          const ev = JSON.parse(json);
          if (ev.type === "progress") {
            onProgress({ step: ev.step, total: ev.total, label: ev.label });
          } else if (ev.type === "result") {
            onResult(ev.payload as GenerationResult);
            gotResult = true;
          } else if (ev.type === "error") {
            throw new Error(ev.message);
          }
        }
      }

      if (!gotResult) {
        throw new Error("결과를 받지 못했습니다.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(msg);
    } finally {
      setSubmitting(false);
      onLoadingChange(false);
      onProgress(null);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gov-gray-200 shadow-sm"
    >
      <div className="bg-gov-gray-50 border-b border-gov-gray-200 px-6 py-3 flex items-center gap-2">
        <div className="w-1 h-4 bg-gov-navy" />
        <h2 className="font-semibold text-gov-gray-800 tracking-tight">
          공약 생성 신청서
        </h2>
        <span className="ml-auto text-xs text-gov-gray-500">
          [양식 제 2026-01호]
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* 1. 광역 지역 */}
        <Field
          label="1. 광역자치단체"
          required
          hint="특별시·광역시·도·특별자치시·특별자치도 중 선택"
        >
          <select
            value={provinceName}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className={selectClass}
          >
            <option value="">-- 선택하세요 --</option>
            {PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        {province && province.subdivisions.length === 0 && (
          <div className="text-sm text-gov-gray-500 bg-gov-gray-50 border border-gov-gray-200 px-4 py-3">
            ※ {province.name}은(는) 기초자치단체가 없어 시·도지사 또는
            광역의원만 선택할 수 있습니다.
          </div>
        )}

        <div className="gov-divider" />

        {/* 2. 출마 대분류 */}
        <Field label="2. 출마 구분" required hint="출마할 직위의 대분류">
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map((c) => {
              const disabled =
                (c.value === "기초단체장" || c.value === "기초의원") &&
                !!province &&
                province.subdivisions.length === 0;
              const active = category === c.value;
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => !disabled && handleCategoryChange(c.value)}
                  disabled={disabled}
                  title={c.description}
                  className={`group relative flex flex-col items-center justify-center px-1 py-3 border transition-colors ${
                    disabled
                      ? "bg-gov-gray-50 border-gov-gray-200 text-gov-gray-300 cursor-not-allowed"
                      : active
                        ? "bg-gov-navy text-white border-gov-navy shadow-sm"
                        : "bg-white border-gov-gray-300 hover:border-gov-navy hover:bg-gov-gray-50"
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono tracking-widest mb-1 ${
                      disabled
                        ? "text-gov-gray-300"
                        : active
                          ? "text-white/70"
                          : "text-gov-gray-400"
                    }`}
                  >
                    {c.glyph}
                  </div>
                  <div className="text-[13px] font-semibold whitespace-nowrap">
                    {c.label}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 leading-tight whitespace-nowrap ${
                      disabled
                        ? "text-gov-gray-300"
                        : active
                          ? "text-white/70"
                          : "text-gov-gray-500"
                    }`}
                  >
                    {c.description}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* 3. 기초 지역 */}
        {category && needsSubdivision && province && province.subdivisions.length > 0 && (
          <Field
            label="3. 기초자치단체"
            required
            hint="출마 지역구의 시·군·구를 선택하세요"
          >
            <select
              value={subdivisionName}
              onChange={(e) => handleSubdivisionChange(e.target.value)}
              className={selectClass}
            >
              <option value="">-- 선택하세요 --</option>
              {province.subdivisions.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* 세부 출마 유형 */}
        {category && (
          <Field
            label={needsSubdivision ? "4. 세부 출마 유형" : "3. 세부 출마 유형"}
            required
            hint="선택한 지역·구분에 따라 가능한 직위가 표시됩니다"
          >
            {subtypes.length === 0 ? (
              <div className="text-sm text-gov-gray-500 bg-gov-gray-50 border border-gov-gray-200 px-4 py-3">
                {needsSubdivision
                  ? "기초자치단체를 먼저 선택해주세요."
                  : "선택 가능한 직위가 없습니다."}
              </div>
            ) : (
              <div className="space-y-2">
                {subtypes.map((s) => (
                  <label
                    key={s.value}
                    className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-colors ${
                      subtypeValue === s.value
                        ? "bg-gov-navy/5 border-gov-navy"
                        : "bg-white border-gov-gray-300 hover:border-gov-navy"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subtype"
                      value={s.value}
                      checked={subtypeValue === s.value}
                      onChange={(e) => setSubtypeValue(e.target.value)}
                      className="mt-1 accent-gov-navy"
                    />
                    <div>
                      <div className="font-medium text-gov-gray-800">
                        {s.label}
                      </div>
                      <div className="text-xs text-gov-gray-500 mt-0.5">
                        관할: {s.scope}자치 · 대분류: {s.category}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Field>
        )}

        <div className="gov-divider" />

        {/* 후보자 프로필 섹션 */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gov-navy" />
            <h3 className="font-semibold text-gov-gray-800 text-sm tracking-tight">
              후보자 프로필 <span className="text-gov-gray-400 font-normal text-xs">(선택 · 입력 시 더 차별화된 공약 생성)</span>
            </h3>
          </div>

          {/* 정당 성향 */}
          <Field label="정당 성향" hint="공약의 톤과 프레이밍 결정">
            <div className="grid grid-cols-4 md:grid-cols-7 gap-1">
              {PARTY_OPTIONS.map((p) => {
                const active = party === p.value;
                return (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => setParty(p.value)}
                    title={p.hint}
                    className={`text-[12px] px-2 py-2 border transition-colors ${
                      active
                        ? "bg-gov-navy text-white border-gov-navy"
                        : "bg-white border-gov-gray-300 hover:border-gov-navy"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* 핵심 관심사 */}
          <Field
            label="핵심 관심사"
            hint={`중점 영역 선택 (최대 4개 · ${interests.length}/4)`}
          >
            <div className="grid grid-cols-3 md:grid-cols-3 gap-1">
              {INTERESTS.map((i) => {
                const active = interests.includes(i.value);
                const disabled = !active && interests.length >= 4;
                return (
                  <button
                    type="button"
                    key={i.value}
                    onClick={() => !disabled && toggleInterest(i.value)}
                    disabled={disabled}
                    className={`text-[12px] px-2 py-2 border transition-colors text-left ${
                      active
                        ? "bg-gov-navy/5 border-gov-navy text-gov-navy font-semibold"
                        : disabled
                          ? "bg-gov-gray-50 border-gov-gray-200 text-gov-gray-300 cursor-not-allowed"
                          : "bg-white border-gov-gray-300 hover:border-gov-navy"
                    }`}
                  >
                    <span className={`inline-block w-3 text-center mr-1 ${active ? "" : "text-gov-gray-400"}`}>
                      {active ? "■" : "□"}
                    </span>
                    {i.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* 타겟 유권자층 */}
          <Field label="타겟 유권자층" hint="공약 대상층 (복수 선택 가능)">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
              {DEMOGRAPHICS.map((d) => {
                const active = demographics.includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleDemographic(d.value)}
                    className={`text-[12px] px-2 py-2 border transition-colors text-left ${
                      active
                        ? "bg-gov-navy/5 border-gov-navy text-gov-navy font-semibold"
                        : "bg-white border-gov-gray-300 hover:border-gov-navy"
                    }`}
                  >
                    <span className={`inline-block w-3 text-center mr-1 ${active ? "" : "text-gov-gray-400"}`}>
                      {active ? "■" : "□"}
                    </span>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* 차별화 포인트 */}
          <Field
            label="차별화 포인트"
            hint="현직 단체장 비판, 특정 이슈, 자유 서술 등 (선택)"
          >
            <textarea
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={2}
              placeholder="예) 현직이 추진한 ○○사업의 예산 낭비 문제를 지적하고, 실효성 있는 대안 제시에 초점"
              className="w-full px-3 py-2 border border-gov-gray-300 bg-white text-gov-gray-800 text-sm focus:outline-none focus:border-gov-navy focus:ring-1 focus:ring-gov-navy resize-none"
            />
            <div className="text-right text-[11px] text-gov-gray-400 mt-1">
              {differentiator.length}/300
            </div>
          </Field>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            ⚠ {error}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3 border-t border-gov-gray-200 -mx-6 -mb-6 px-6 py-4 bg-gov-gray-50">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-8 py-3 font-semibold tracking-tight transition-colors ${
              canSubmit
                ? "bg-gov-navy hover:bg-gov-navy-dark text-white"
                : "bg-gov-gray-200 text-gov-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "생성 중..." : "공약 생성하기"}
          </button>
        </div>
      </div>
    </form>
  );
}

const selectClass =
  "w-full px-3 py-2.5 border border-gov-gray-300 bg-white text-gov-gray-800 focus:outline-none focus:border-gov-navy focus:ring-1 focus:ring-gov-navy";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-sm font-semibold text-gov-gray-700">
          {label}
          {required && <span className="text-gov-red ml-1">*</span>}
        </label>
        {hint && <span className="text-xs text-gov-gray-500">· {hint}</span>}
      </div>
      {children}
    </div>
  );
}
