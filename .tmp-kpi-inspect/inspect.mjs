import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "H:/Excel_KPI_Homies_Milk_Tea_tu_dong-Genspark_AI_Sheets-20260623_1723.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const sheets = await workbook.inspect({
  kind: "sheet",
  include: "id,name",
  maxChars: 12000,
});
console.log("SHEETS");
console.log(sheets.ndjson);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table,definedName,drawing",
  maxChars: 30000,
  tableMaxRows: 12,
  tableMaxCols: 12,
  tableMaxCellChars: 160,
});
console.log("OVERVIEW");
console.log(overview.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (!used) continue;

  const address = used.address ?? used.getAddress?.() ?? "A1:Z100";
  const region = await workbook.inspect({
    kind: "region",
    sheetId: sheet.name,
    range: address,
    maxChars: 30000,
    tableMaxRows: 80,
    tableMaxCols: 24,
    tableMaxCellChars: 240,
  });
  console.log(`REGION ${sheet.name} ${address}`);
  console.log(region.ndjson);

  const formulas = await workbook.inspect({
    kind: "formula",
    sheetId: sheet.name,
    range: address,
    maxChars: 15000,
    options: { maxResults: 250 },
  });
  console.log(`FORMULAS ${sheet.name}`);
  console.log(formulas.ndjson);
}
