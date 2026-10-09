
export default function AbsenceLegend(){
  return (
    <div className="riskLegend">
      <div className="riskLegendTitle">
        <b>وضعیت غیبت دانش‌آموزان</b>
        <span>رنگ کارت هر دانش‌آموز بر اساس تعداد غیبت ثبت‌شده تعیین می‌شود.</span>
      </div>
      <div className="riskLegendItems">
        <div className="riskLegendItem riskGreen">
          <span className="riskDot"></span>
          <div><b>وضعیت عادی</b><small>۰ تا ۲ غیبت</small></div>
        </div>
        <div className="riskLegendItem riskYellow">
          <span className="riskDot"></span>
          <div><b>نیاز به توجه</b><small>۳ تا ۴ غیبت</small></div>
        </div>
        <div className="riskLegendItem riskRed">
          <span className="riskDot"></span>
          <div><b>هشدار جدی</b><small>۵ غیبت و بیشتر</small></div>
        </div>
      </div>
    </div>
  );
}
