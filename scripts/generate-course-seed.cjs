const fs = require("node:fs");
const path = require("node:path");
const ts = require(path.join(__dirname, "..", "frontend", "node_modules", "typescript"));

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "frontend", "src", "lib", "course.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleExports = {};
new Function("exports", transpiled)(moduleExports);

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sql = [
  "-- Generated from frontend/src/lib/course.ts by scripts/generate-course-seed.cjs.",
  "-- Flyway migrations are immutable; generate a new migration for future content edits.",
];

for (const courseModule of moduleExports.modules) {
  const slug = quote(courseModule.slug);
  const title = quote(courseModule.title);
  sql.push(`INSERT INTO quizzes(module_id,title,passing_score,published) SELECT id, ${title} || ' — questionário', 70, TRUE FROM modules WHERE slug = ${slug} ON CONFLICT (module_id) DO NOTHING;`);
  courseModule.questions.forEach((question, questionIndex) => {
    const prompt = quote(question.prompt);
    const explanation = quote(question.explanation);
    const qPos = questionIndex + 1;
    sql.push(`INSERT INTO questions(quiz_id,prompt,explanation,position) SELECT q.id, ${prompt}, ${explanation}, ${qPos} FROM quizzes q JOIN modules m ON m.id=q.module_id WHERE m.slug=${slug} ON CONFLICT (quiz_id,position) DO NOTHING;`);
    question.options.forEach((option, optionIndex) => {
      const body = quote(option);
      const correct = optionIndex === question.answer ? "TRUE" : "FALSE";
      const oPos = optionIndex + 1;
      sql.push(`INSERT INTO answer_options(question_id,body,is_correct,position) SELECT qn.id, ${body}, ${correct}, ${oPos} FROM questions qn JOIN quizzes q ON q.id=qn.quiz_id JOIN modules m ON m.id=q.module_id WHERE m.slug=${slug} AND qn.position=${qPos} ON CONFLICT (question_id,position) DO NOTHING;`);
    });
  });
}

const outputPath = path.join(root, "backend", "src", "main", "resources", "db", "migration", "V3__seed_quiz_questions.sql");
fs.writeFileSync(outputPath, `${sql.join("\n")}\n`, "utf8");
process.stdout.write(`Generated ${moduleExports.modules.length} modules and ${moduleExports.modules.reduce((count, item) => count + item.questions.length, 0)} questions into ${path.relative(root, outputPath)}\n`);
