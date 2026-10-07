
"use client";
export default function PrintButtons({ pdf=false }: { pdf?: boolean }) {
  return (
    <div className="printBtns no-print">
      <button className="btn" onClick={() => window.print()}>🖨️ پرینت</button>
      {pdf && <button className="btn primary" onClick={() => window.print()}>📄 ذخیره PDF</button>}
    </div>
  );
}
