import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load(
  "H:/Excel_KPI_Homies_Milk_Tea_tu_dong-Genspark_AI_Sheets-20260623_1723.xlsx",
);
const workbook = await SpreadsheetFile.importXlsx(input);

const targets = [
  ["FORM_KPI", "A1:H45"],
  ["Sheet1", "A1:N144"],
  ["PEER_FEEDBACK", "A1:I73"],
  ["DATA_POS_BSC", "A1:H30"],
  ["DATA_POS_BSC", "A70:H125"],
  ["DATA_POS_BSC", "A170:H210"],
];

for (const [sheetName, range] of targets) {
  const result = await workbook.inspect({
    kind: "table",
    sheetId: sheetName,
    range,
    include: "values,formulas",
    maxChars: 30000,
    tableMaxRows: 160,
    tableMaxCols: 16,
    tableMaxCellChars: 300,
  });
  console.log(`TARGET ${sheetName}!${range}`);
  console.log(result.ndjson);
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula errors",
  maxChars: 10000,
});
console.log("ERRORS");
console.log(errors.ndjson);
