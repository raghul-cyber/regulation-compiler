import re

file_path = r"apps\web\src\components\regulations\pipeline-progress.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the state variables we added previously
content = re.sub(r'const \[isGeneratingReport.*?\} catch \(e: any\) \{.*?\}\n  \}', '', content, flags=re.DOTALL)

# Add the import for ReportGenerator
content = content.replace("import { generateReport, pollReports } from '@/app/actions';", "import { ReportGenerator } from './report-generator';")

# Replace the button with <ReportGenerator />
old_btn = """<button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="group flex items-center justify-between p-4 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/50 rounded-lg text-purple-400">
                  {isGeneratingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-purple-100">
                     {isGeneratingReport ? reportStatus : 'Generate Report'}
                  </div>
                  <div className="text-xs text-purple-300/70">Produce the compliance manifest</div>
                </div>
              </div>
              {!isGeneratingReport && <ArrowRight className="w-5 h-5 text-purple-500/50 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />}
            </button>"""

new_component = """{regulationId && <ReportGenerator regulationId={regulationId} getToken={getToken} />}"""

content = content.replace(old_btn, new_component)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("pipeline-progress.tsx patched!")
