"use client";

import { useMemo, useState } from "react";

type WorkType = "wall" | "ceiling" | "wallCeiling";
type InputMode = "cad" | "area" | "dimensions";
type WallpaperType = "silk" | "paper" | "custom";
type LossRateOption = "10" | "15" | "20" | "custom";

type CalculationInput = {
  totalArea: number;
  excludedArea: number;
  wallpaperWidth: number;
  wallpaperLength: number;
  lossRatePercent: number;
};

type CalculationResult = {
  rollArea: number;
  actualArea: number;
  lossAppliedArea: number;
  requiredRolls: number;
};

const SQUARE_METERS_PER_PYEONG = 3.3058;

const workTypeLabels: Record<WorkType, string> = {
  wall: "벽",
  ceiling: "천장",
  wallCeiling: "벽 + 천장",
};

const wallpaperTypeLabels: Record<WallpaperType, string> = {
  silk: "실크벽지",
  paper: "합지벽지",
  custom: "직접입력",
};

const wallpaperDefaults: Record<WallpaperType, { width: string; length: string }> = {
  silk: { width: "1.06", length: "15.6" },
  paper: { width: "1.06", length: "15.6" },
  custom: { width: "", length: "" },
};

const inputModeLabels: Record<InputMode, string> = {
  cad: "CAD 영역값 입력",
  area: "면적 직접 입력",
  dimensions: "가로 × 세로/높이",
};

function toNonNegativeNumber(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function formatSquareMeter(value: number): string {
  return value.toFixed(2);
}

function formatPyeong(value: number): string {
  return (value / SQUARE_METERS_PER_PYEONG).toFixed(2);
}

function formatAreaWithPyeong(value: number): string {
  return `${formatSquareMeter(value)}㎡ / ${formatPyeong(value)}평`;
}

function formatAreaWithApproxPyeong(value: number): string {
  return `${formatSquareMeter(value)}㎡ / 약 ${formatPyeong(value)}평`;
}

function formatMeasurement(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function formatMeter(value: number): string {
  return value.toFixed(2);
}

function calculateWallpaperOrder(input: CalculationInput): CalculationResult {
  const rollArea =
    input.wallpaperWidth > 0 && input.wallpaperLength > 0
      ? input.wallpaperWidth * input.wallpaperLength
      : 0;
  const actualArea = Math.max(input.totalArea - input.excludedArea, 0);
  const lossAppliedArea = actualArea * (1 + input.lossRatePercent / 100);
  const requiredRolls = rollArea > 0 ? Math.ceil(lossAppliedArea / rollArea) : 0;

  return {
    rollArea,
    actualArea,
    lossAppliedArea,
    requiredRolls,
  };
}

export default function Home() {
  const [spaceName, setSpaceName] = useState("거실");
  const [workType, setWorkType] = useState<WorkType>("wall");
  const [inputMode, setInputMode] = useState<InputMode>("cad");
  const [cadAreaSquareMillimeter, setCadAreaSquareMillimeter] = useState("6900000");
  const [cadPerimeterMillimeter, setCadPerimeterMillimeter] = useState("");
  const [area, setArea] = useState("52");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [excludedArea, setExcludedArea] = useState("0");
  const [wallpaperType, setWallpaperType] = useState<WallpaperType>("silk");
  const [wallpaperWidth, setWallpaperWidth] = useState(wallpaperDefaults.silk.width);
  const [wallpaperLength, setWallpaperLength] = useState(wallpaperDefaults.silk.length);
  const [lossRateOption, setLossRateOption] = useState<LossRateOption>("15");
  const [customLossRate, setCustomLossRate] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const totalArea =
    inputMode === "cad"
      ? toNonNegativeNumber(cadAreaSquareMillimeter) / 1000000
      : inputMode === "area"
        ? toNonNegativeNumber(area)
        : (toNonNegativeNumber(width) * toNonNegativeNumber(height)) / 1000000;
  const cadPerimeterMeter = toNonNegativeNumber(cadPerimeterMillimeter) / 1000;
  const hasCadPerimeter = inputMode === "cad" && cadPerimeterMeter > 0;
  const lossRatePercent =
    lossRateOption === "custom"
      ? toNonNegativeNumber(customLossRate)
      : toNonNegativeNumber(lossRateOption);
  const numericWallpaperWidth = toNonNegativeNumber(wallpaperWidth);
  const numericWallpaperLength = toNonNegativeNumber(wallpaperLength);
  const numericExcludedArea = toNonNegativeNumber(excludedArea);

  const calculation = useMemo(
    () =>
      calculateWallpaperOrder({
        totalArea,
        excludedArea: numericExcludedArea,
        wallpaperWidth: numericWallpaperWidth,
        wallpaperLength: numericWallpaperLength,
        lossRatePercent,
      }),
    [
      totalArea,
      numericExcludedArea,
      numericWallpaperWidth,
      numericWallpaperLength,
      lossRatePercent,
    ],
  );
  const cadPerimeterOrderLine = hasCadPerimeter
    ? `
CAD 둘레 참고: ${formatMeter(cadPerimeterMeter)}m`
    : "";

  const orderText = useMemo(
    () => `[도배 자재 발주]

공간: ${spaceName.trim() || "미입력"}
구분: ${workTypeLabels[workType]}
벽지: ${wallpaperTypeLabels[wallpaperType]}
규격: 폭 ${formatMeasurement(numericWallpaperWidth)}m × 길이 ${formatMeasurement(
      numericWallpaperLength,
    )}m
시공면적: ${formatAreaWithPyeong(totalArea)}
제외면적: ${formatAreaWithPyeong(numericExcludedArea)}
로스적용면적: ${formatAreaWithPyeong(calculation.lossAppliedArea)}
수량: ${calculation.requiredRolls}롤${cadPerimeterOrderLine}`,
    [
      cadPerimeterOrderLine,
      calculation.lossAppliedArea,
      calculation.requiredRolls,
      numericExcludedArea,
      numericWallpaperLength,
      numericWallpaperWidth,
      spaceName,
      totalArea,
      wallpaperType,
      workType,
    ],
  );

  function handleWallpaperTypeChange(type: WallpaperType) {
    setWallpaperType(type);
    setWallpaperWidth(wallpaperDefaults[type].width);
    setWallpaperLength(wallpaperDefaults[type].length);
  }

  async function handleCopyOrderText() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopyStatus("발주 문구를 복사했습니다.");
    } catch {
      setCopyStatus("복사에 실패했습니다. 내용을 직접 선택해 복사해 주세요.");
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-950 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-stone-600">다움인테리어</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal">다움 도배 계산기</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            도배 자재 발주 전 참고용으로 필요한 롤 수를 간단히 계산합니다.
          </p>
        </header>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-semibold">입력</h2>

          <div className="mt-5 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-stone-700">공간명</span>
              <input
                className="h-12 rounded-md border border-stone-300 px-3 text-base outline-none focus:border-stone-900"
                value={spaceName}
                onChange={(event) => setSpaceName(event.target.value)}
                placeholder="예: 거실, 안방, 작은방"
              />
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-stone-700">시공 구분</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(workTypeLabels) as WorkType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`h-11 rounded-md border text-sm font-semibold ${
                      workType === type
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-white text-stone-700"
                    }`}
                    onClick={() => setWorkType(type)}
                  >
                    {workTypeLabels[type]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-stone-700">입력 방식</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(inputModeLabels) as InputMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`min-h-11 rounded-md border px-2 py-2 text-sm font-semibold ${
                      inputMode === mode
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-white text-stone-700"
                    }`}
                    onClick={() => setInputMode(mode)}
                  >
                    {inputModeLabels[mode]}
                  </button>
                ))}
              </div>
            </fieldset>

            {inputMode === "cad" ? (
              <div className="grid gap-3">
                <NumberInput
                  label="CAD 영역값(mm²)"
                  value={cadAreaSquareMillimeter}
                  onChange={setCadAreaSquareMillimeter}
                  placeholder="6900000"
                />
                <NumberInput
                  label="CAD 둘레(mm, 선택)"
                  value={cadPerimeterMillimeter}
                  onChange={setCadPerimeterMillimeter}
                  placeholder="42540"
                />
                <p className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800">
                  계산면적: {formatAreaWithPyeong(totalArea)}
                </p>
                {hasCadPerimeter ? (
                  <p className="text-sm font-medium text-stone-600">
                    CAD 둘레 참고: {formatMeter(cadPerimeterMeter)}m
                  </p>
                ) : null}
              </div>
            ) : inputMode === "area" ? (
              <div className="grid gap-3">
                <NumberInput
                  label="시공면적(㎡)"
                  value={area}
                  onChange={setArea}
                  placeholder="6.9"
                />
                <p className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800">
                  계산면적: {formatAreaWithPyeong(totalArea)}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm font-medium text-stone-600">
                  벽은 가로 × 높이, 천장은 가로 × 세로로 입력하세요.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberInput
                    label="가로(mm)"
                    value={width}
                    onChange={setWidth}
                    placeholder="3000"
                  />
                  <NumberInput
                    label="세로/높이(mm)"
                    value={height}
                    onChange={setHeight}
                    placeholder="2300"
                  />
                </div>
                <p className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-800">
                  계산면적: {formatAreaWithPyeong(totalArea)}
                </p>
              </div>
            )}

            <NumberInput
              label="제외면적(㎡)"
              value={excludedArea}
              onChange={setExcludedArea}
              placeholder="0"
            />

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-stone-700">벽지 종류</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(wallpaperTypeLabels) as WallpaperType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`h-11 rounded-md border text-sm font-semibold ${
                      wallpaperType === type
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-white text-stone-700"
                    }`}
                    onClick={() => handleWallpaperTypeChange(type)}
                  >
                    {wallpaperTypeLabels[type]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput
                label="벽지 폭(m)"
                value={wallpaperWidth}
                onChange={setWallpaperWidth}
                placeholder="1.06"
              />
              <NumberInput
                label="벽지 길이(m)"
                value={wallpaperLength}
                onChange={setWallpaperLength}
                placeholder="15.6"
              />
            </div>
            {wallpaperType === "silk" ? (
              <p className="text-sm font-medium text-stone-600">
                실크벽지 1롤은 약 5평 기준입니다.
              </p>
            ) : null}

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-stone-700">로스율</legend>
              <div className="grid grid-cols-4 gap-2">
                {(["10", "15", "20", "custom"] as LossRateOption[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`h-11 rounded-md border text-sm font-semibold ${
                      lossRateOption === option
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-white text-stone-700"
                    }`}
                    onClick={() => setLossRateOption(option)}
                  >
                    {option === "custom" ? "직접입력" : `${option}%`}
                  </button>
                ))}
              </div>
            </fieldset>

            {lossRateOption === "custom" ? (
              <NumberInput
                label="직접입력 로스율(%)"
                value={customLossRate}
                onChange={setCustomLossRate}
                placeholder="15"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-semibold">계산 결과</h2>
          <div className="mt-4 rounded-lg bg-stone-950 p-5 text-white">
            <p className="text-sm text-stone-300">도배지 발주</p>
            <p className="mt-1 text-5xl font-bold">{calculation.requiredRolls}롤</p>
            <div className="mt-4 grid gap-2 text-sm text-stone-200">
              <p>시공면적: {formatAreaWithPyeong(totalArea)}</p>
              <p>로스적용면적: {formatAreaWithPyeong(calculation.lossAppliedArea)}</p>
              <p>1롤 면적: {formatAreaWithApproxPyeong(calculation.rollArea)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-stone-700">
            <p className="font-semibold text-stone-950">상세 계산</p>
            <p>시공면적: {formatAreaWithPyeong(totalArea)}</p>
            <p>제외면적: {formatAreaWithPyeong(numericExcludedArea)}</p>
            <p>실제 계산면적: {formatAreaWithPyeong(calculation.actualArea)}</p>
            <p>로스율: {formatMeasurement(lossRatePercent)}%</p>
            {hasCadPerimeter ? <p>CAD 둘레 참고: {formatMeter(cadPerimeterMeter)}m</p> : null}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">거래처 발주용 복사</h2>
            <button
              type="button"
              className="h-12 rounded-md bg-stone-950 px-5 text-sm font-bold text-white"
              onClick={handleCopyOrderText}
            >
              복사
            </button>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-stone-100 p-4 text-sm leading-6 text-stone-800">
            {orderText}
          </pre>
          {copyStatus ? <p className="mt-3 text-sm text-stone-600">{copyStatus}</p> : null}
        </section>

        <p className="pb-4 text-center text-xs leading-5 text-stone-500">
          도배지는 무늬 맞춤, 재단 방향, 현장 여건에 따라 실제 발주량이 달라질 수 있습니다.
        </p>
      </div>
    </main>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="h-12 rounded-md border border-stone-300 px-3 text-base outline-none focus:border-stone-900"
        inputMode="decimal"
        min="0"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onWheel={(event) => event.currentTarget.blur()}
        placeholder={placeholder}
      />
    </label>
  );
}
