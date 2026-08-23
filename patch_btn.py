import re

file_path = r"apps\web\src\components\regulations\pipeline-progress.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add state variables
state_vars = """
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!regulationId) return;
    try {
      setIsGeneratingReport(true);
      setReportStatus("Initiating...");
      
      const { generateReport, pollReports } = await import('@/app/actions');
      
      const res = await generateReport(regulationId, 'full_compliance');
      if (!res.success) throw new Error(res.error);
      
      setReportStatus("Generating PDF...");
      const poll = setInterval(async () => {
        const reportsRes = await pollReports(regulationId);
        if (reportsRes && reportsRes.data && reportsRes.data.length > 0) {
           const latest = reportsRes.data[0];
           if (latest.status === 'completed' && latest.download_url) {
              clearInterval(poll);
              setReportStatus("Downloading...");
              window.open(latest.download_url, '_blank');
              setTimeout(() => setIsGeneratingReport(false), 2000);
           } else if (latest.status === 'failed') {
              clearInterval(poll);
              setReportStatus("Failed");
              setTimeout(() => setIsGeneratingReport(false), 3000);
           }
        }
      }, 2000);
    } catch (e: any) {
       console.error(e);
       setReportStatus("Error");
       setTimeout(() => setIsGeneratingReport(false), 3000);
    }
  };
"""

content = content.replace("const [isRetrying, setIsRetrying] = useState(false);", "const [isRetrying, setIsRetrying] = useState(false);\n" + state_vars)

# 2. Replace button
old_btn = """<button className="group flex items-center justify-between p-4 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/50 rounded-lg text-purple-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-purple-100">Generate Report</div>
                  <div className="text-xs text-purple-300/70">Produce the compliance manifest</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-500/50 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
            </button>"""

new_btn = """<button 
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

content = content.replace(old_btn, new_btn)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched pipeline-progress.tsx")
